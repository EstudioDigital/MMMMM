import { PrismaClient } from '@prisma/client'
import { readFileSync, unlinkSync } from 'fs'
import { generateDailyReportPDF, generateWeeklyReportPDF } from '../utils/pdfGenerator.js'
import { sendWhatsAppDocument } from '../utils/whatsapp.js'
import { decrypt } from '../utils/crypto.js'

const prisma = new PrismaClient()

export async function sendDailyReports() {
  console.log('[REPORT] Generando reportes diarios...')
  const accounts = await prisma.account.findMany({
    where: {
      reportEnabled: true,
      OR: [{ notifyPhone1: { not: null } }, { notifyPhone2: { not: null } }],
    },
    include: { modules: { where: { active: true } }, user: { select: { plan: true } } },
  })

  for (const account of accounts) {
    try {
      await sendReportToAccount(account, 'daily')
    } catch (err) {
      console.error(`[REPORT] Error en account ${account.id}:`, err.message)
    }
  }
  console.log(`[REPORT] Reportes diarios enviados a ${accounts.length} negocios`)
}

export async function sendWeeklyReports() {
  console.log('[REPORT] Generando reportes semanales...')
  const accounts = await prisma.account.findMany({
    where: {
      reportEnabled: true,
      OR: [{ notifyPhone1: { not: null } }, { notifyPhone2: { not: null } }],
    },
    include: { modules: { where: { active: true } }, user: { select: { plan: true } } },
  })

  for (const account of accounts) {
    try {
      await sendReportToAccount(account, 'weekly')
    } catch (err) {
      console.error(`[REPORT] Error en account ${account.id}:`, err.message)
    }
  }
  console.log(`[REPORT] Reportes semanales enviados a ${accounts.length} negocios`)
}

async function sendReportToAccount(account, type) {
  const data = await collectReportData(account, type)

  const pdfPath = type === 'daily'
    ? await generateDailyReportPDF(account, data)
    : await generateWeeklyReportPDF(account, data)

  const pdfBase64 = readFileSync(pdfPath).toString('base64')
  const dateStr = new Date().toLocaleDateString('es-AR').replace(/\//g, '-')
  const filename = `Reporte-${type === 'daily' ? 'Diario' : 'Semanal'}-${account.name}-${dateStr}.pdf`

  // Guardar en DB para descarga desde el panel
  await prisma.report.create({
    data: {
      accountId: account.id,
      type,
      filename,
      data: pdfBase64,
    },
  })

  let token = process.env.META_ACCESS_TOKEN
  if (account.waToken) {
    try { token = decrypt(account.waToken) } catch { token = account.waToken }
  }

  const phones = [account.notifyPhone1, account.notifyPhone2].filter(Boolean)
  const caption = type === 'daily'
    ? `📊 Reporte diario de ${account.name} — ${new Date().toLocaleDateString('es-AR')}`
    : `📈 Reporte semanal de ${account.name}`

  for (const phone of phones) {
    await sendWhatsAppDocument({ to: phone, phoneNumberId: account.phoneNumberId, token, pdfBase64, filename, caption })
  }

  // Limpiar archivo temporal
  try { unlinkSync(pdfPath) } catch { /* ignorar si ya fue eliminado */ }
}

async function collectReportData(account, type) {
  const now = new Date()
  const isWeekly = type === 'weekly'

  const startDate = isWeekly
    ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    : new Date(new Date().setHours(0, 0, 0, 0))
  const endDate = isWeekly
    ? new Date()
    : new Date(new Date().setHours(23, 59, 59, 999))

  const activeModules = account.modules.map((m) => m.type)
  const data = { weekStart: startDate, weekEnd: endDate }

  // Mensajes
  data.messagesCount = await prisma.message.count({
    where: { accountId: account.id, direction: 'in', createdAt: { gte: startDate, lte: endDate } },
  })
  if (isWeekly) data.totalMessages = data.messagesCount

  // Clientes nuevos
  data.newClients = await prisma.client.count({
    where: { accountId: account.id, createdAt: { gte: startDate, lte: endDate } },
  })

  // Semana anterior (solo semanal, para comparativas)
  if (isWeekly) {
    const prevStart = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    const prevEnd   = new Date(startDate.getTime() - 1)
    data.prevMessages = await prisma.message.count({
      where: { accountId: account.id, direction: 'in', createdAt: { gte: prevStart, lte: prevEnd } },
    })
    data.prevClients = await prisma.client.count({
      where: { accountId: account.id, createdAt: { gte: prevStart, lte: prevEnd } },
    })
  }

  // Turnos
  if (activeModules.includes('appointments')) {
    const appts = await prisma.appointment.findMany({
      where: { accountId: account.id, datetime: { gte: startDate, lte: endDate } },
      include: { client: true },
    })
    data.appointments = appts
    data.appointmentsCount = appts.filter((a) => a.status === 'confirmed').length
    if (isWeekly) {
      data.totalAppts = appts.length
      data.prevAppts = isWeekly
        ? await prisma.appointment.count({
            where: {
              accountId: account.id,
              datetime: {
                gte: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000),
                lte: new Date(startDate.getTime() - 1),
              },
            },
          })
        : undefined
    }

    if (!isWeekly) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      data.tomorrowAppointments = await prisma.appointment.count({
        where: {
          accountId: account.id,
          datetime: { gte: new Date(tomorrow.setHours(0, 0, 0, 0)), lte: new Date(tomorrow.setHours(23, 59, 59, 999)) },
          status: 'confirmed',
        },
      })
    }
  }

  // Finanzas
  if (activeModules.includes('finance')) {
    const [incomeRes, expenseRes] = await Promise.all([
      prisma.transaction.aggregate({
        where: { accountId: account.id, type: 'income', createdAt: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { accountId: account.id, type: 'expense', createdAt: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
    ])
    const fin = { income: incomeRes._sum.amount ?? 0, expense: expenseRes._sum.amount ?? 0 }
    data.finance = fin
    if (isWeekly) data.weeklyFinance = fin
  }

  // Datos adicionales para el reporte semanal
  if (isWeekly) {
    // Actividad diaria (barras)
    const dailyData = []
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    for (let i = 6; i >= 0; i--) {
      const day = new Date()
      day.setDate(day.getDate() - i)
      const dayStart = new Date(day.setHours(0, 0, 0, 0))
      const dayEnd   = new Date(day.setHours(23, 59, 59, 999))
      const count = await prisma.message.count({
        where: { accountId: account.id, direction: 'in', createdAt: { gte: dayStart, lte: dayEnd } },
      })
      dailyData.push({ day: days[new Date(dayStart).getDay()], count })
    }
    data.dailyMessages = dailyData

    // Top clientes
    const clients = await prisma.client.findMany({
      where: { accountId: account.id },
      include: { _count: { select: { messages: true } } },
      orderBy: { messages: { _count: 'desc' } },
      take: 5,
    })
    data.topClients = clients.map((c) => ({ name: c.name, phone: c.phone, messageCount: c._count.messages }))
  }

  return data
}