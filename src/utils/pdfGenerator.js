import PDFDocument from 'pdfkit'
import { createWriteStream } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const COLORS = {
  green:      '#25D366',
  greenLight: '#E8F8EF',
  dark:       '#1A1A2E',
  gray:       '#F5F7FA',
  grayText:   '#666666',
  white:      '#FFFFFF',
  border:     '#E0E0E0',
  red:        '#E53935',
  blue:       '#1565C0',
}

export async function generateDailyReportPDF(account, data) {
  const filename = `reporte-diario-${account.id}-${Date.now()}.pdf`
  const filepath = join(tmpdir(), filename)

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Reporte Diario — ${account.name}`,
        Author: 'MateBot',
        Creator: 'MateBot by Estudio Digital',
      },
    })

    const stream = createWriteStream(filepath)
    doc.pipe(stream)

    // Header
    doc.rect(0, 0, doc.page.width, 120).fill(COLORS.green)
    doc.fontSize(24).font('Helvetica-Bold').fillColor(COLORS.white).text('MateBot', 40, 38)
    doc.fontSize(11).font('Helvetica').fillColor('rgba(255,255,255,0.8)').text('El socio digital de tu negocio', 40, 65)
    doc.fontSize(11).font('Helvetica').fillColor(COLORS.white)
       .text('REPORTE DIARIO', doc.page.width - 160, 38, { width: 120, align: 'right' })
    const today = new Date().toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    doc.fontSize(10).fillColor('rgba(255,255,255,0.9)')
       .text(today, doc.page.width - 160, 58, { width: 120, align: 'right' })

    // Negocio
    doc.fontSize(18).font('Helvetica-Bold').fillColor(COLORS.dark).text(account.name, 40, 140)
    doc.fontSize(11).font('Helvetica').fillColor(COLORS.grayText)
       .text(`${account.industry ?? 'Negocio'} • ${account.tone ?? 'amigable'}`, 40, 162)
    doc.moveTo(40, 185).lineTo(doc.page.width - 40, 185).strokeColor(COLORS.border).lineWidth(1).stroke()

    let y = 200

    // Stats principales
    const stats = [
      { label: 'Mensajes recibidos',  value: data.messagesCount,       icon: '💬', color: COLORS.green },
      { label: 'Clientes nuevos',     value: data.newClients,          icon: '👤', color: COLORS.blue },
      { label: 'Turnos del día',      value: data.appointmentsCount ?? '—', icon: '📅', color: '#F57C00' },
      { label: 'Pedidos completados', value: data.ordersCount ?? '—',  icon: '🛒', color: '#7B1FA2' },
    ]
    const cardWidth = (doc.page.width - 80 - 30) / 4
    stats.forEach((stat, i) => {
      const x = 40 + i * (cardWidth + 10)
      doc.roundedRect(x, y, cardWidth, 80, 8).fillColor(COLORS.gray).fill()
      doc.fontSize(26).font('Helvetica-Bold').fillColor(stat.color)
         .text(String(stat.value), x + 10, y + 14, { width: cardWidth - 20 })
      doc.fontSize(9).font('Helvetica').fillColor(COLORS.grayText)
         .text(stat.label, x + 10, y + 52, { width: cardWidth - 20 })
    })
    y += 100

    // Turnos del día
    if (data.appointments && data.appointments.length > 0) {
      y = sectionTitle(doc, '📅 Turnos del día', y, COLORS.green)
      const headers = ['Hora', 'Cliente', 'Teléfono', 'Estado']
      const colWidths = [80, 180, 140, 100]
      y = tableHeader(doc, headers, colWidths, y, COLORS.green)
      data.appointments.forEach((apt, i) => {
        const hora = new Date(apt.datetime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        const statusLabel =
          apt.status === 'confirmed' ? '✅ Confirmado'
          : apt.status === 'cancelled' ? '❌ Cancelado'
          : '✔ Completado'
        y = tableRow(doc, [hora, apt.client?.name || 'Sin nombre', apt.client?.phone || '—', statusLabel], colWidths, y, i % 2 === 0)
        if (y > doc.page.height - 100) { doc.addPage(); y = 40 }
      })
      if (data.tomorrowAppointments > 0) {
        y += 10
        doc.roundedRect(40, y, doc.page.width - 80, 32, 6).fillColor(COLORS.greenLight).fill()
        doc.fontSize(11).font('Helvetica').fillColor(COLORS.dark)
           .text(`📆 Turnos para mañana: ${data.tomorrowAppointments} confirmados`, 55, y + 10)
        y += 42
      }
    }

    // Finanzas
    if (data.finance) {
      if (y > doc.page.height - 150) { doc.addPage(); y = 40 }
      y = sectionTitle(doc, '💰 Finanzas del día', y, '#F57C00')
      const fCardWidth = (doc.page.width - 80 - 20) / 3
      const balance = data.finance.income - data.finance.expense
      const finCards = [
        { label: 'Ingresos', value: `$${data.finance.income.toLocaleString('es-AR')}`,  color: COLORS.green },
        { label: 'Gastos',   value: `$${data.finance.expense.toLocaleString('es-AR')}`, color: COLORS.red },
        { label: 'Balance',  value: `$${balance.toLocaleString('es-AR')}`,              color: balance >= 0 ? COLORS.green : COLORS.red },
      ]
      finCards.forEach((card, i) => {
        const x = 40 + i * (fCardWidth + 10)
        doc.roundedRect(x, y, fCardWidth, 60, 8).fillColor(COLORS.gray).fill()
        doc.fontSize(11).font('Helvetica').fillColor(COLORS.grayText).text(card.label, x + 12, y + 10)
        doc.fontSize(20).font('Helvetica-Bold').fillColor(card.color).text(card.value, x + 12, y + 30)
      })
      y += 80
    }

    // Footer
    const footerY = doc.page.height - 50
    doc.moveTo(40, footerY - 10).lineTo(doc.page.width - 40, footerY - 10)
       .strokeColor(COLORS.border).lineWidth(0.5).stroke()
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.grayText)
       .text('Generado por MateBot • Estudio Digital • NuestroEstudioDigital@gmail.com',
             40, footerY, { align: 'center', width: doc.page.width - 80 })

    doc.end()
    stream.on('finish', () => resolve(filepath))
    stream.on('error', reject)
  })
}

export async function generateWeeklyReportPDF(account, data) {
  const filename = `reporte-semanal-${account.id}-${Date.now()}.pdf`
  const filepath = join(tmpdir(), filename)

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: { Title: `Reporte Semanal — ${account.name}`, Author: 'MateBot' },
    })

    const stream = createWriteStream(filepath)
    doc.pipe(stream)

    // Header oscuro
    doc.rect(0, 0, doc.page.width, 120).fill(COLORS.dark)
    doc.fontSize(24).font('Helvetica-Bold').fillColor(COLORS.green).text('MateBot', 40, 38)
    doc.fontSize(11).font('Helvetica').fillColor('rgba(255,255,255,0.7)').text('El socio digital de tu negocio', 40, 65)
    doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.green)
       .text('REPORTE SEMANAL', doc.page.width - 170, 38, { width: 130, align: 'right' })
    const weekStart = new Date(data.weekStart).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
    const weekEnd   = new Date(data.weekEnd).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    doc.fontSize(10).fillColor('rgba(255,255,255,0.7)')
       .text(`${weekStart} — ${weekEnd}`, doc.page.width - 170, 62, { width: 130, align: 'right' })

    doc.fontSize(20).font('Helvetica-Bold').fillColor(COLORS.dark).text(account.name, 40, 140)
    doc.fontSize(11).font('Helvetica').fillColor(COLORS.grayText).text(account.industry ?? 'Negocio', 40, 163)
    doc.moveTo(40, 183).lineTo(doc.page.width - 40, 183).strokeColor(COLORS.border).lineWidth(1).stroke()

    let y = 198

    // Resumen
    y = sectionTitle(doc, '📊 Resumen de la semana', y, COLORS.dark)
    const weekStats = [
      { label: 'Total mensajes',  value: data.totalMessages, prev: data.prevMessages },
      { label: 'Clientes nuevos', value: data.newClients,    prev: data.prevClients  },
      { label: 'Turnos totales',  value: data.totalAppts,    prev: data.prevAppts    },
      { label: 'Pedidos totales', value: data.totalOrders,   prev: data.prevOrders   },
    ]
    const sCardW = (doc.page.width - 80 - 30) / 4
    weekStats.forEach((stat, i) => {
      const x = 40 + i * (sCardW + 10)
      doc.roundedRect(x, y, sCardW, 90, 8).fillColor(COLORS.gray).fill()
      doc.fontSize(28).font('Helvetica-Bold').fillColor(COLORS.dark)
         .text(String(stat.value ?? '—'), x + 10, y + 14, { width: sCardW - 20 })
      doc.fontSize(9).font('Helvetica').fillColor(COLORS.grayText)
         .text(stat.label, x + 10, y + 54, { width: sCardW - 20 })
      if (stat.prev != null && stat.value != null) {
        const diff = stat.value - stat.prev
        const pct  = stat.prev > 0 ? Math.round(diff / stat.prev * 100) : 0
        const color = diff >= 0 ? COLORS.green : COLORS.red
        doc.fontSize(9).font('Helvetica-Bold').fillColor(color)
           .text(`${diff >= 0 ? '▲' : '▼'} ${Math.abs(pct)}% vs sem. ant.`, x + 10, y + 70, { width: sCardW - 20 })
      }
    })
    y += 110

    // Gráfico de barras — mensajes diarios
    if (data.dailyMessages && data.dailyMessages.length > 0) {
      if (y > doc.page.height - 200) { doc.addPage(); y = 40 }
      y = sectionTitle(doc, '📈 Actividad diaria — Mensajes', y, COLORS.green)
      const maxVal   = Math.max(...data.dailyMessages.map(d => d.count), 1)
      const barWidth = (doc.page.width - 120) / 7
      const barMaxH  = 80
      data.dailyMessages.forEach((day, i) => {
        const x    = 60 + i * barWidth
        const barH = Math.max((day.count / maxVal) * barMaxH, 4)
        const barY = y + barMaxH - barH
        doc.roundedRect(x + 5, barY, barWidth - 10, barH, 4).fillColor(COLORS.green).fill()
        doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.dark)
           .text(String(day.count), x, barY - 14, { width: barWidth, align: 'center' })
        doc.fontSize(9).font('Helvetica').fillColor(COLORS.grayText)
           .text(day.day, x, y + barMaxH + 5, { width: barWidth, align: 'center' })
      })
      y += barMaxH + 35
    }

    // Top clientes
    if (data.topClients && data.topClients.length > 0) {
      if (y > doc.page.height - 150) { doc.addPage(); y = 40 }
      y = sectionTitle(doc, '👥 Clientes más activos', y, COLORS.blue)
      const headers = ['#', 'Cliente', 'Teléfono', 'Mensajes']
      const colW    = [40, 200, 160, 100]
      y = tableHeader(doc, headers, colW, y, COLORS.blue)
      data.topClients.slice(0, 5).forEach((client, i) => {
        y = tableRow(doc, [String(i + 1), client.name || 'Sin nombre', client.phone, String(client.messageCount)], colW, y, i % 2 === 0)
      })
      y += 10
    }

    // Finanzas semanales
    if (data.weeklyFinance) {
      if (y > doc.page.height - 150) { doc.addPage(); y = 40 }
      y = sectionTitle(doc, '💰 Resumen financiero de la semana', y, '#F57C00')
      const fCardW = (doc.page.width - 80 - 30) / 4
      const netBalance = data.weeklyFinance.income - data.weeklyFinance.expense
      const fCards = [
        { label: 'Ingresos totales', value: `$${data.weeklyFinance.income.toLocaleString('es-AR')}`,  color: COLORS.green },
        { label: 'Gastos totales',   value: `$${data.weeklyFinance.expense.toLocaleString('es-AR')}`, color: COLORS.red },
        { label: 'Balance neto',     value: `$${netBalance.toLocaleString('es-AR')}`,                 color: netBalance >= 0 ? COLORS.green : COLORS.red },
        { label: 'Promedio diario',  value: `$${Math.round(netBalance / 7).toLocaleString('es-AR')}`, color: COLORS.blue },
      ]
      fCards.forEach((card, i) => {
        const x = 40 + i * (fCardW + 10)
        doc.roundedRect(x, y, fCardW, 70, 8).fillColor(COLORS.gray).fill()
        doc.fontSize(10).font('Helvetica').fillColor(COLORS.grayText).text(card.label, x + 10, y + 10, { width: fCardW - 20 })
        doc.fontSize(18).font('Helvetica-Bold').fillColor(card.color).text(card.value, x + 10, y + 32, { width: fCardW - 20 })
      })
      y += 90
    }

    // Footer
    const footerY = doc.page.height - 50
    doc.moveTo(40, footerY - 10).lineTo(doc.page.width - 40, footerY - 10)
       .strokeColor(COLORS.border).lineWidth(0.5).stroke()
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.grayText)
       .text('Generado por MateBot • Estudio Digital • NuestroEstudioDigital@gmail.com',
             40, footerY, { align: 'center', width: doc.page.width - 80 })

    doc.end()
    stream.on('finish', () => resolve(filepath))
    stream.on('error', reject)
  })
}

function sectionTitle(doc, title, y, color) {
  if (y > doc.page.height - 120) { doc.addPage(); y = 40 }
  doc.fontSize(13).font('Helvetica-Bold').fillColor(color).text(title, 40, y)
  doc.moveTo(40, y + 18).lineTo(doc.page.width - 40, y + 18).strokeColor(color).lineWidth(1.5).stroke()
  return y + 28
}

function tableHeader(doc, headers, colWidths, y, color) {
  doc.rect(40, y, doc.page.width - 80, 24).fillColor(color).fill()
  let x = 45
  headers.forEach((h, i) => {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF').text(h, x, y + 7, { width: colWidths[i] - 5 })
    x += colWidths[i]
  })
  return y + 24
}

function tableRow(doc, cells, colWidths, y, isEven) {
  const rowH = 22
  doc.rect(40, y, doc.page.width - 80, rowH).fillColor(isEven ? '#F8F9FA' : '#FFFFFF').fill()
  let x = 45
  cells.forEach((cell, i) => {
    doc.fontSize(10).font('Helvetica').fillColor('#333333')
       .text(String(cell ?? '—'), x, y + 6, { width: colWidths[i] - 5, lineBreak: false })
    x += colWidths[i]
  })
  doc.moveTo(40, y + rowH).lineTo(doc.page.width - 40, y + rowH).strokeColor('#E0E0E0').lineWidth(0.5).stroke()
  return y + rowH
}