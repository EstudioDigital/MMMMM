// node scripts/seed.js
// Crea un negocio de prueba completo con todos los datos necesarios.
// Requiere haber corrido "npx prisma db push" primero.

import { readFileSync } from 'fs'
import { resolve }      from 'path'
import { createCipheriv, randomBytes } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import bcrypt           from 'bcrypt'

// ── Cargar .env manualmente (Node no lo hace automáticamente en ESM) ──────────
function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf-8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx < 0) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      if (key && !process.env[key]) process.env[key] = val
    }
  } catch (e) {
    console.warn('⚠️  No se pudo leer .env:', e.message)
  }
}
loadEnv()

const prisma = new PrismaClient()

function encrypt(text) {
  const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  const iv        = randomBytes(16)
  const cipher    = createCipheriv('aes-256-gcm', KEY, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag       = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

// ─────────────────────────────────────────────────────────────────────────────

const DEMO_EMAIL         = 'demo@matebot.app'
const DEMO_PHONE_ID      = '1062738986927407'
const DEMO_OWNER_PHONE   = '5493518031033'

async function main() {
  console.log('🧉 Creando datos de prueba para MateBot...\n')

  const waToken = process.env.META_ACCESS_TOKEN ?? 'demo_token_replace_me'

  // 1. Limpiar datos anteriores del demo ──────────────────────────────────────
  const existingUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
  if (existingUser?.accountId) {
    await prisma.account.delete({ where: { id: existingUser.accountId } })
  }
  if (existingUser) {
    await prisma.user.delete({ where: { email: DEMO_EMAIL } })
    console.log('   ♻️  Datos anteriores eliminados')
  }

  // 2. Account ─────────────────────────────────────────────────────────────────
  const account = await prisma.account.create({
    data: {
      name:         'Verdulería El Mate',
      phoneNumberId: DEMO_PHONE_ID,
      waToken:      encrypt(waToken),
      ownerPhone:   DEMO_OWNER_PHONE,
      industry:     'verduleria',
      tone:         'friendly',
      plan:         'pro',
      businessInfo: 'Verdulería de barrio en Córdoba. Vendemos frutas y verduras frescas todos los días. Pedidos por WhatsApp con envío a domicilio.',
      faq:          '¿Tienen envío? Sí, envíos en Córdoba capital. Mínimo $2000.\n¿Cuándo abren? Lunes a sábado de 8 a 20hs.\n¿Aceptan transferencia? Sí, también efectivo y MercadoPago.',
      notifyPhone1: DEMO_OWNER_PHONE,
      notifyPhone2: null,
      reportEnabled: true,
    },
  })
  console.log(`   ✅ Account: ${account.name}`)

  // 3. User ────────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Demo1234!', 10)
  await prisma.user.create({
    data: {
      email:     DEMO_EMAIL,
      password:  passwordHash,
      name:      'Demo MateBot',
      accountId: account.id,
      plan:      'pro',
    },
  })
  console.log(`   ✅ Usuario: ${DEMO_EMAIL}`)

  // 4. BusinessHours (Lun–Vie 08-20h, Sáb 08-14h, Dom cerrado) ──────────────
  await prisma.businessHours.createMany({
    data: [
      { accountId: account.id, dayOfWeek: 0, isOpen: false, openTime: '08:00', closeTime: '20:00', slotDuration: 30 },
      { accountId: account.id, dayOfWeek: 1, isOpen: true,  openTime: '08:00', closeTime: '20:00', slotDuration: 30 },
      { accountId: account.id, dayOfWeek: 2, isOpen: true,  openTime: '08:00', closeTime: '20:00', slotDuration: 30 },
      { accountId: account.id, dayOfWeek: 3, isOpen: true,  openTime: '08:00', closeTime: '20:00', slotDuration: 30 },
      { accountId: account.id, dayOfWeek: 4, isOpen: true,  openTime: '08:00', closeTime: '20:00', slotDuration: 30 },
      { accountId: account.id, dayOfWeek: 5, isOpen: true,  openTime: '08:00', closeTime: '20:00', slotDuration: 30 },
      { accountId: account.id, dayOfWeek: 6, isOpen: true,  openTime: '08:00', closeTime: '14:00', slotDuration: 30 },
    ],
  })
  console.log('   ✅ Horarios: Lun–Vie 08-20h, Sáb 08-14h, Dom cerrado')

  // 5. Módulos ─────────────────────────────────────────────────────────────────
  await prisma.module.createMany({
    data: [
      { accountId: account.id, type: 'appointments', active: true },
      { accountId: account.id, type: 'catalog',      active: true },
      { accountId: account.id, type: 'ai',           active: true },
    ],
  })
  console.log('   ✅ Módulos: appointments, catalog, ai')

  // 6. Productos (10 verduras/frutas) ──────────────────────────────────────────
  await prisma.product.createMany({
    data: [
      { accountId: account.id, name: 'Tomate redondo',  price: 1800, unit: 'kg', available: true, order: 1 },
      { accountId: account.id, name: 'Lechuga criolla', price:  900, unit: 'u',  available: true, order: 2 },
      { accountId: account.id, name: 'Papa blanca',     price: 1200, unit: 'kg', available: true, order: 3 },
      { accountId: account.id, name: 'Zanahoria',       price:  800, unit: 'kg', available: true, order: 4 },
      { accountId: account.id, name: 'Cebolla blanca',  price:  700, unit: 'kg', available: true, order: 5 },
      { accountId: account.id, name: 'Manzana roja',    price: 2200, unit: 'kg', available: true, order: 6 },
      { accountId: account.id, name: 'Banana',          price: 1500, unit: 'kg', available: true, order: 7 },
      { accountId: account.id, name: 'Naranja',         price: 1800, unit: 'kg', available: true, order: 8 },
      { accountId: account.id, name: 'Espinaca',        price:  600, unit: 'u',  available: true, order: 9 },
      { accountId: account.id, name: 'Acelga',          price:  500, unit: 'u',  available: true, order: 10 },
    ],
  })
  console.log('   ✅ Productos: 10 items')

  // 7. Reglas automáticas ──────────────────────────────────────────────────────
  await prisma.rule.createMany({
    data: [
      {
        accountId: account.id, active: true, priority: 1,
        trigger:  { type: 'always' },
        response: { type: 'text', body: '¡Hola! 👋 Soy el asistente de Verdulería El Mate.\nPuedo ayudarte con: 🛒 Ver productos, 📅 Sacar turno de entrega, 💬 Consultar precios. ¿Qué necesitás?' },
      },
      {
        accountId: account.id, active: true, priority: 2,
        trigger:  { type: 'keyword', value: 'horario' },
        response: { type: 'text', body: 'Atendemos lunes a sábado de 8 a 20hs. Domingos cerramos. ¡Te esperamos! 🥬' },
      },
      {
        accountId: account.id, active: true, priority: 3,
        trigger:  { type: 'keyword', value: 'envio' },
        response: { type: 'text', body: 'Hacemos envíos en Córdoba capital con pedido mínimo de $2.000. El envío tiene un costo de $500. ¿Querés hacer un pedido?' },
      },
      {
        accountId: account.id, active: true, priority: 4,
        trigger:  { type: 'keyword', value: 'pago' },
        response: { type: 'text', body: 'Aceptamos efectivo, transferencia bancaria y MercadoPago. ¿Necesitás el alias o CBU para transferir?' },
      },
      {
        accountId: account.id, active: true, priority: 5,
        trigger:  { type: 'keyword', value: 'gracias' },
        response: { type: 'text', body: '¡De nada! 😊 Fue un placer ayudarte. Recordá que podés escribirnos cuando quieras. ¡Hasta pronto!' },
      },
    ],
  })
  console.log('   ✅ Reglas: 5 reglas automáticas')

  // 8. Clientes ────────────────────────────────────────────────────────────────
  const now         = new Date()
  const twoDaysAgo  = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const oneWeekAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const yesterday   = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)

  const maria = await prisma.client.create({
    data: { accountId: account.id, phone: '5491112345678', name: 'María García',  tags: ['frecuente'],          points: 150, lastContact: twoDaysAgo },
  })
  const juan = await prisma.client.create({
    data: { accountId: account.id, phone: '5491187654321', name: 'Juan Pérez',    tags: ['nuevo'],              points: 20,  lastContact: oneWeekAgo },
  })
  const ana = await prisma.client.create({
    data: { accountId: account.id, phone: '5491155551234', name: 'Ana López',     tags: ['frecuente', 'envio'], points: 380, lastContact: yesterday  },
  })
  console.log('   ✅ Clientes: María García, Juan Pérez, Ana López')

  // 9. Mensajes ─────────────────────────────────────────────────────────────────
  const t = (base, mins) => new Date(base.getTime() + mins * 60 * 1000)

  const mariaBase = new Date(twoDaysAgo); mariaBase.setUTCHours(13, 0, 0, 0) // 10:00 AR
  await prisma.message.createMany({
    data: [
      { accountId: account.id, clientId: maria.id, direction: 'in',  type: 'text', body: 'Hola, quiero saber los precios',                                         createdAt: t(mariaBase,  0) },
      { accountId: account.id, clientId: maria.id, direction: 'out', type: 'text', body: '¡Hola! 👋 Soy el asistente de Verdulería El Mate. ¿En qué te ayudo?',   createdAt: t(mariaBase,  1), autoSent: true },
      { accountId: account.id, clientId: maria.id, direction: 'in',  type: 'text', body: '¿Cuánto sale el tomate?',                                                createdAt: t(mariaBase,  3) },
      { accountId: account.id, clientId: maria.id, direction: 'out', type: 'text', body: 'El tomate redondo está a $1.800 el kilo. ¿Querés hacer un pedido?',      createdAt: t(mariaBase,  4), autoSent: true },
      { accountId: account.id, clientId: maria.id, direction: 'in',  type: 'text', body: 'Sí, quiero 2 kilos',                                                     createdAt: t(mariaBase,  6) },
      { accountId: account.id, clientId: maria.id, direction: 'out', type: 'text', body: 'Perfecto, 2kg de tomate = $3.600. ¿Agregás algo más?',                   createdAt: t(mariaBase,  7), autoSent: true },
      { accountId: account.id, clientId: maria.id, direction: 'in',  type: 'text', body: 'No, eso es todo',                                                        createdAt: t(mariaBase, 10) },
      { accountId: account.id, clientId: maria.id, direction: 'out', type: 'text', body: 'Tu pedido: Tomate x2kg = $3.600. ¿Es para retiro o envío?',              createdAt: t(mariaBase, 11), autoSent: true },
    ],
  })

  const juanBase = new Date(oneWeekAgo); juanBase.setUTCHours(14, 0, 0, 0) // 11:00 AR
  await prisma.message.createMany({
    data: [
      { accountId: account.id, clientId: juan.id, direction: 'in',  type: 'text', body: 'Buen día, tienen espinaca?',                                                createdAt: t(juanBase, 0) },
      { accountId: account.id, clientId: juan.id, direction: 'out', type: 'text', body: '¡Hola! Sí, tenemos espinaca a $600 la unidad. ¿Te armo un pedido?',        createdAt: t(juanBase, 1), autoSent: true },
      { accountId: account.id, clientId: juan.id, direction: 'in',  type: 'text', body: '¿Cuál es el horario?',                                                     createdAt: t(juanBase, 4) },
      { accountId: account.id, clientId: juan.id, direction: 'out', type: 'text', body: 'Atendemos lunes a sábado de 8 a 20hs. Domingos cerramos. ¡Te esperamos! 🥬', createdAt: t(juanBase, 5), autoSent: true },
    ],
  })
  console.log('   ✅ Mensajes: conversaciones de María y Juan')

  // 10. Turnos ──────────────────────────────────────────────────────────────────
  // Argentina = UTC-3. AR 10:00 = UTC 13:00, AR 14:00 = UTC 17:00, AR 09:00 = UTC 12:00
  const nowAR = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  const [arY, arM, arD] = [nowAR.getUTCFullYear(), nowAR.getUTCMonth(), nowAR.getUTCDate()]

  await prisma.appointment.createMany({
    data: [
      { accountId: account.id, clientId: maria.id, datetime: new Date(Date.UTC(arY, arM, arD + 1, 13, 0)), status: 'confirmed' },
      { accountId: account.id, clientId: juan.id,  datetime: new Date(Date.UTC(arY, arM, arD + 2, 17, 0)), status: 'confirmed' },
      { accountId: account.id, clientId: ana.id,   datetime: new Date(Date.UTC(arY, arM, arD - 2, 12, 0)), status: 'completed' },
    ],
  })
  console.log('   ✅ Turnos: 2 confirmados + 1 completado')

  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n✅ ¡Datos de prueba creados exitosamente!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📧 Email:      demo@matebot.app')
  console.log('🔑 Contraseña: Demo1234!')
  console.log('🌐 Panel:      http://localhost:5173/login')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('Para probar el bot por WhatsApp:')
  console.log('📱 PhoneNumberId:', DEMO_PHONE_ID)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())