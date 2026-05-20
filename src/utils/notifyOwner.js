import { sendWhatsAppMessage } from './whatsapp.js'
import { decrypt } from './crypto.js'

export async function notifyOwner(account, event) {
  if (!account.notifyPhone1 && !account.notifyPhone2) return

  const message = buildNotificationMessage(event)
  if (!message) return

  let token = process.env.META_ACCESS_TOKEN
  if (account.waToken) {
    try { token = decrypt(account.waToken) } catch { token = account.waToken }
  }

  const phones = [account.notifyPhone1, account.notifyPhone2].filter(Boolean)

  for (const phone of phones) {
    try {
      await sendWhatsAppMessage({
        to: phone,
        phoneNumberId: account.phoneNumberId,
        token,
        message: { type: 'text', body: message },
      })
    } catch (err) {
      console.error(`[NOTIFY] Error enviando a ${phone}:`, err.message)
    }
  }
}

function buildNotificationMessage(event) {
  const { type, client, appointment, order } = event
  const clientName = client?.name || client?.phone || 'Cliente'

  switch (type) {
    case 'NEW_APPOINTMENT':
      return (
        `📅 *Nuevo turno agendado*\n\n` +
        `👤 Cliente: ${clientName}\n` +
        `📞 Teléfono: ${client.phone}\n` +
        `🕐 Fecha y hora: ${new Date(appointment.datetime).toLocaleString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}\n` +
        `${appointment.service ? `💼 Servicio: ${appointment.service}\n` : ''}` +
        `\n_MateBot 🧉_`
      )

    case 'CANCELLED_APPOINTMENT':
      return (
        `❌ *Turno cancelado*\n\n` +
        `👤 Cliente: ${clientName}\n` +
        `📞 Teléfono: ${client.phone}\n` +
        `🕐 Turno cancelado: ${new Date(appointment.datetime).toLocaleString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}\n` +
        `\n_MateBot 🧉_`
      )

    case 'NEW_ORDER': {
      const itemsList = order.items
        .map((i) => `  • ${i.name} x${i.quantity} = $${(i.price * i.quantity).toLocaleString('es-AR')}`)
        .join('\n')
      const deliveryLabel = order.deliveryType === 'retiro' ? 'Retiro en local' : 'Envío a domicilio'
      return (
        `🛒 *Nuevo pedido recibido*\n\n` +
        `👤 Cliente: ${clientName}\n` +
        `📞 Teléfono: ${client.phone}\n` +
        `─────────────\n` +
        `${itemsList}\n` +
        `─────────────\n` +
        `💰 Total: *$${order.total.toLocaleString('es-AR')}*\n` +
        `📦 Entrega: ${deliveryLabel}\n` +
        `\n_MateBot 🧉_`
      )
    }

    default:
      return null
  }
}