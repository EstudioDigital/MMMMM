import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { verifyJWT } from '../middleware/auth.js'
import { encrypt } from '../utils/crypto.js'
import { logSecurityEvent } from '../utils/securityLogger.js'
import { sanitizeString, isValidEmail } from '../utils/sanitize.js'

const prisma = new PrismaClient()
const SALT_ROUNDS = 10
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN ?? '7d'

export default async function authRoutes(fastify) {
  // POST /api/auth/register
  fastify.post('/api/auth/register', {
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
  }, async (req, reply) => {
    const { email: rawEmail, password, name: rawName } = req.body ?? {}
    const cleanEmail = typeof rawEmail === 'string' ? rawEmail.toLowerCase().trim() : ''
    const cleanName = sanitizeString(rawName)

    if (!cleanEmail || !password || !cleanName) {
      return reply.code(400).send({ error: 'Faltan campos requeridos: name, email, password' })
    }
    if (!isValidEmail(cleanEmail)) {
      return reply.code(400).send({ error: 'Email inválido' })
    }
    if (password.length < 8) {
      return reply.code(400).send({ error: 'La contraseña debe tener al menos 8 caracteres' })
    }
    if (cleanName.length < 2) {
      return reply.code(400).send({ error: 'El nombre debe tener al menos 2 caracteres' })
    }

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (existing) {
      return reply.code(409).send({ error: 'Este email ya está registrado' })
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS)
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

    const user = await prisma.user.create({
      data: { email: cleanEmail, password: hashed, name: cleanName, trialEndsAt },
    })

    const token = fastify.jwt.sign(
      { userId: user.id, email: user.email, accountId: user.accountId },
      { expiresIn: JWT_EXPIRES },
    )

    logSecurityEvent('REGISTER', { email: cleanEmail }, req)

    return reply.code(201).send({
      token,
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan, accountId: user.accountId },
    })
  })

  // POST /api/auth/login  (rate limited: 5 req/min per IP)
  fastify.post('/api/auth/login', {
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, async (req, reply) => {
    const { email, password } = req.body ?? {}

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email y contraseña requeridos' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      logSecurityEvent('LOGIN_FAILED', { email }, req)
      return reply.code(401).send({ error: 'Credenciales inválidas' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      logSecurityEvent('LOGIN_FAILED', { email }, req)
      return reply.code(401).send({ error: 'Credenciales inválidas' })
    }

    const token = fastify.jwt.sign(
      { userId: user.id, email: user.email, accountId: user.accountId },
      { expiresIn: JWT_EXPIRES },
    )

    logSecurityEvent('LOGIN_SUCCESS', { email }, req)

    return reply.send({
      token,
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan, accountId: user.accountId },
    })
  })

  // POST /api/auth/logout  (stateless — el cliente descarta el token)
  fastify.post('/api/auth/logout', async (_req, reply) => {
    return reply.send({ ok: true })
  })

  // GET /api/auth/me  (protegido)
  fastify.get('/api/auth/me', { preHandler: [verifyJWT] }, async (req, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, plan: true, accountId: true, trialEndsAt: true },
    })
    if (!user) return reply.code(404).send({ error: 'Usuario no encontrado' })
    return reply.send(user)
  })

  // POST /api/auth/forgot
  fastify.post('/api/auth/forgot', { config: { rateLimit: { max: 3, timeWindow: '1 hour' } } }, async (req, reply) => {
    const { email } = req.body ?? {}
    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      const resetToken = fastify.jwt.sign(
        { userId: user.id, purpose: 'reset' },
        { expiresIn: '1h' },
      )
      // En producción enviar email. En dev → loguear el link
      fastify.log.info(`[DEV] Reset link: http://localhost:5173/reset?token=${resetToken}`)
    }

    // Siempre 200 para no revelar si el email existe
    return reply.send({ ok: true, message: 'Si el email existe, recibirás instrucciones pronto.' })
  })

  // POST /api/auth/reset
  fastify.post('/api/auth/reset', async (req, reply) => {
    const { token, password } = req.body ?? {}

    if (!token || !password || password.length < 8) {
      return reply.code(400).send({ error: 'Token y contraseña (mínimo 8 caracteres) requeridos' })
    }

    let payload
    try {
      payload = fastify.jwt.verify(token)
    } catch {
      return reply.code(400).send({ error: 'Token inválido o expirado' })
    }

    if (payload.purpose !== 'reset') {
      return reply.code(400).send({ error: 'Token inválido' })
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS)
    await prisma.user.update({ where: { id: payload.userId }, data: { password: hashed } })

    return reply.send({ ok: true })
  })

  // POST /api/auth/setup-account  (protegido — se llama desde onboarding paso 2)
  fastify.post('/api/auth/setup-account', { preHandler: [verifyJWT] }, async (req, reply) => {
    const { name, industry, tone, ownerPhone, phoneNumberId, waToken } = req.body ?? {}
    const { userId } = req.user

    if (!phoneNumberId || !waToken) {
      return reply.code(400).send({ error: 'phoneNumberId y waToken son requeridos' })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return reply.code(404).send({ error: 'Usuario no encontrado' })
    if (user.accountId) return reply.code(409).send({ error: 'El usuario ya tiene una cuenta configurada' })

    const account = await prisma.account.create({
      data: {
        name: name ?? 'Mi Negocio',
        phoneNumberId,
        waToken: encrypt(waToken),
        ownerPhone: ownerPhone ?? '',
        industry: industry ?? null,
        tone: tone ?? 'friendly',
        modules: {
          create: [
            { type: 'appointments', active: true },
            { type: 'catalog',      active: true },
            { type: 'finance',      active: false },
            { type: 'ai',           active: true },
            { type: 'loyalty',      active: false },
            { type: 'campaigns',    active: false },
          ],
        },
      },
    })

    await prisma.user.update({ where: { id: userId }, data: { accountId: account.id } })

    const newToken = fastify.jwt.sign(
      { userId, email: user.email, accountId: account.id },
      { expiresIn: JWT_EXPIRES },
    )

    return reply.code(201).send({
      token: newToken,
      accountId: account.id,
      account: { id: account.id, name: account.name },
    })
  })
}