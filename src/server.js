// Servidor Fastify: webhook Meta, procesamiento asíncrono, panel API y Socket.io

import Fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifyRateLimit from '@fastify/rate-limit'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { Server as SocketIO } from 'socket.io'
import { brain } from './brain/index.js'
import { sendWhatsAppMessage } from './utils/whatsapp.js'
import { verifyJWT } from './middleware/auth.js'
import panelRoutes from './routes/panel.js'
import authRoutes from './routes/auth.js'

const prisma = new PrismaClient()

const PORT = parseInt(process.env.PORT ?? '3000', 10)
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN ?? 'mate_secret_xyz'
const APP_SECRET = process.env.META_APP_SECRET ?? ''
const IS_DEV = (process.env.NODE_ENV ?? 'development') === 'development'
const JWT_SECRET = process.env.JWT_SECRET ?? 'CHANGE_THIS_SECRET_IN_PRODUCTION_USE_64_CHARS'

if (!process.env.JWT_SECRET) {
  console.warn('[WARN] JWT_SECRET no está definido en .env — usando valor de desarrollo inseguro')
}

const fastify = Fastify({
  logger: IS_DEV
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : { level: process.env.LOG_LEVEL ?? 'info' },
})

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174']

await fastify.register(fastifyCors, {
  origin: allowedOrigins,
  credentials: true,
})

// ── JWT ───────────────────────────────────────────────────────────────────────
await fastify.register(fastifyJwt, { secret: JWT_SECRET })

// ── Rate limiting ─────────────────────────────────────────────────────────────
await fastify.register(fastifyRateLimit, {
  global: false, // solo aplicar donde se configure explícitamente
  max: 100,
  timeWindow: '1 minute',
})

// Socket.io — attached to Fastify's underlying HTTP server
const io = new SocketIO(fastify.server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
})

io.on('connection', (socket) => {
  fastify.log.info(`Panel conectado via Socket.io [${socket.id}]`)
  socket.on('disconnect', () => fastify.log.info(`Panel desconectado [${socket.id}]`))
})

// Parser que conserva rawBody para verificar firma HMAC de Meta
fastify.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
  try {
    req.rawBody = body
    done(null, JSON.parse(body.toString('utf8')))
  } catch (err) {
    done(err)
  }
})

// ── Auth routes (públicas) ────────────────────────────────────────────────────
fastify.register(authRoutes)

// ── Panel routes (protegidas con JWT) ─────────────────────────────────────────
fastify.register(async function protectedRoutes(scoped) {
  scoped.addHook('preHandler', verifyJWT)
  await scoped.register(panelRoutes)
})

// Verificación del webhook de Meta (GET)
fastify.get('/webhook', (request, reply) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = request.query
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    fastify.log.info('Webhook verificado por Meta')
    return reply.code(200).send(challenge)
  }
  return reply.code(403).send('Forbidden')
})

// Recepción de mensajes de Meta (POST) — responde 200 inmediatamente
fastify.post('/webhook', (request, reply) => {
  if (APP_SECRET) {
    try {
      verifyMetaSignature(request)
    } catch (err) {
      fastify.log.warn(`Firma inválida: ${err.message}`)
      return reply.code(401).send('Unauthorized')
    }
  }

  reply.code(200).send('EVENT_RECEIVED')
  setImmediate(() => processWebhook(request.body).catch((err) => {
    fastify.log.error({ err }, 'Error procesando webhook')
  }))
})

// Health check
fastify.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

/** Verifica la firma HMAC-SHA256 enviada por Meta en el header x-hub-signature-256 */
function verifyMetaSignature(request) {
  const signature = request.headers['x-hub-signature-256']
  if (!signature) throw new Error('Header de firma ausente')

  const expected = `sha256=${createHmac('sha256', APP_SECRET).update(request.rawBody).digest('hex')}`
  const sigBuffer = Buffer.from(signature, 'utf8')
  const expBuffer = Buffer.from(expected, 'utf8')

  if (sigBuffer.length !== expBuffer.length || !timingSafeEqual(sigBuffer, expBuffer)) {
    throw new Error('Firma no coincide')
  }
}

/** Extrae el texto del mensaje según su tipo */
function extractBody(msg) {
  if (msg.type === 'text') return msg.text?.body ?? ''
  if (msg.type === 'interactive') return msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title ?? ''
  if (msg.type === 'audio') return '[audio]'
  if (msg.type === 'image') return msg.image?.caption ?? '[imagen]'
  return `[${msg.type}]`
}

/** Itera las entries del payload y despacha cada mensaje recibido */
async function processWebhook(payload) {
  const entries = payload?.entry ?? []

  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'messages') continue

      const { value } = change
      const phoneNumberId = value?.metadata?.phone_number_id
      const contacts = value?.contacts ?? []

      for (const msg of value?.messages ?? []) {
        try {
          await processMessage(msg, phoneNumberId, contacts)
        } catch (err) {
          fastify.log.error({ err, msgId: msg.id }, 'Error procesando mensaje')
        }
      }
    }
  }
}

/** Procesa un mensaje individual: busca account, upsert client, llama al brain y responde */
async function processMessage(msg, phoneNumberId, contacts) {
  if (!phoneNumberId) return

  const account = await prisma.account.findUnique({
    where: { phoneNumberId },
    include: {
      modules: true,
      rules: { where: { active: true }, orderBy: { priority: 'asc' } },
    },
  })

  if (!account) {
    fastify.log.warn(`Account no encontrado para phoneNumberId: ${phoneNumberId}`)
    return
  }

  const senderPhone = msg.from
  const contactName = contacts.find((c) => c.wa_id === senderPhone)?.profile?.name ?? null

  const client_ = await prisma.client.upsert({
    where: { accountId_phone: { accountId: account.id, phone: senderPhone } },
    create: { accountId: account.id, phone: senderPhone, name: contactName, lastContact: new Date() },
    update: { lastContact: new Date(), ...(contactName && { name: contactName }) },
  })

  const savedMsg = await prisma.message.create({
    data: {
      accountId: account.id,
      clientId: client_.id,
      direction: 'in',
      type: msg.type,
      body: extractBody(msg),
      waMessageId: msg.id,
    },
  })

  fastify.log.info({ from: senderPhone, body: savedMsg.body }, 'Mensaje recibido')

  io.emit('new_message', {
    accountId: account.id,
    message: savedMsg,
    client: { id: client_.id, name: client_.name, phone: client_.phone },
  })

  const response = await brain(savedMsg, account, client_)
  fastify.log.info({ response }, 'Respuesta generada por el brain')

  const sent = await sendWhatsAppMessage({
    to: senderPhone,
    phoneNumberId: account.phoneNumberId,
    token: account.waToken || process.env.META_ACCESS_TOKEN,
    message: response,
  })

  await prisma.message.create({
    data: {
      accountId: account.id,
      clientId: client_.id,
      direction: 'out',
      type: response.type,
      body: response.body ?? JSON.stringify(response),
      autoSent: true,
      waMessageId: sent?.messages?.[0]?.id ?? null,
    },
  })
}

// Arranque del servidor
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

// Graceful shutdown
const shutdown = async (signal) => {
  fastify.log.info(`Señal ${signal} recibida, cerrando servidor...`)
  await fastify.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

start()