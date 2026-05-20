// Gestiona turnos: flujo de reserva, cancelación, consulta y recordatorios

import { PrismaClient } from '@prisma/client';
import { sendWhatsAppMessage } from '../utils/whatsapp.js';
import { notifyOwner } from '../utils/notifyOwner.js';

const prisma = new PrismaClient();

// Sesiones activas: key = `${accountId}:${phone}`, value = { step, slots, expiresAt }
const bookingSessions = new Map();

const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutos

// Argentina = UTC-3, sin DST
function toAR(dt) {
  return new Date(dt.getTime() - 3 * 60 * 60 * 1000);
}

const WEEKDAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const WEEKDAYS_LONG  = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS_LONG    = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function pad2(n) { return String(n).padStart(2, '0'); }

/** Título corto para la lista de WhatsApp — siempre ≤ 20 chars */
function formatSlotTitle(dt) {
  const ar = toAR(dt);
  return `${WEEKDAYS_SHORT[ar.getUTCDay()]} ${pad2(ar.getUTCDate())}/${pad2(ar.getUTCMonth() + 1)} ${pad2(ar.getUTCHours())}:${pad2(ar.getUTCMinutes())}`;
}

/** Formato largo para confirmaciones: "lunes 12 de mayo a las 10:00" */
function formatDatetimeLong(dt) {
  const ar = toAR(dt);
  return `${WEEKDAYS_LONG[ar.getUTCDay()]} ${ar.getUTCDate()} de ${MONTHS_LONG[ar.getUTCMonth()]} a las ${pad2(ar.getUTCHours())}:${pad2(ar.getUTCMinutes())}`;
}

const DEFAULT_HOURS = [
  { dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
  { dayOfWeek: 1, isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
  { dayOfWeek: 2, isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
  { dayOfWeek: 3, isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
  { dayOfWeek: 4, isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
  { dayOfWeek: 5, isOpen: true,  openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
  { dayOfWeek: 6, isOpen: false, openTime: '09:00', closeTime: '18:00', slotDuration: 60 },
];

/**
 * Lee horarios desde la DB y genera los próximos N slots disponibles.
 * Si el account no tiene horarios configurados usa defaults (lun–vie 9–18hs, 60 min).
 */
async function getAvailableSlots(accountId, count = 6) {
  const now = new Date();
  const horizon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  let businessHours = await prisma.businessHours.findMany({ where: { accountId } });
  if (!businessHours.length) businessHours = DEFAULT_HOURS;
  const hoursMap = new Map(businessHours.map((h) => [h.dayOfWeek, h]));

  const existing = await prisma.appointment.findMany({
    where: { accountId, datetime: { gte: now, lte: horizon }, status: 'confirmed' },
    select: { datetime: true },
  });
  const booked = new Set(existing.map((a) => a.datetime.toISOString()));

  const slots = [];

  // Iterar por días del calendario AR (UTC-3)
  const nowAR = toAR(now);
  let arYear = nowAR.getUTCFullYear();
  let arMonth = nowAR.getUTCMonth();
  let arDate = nowAR.getUTCDate();

  while (slots.length < count) {
    const dayStart = new Date(Date.UTC(arYear, arMonth, arDate));
    if (dayStart > horizon) break;

    const config = hoursMap.get(dayStart.getUTCDay());
    if (config?.isOpen) {
      const [openH, openM] = config.openTime.split(':').map(Number);
      const [closeH, closeM] = config.closeTime.split(':').map(Number);
      const duration = config.slotDuration;
      let slotMins = openH * 60 + openM;
      const closeMins = closeH * 60 + closeM;

      while (slotMins < closeMins && slots.length < count) {
        const h = Math.floor(slotMins / 60);
        const m = slotMins % 60;
        // AR es UTC-3 → para convertir AR→UTC sumamos 3 horas
        const utcDt = new Date(Date.UTC(arYear, arMonth, arDate, h + 3, m, 0, 0));
        if (utcDt > now && !booked.has(utcDt.toISOString())) slots.push(utcDt);
        slotMins += duration;
      }
    }

    // Avanzar al siguiente día AR (Date.UTC maneja overflow de mes/año)
    const next = new Date(Date.UTC(arYear, arMonth, arDate + 1));
    arYear  = next.getUTCFullYear();
    arMonth = next.getUTCMonth();
    arDate  = next.getUTCDate();
  }

  return slots;
}

/** Retorna true si el cliente tiene una sesión de reserva activa */
export function hasActiveSession(accountId, phone) {
  const key = `${accountId}:${phone}`;
  const session = bookingSessions.get(key);
  if (!session) return false;
  if (session.expiresAt <= Date.now()) {
    bookingSessions.delete(key);
    return false;
  }
  return true;
}

/** Próximo turno confirmado del cliente */
async function getNextAppointment(accountId, clientId) {
  return prisma.appointment.findFirst({
    where: { accountId, clientId, datetime: { gte: new Date() }, status: 'confirmed' },
    orderBy: { datetime: 'asc' },
  });
}

/** Programa recordatorio por setTimeout 24hs antes del turno */
export function scheduleReminder(appointment, account) {
  const msUntil = new Date(appointment.datetime).getTime() - 24 * 60 * 60 * 1000 - Date.now();
  if (msUntil <= 0) return;

  setTimeout(async () => {
    try {
      const appt = await prisma.appointment.findUnique({ where: { id: appointment.id } });
      if (!appt || appt.status !== 'confirmed' || appt.reminderSent) return;

      const client_ = await prisma.client.findUnique({ where: { id: appt.clientId } });
      if (!client_) return;

      await sendWhatsAppMessage({
        to: client_.phone,
        phoneNumberId: account.phoneNumberId,
        token: account.waToken,
        message: {
          type: 'template',
          templateName: 'appointment_reminder',
          components: [{ type: 'body', parameters: [{ type: 'text', text: formatDatetimeLong(new Date(appt.datetime)) }] }],
        },
      });

      await prisma.appointment.update({ where: { id: appt.id }, data: { reminderSent: true } });
    } catch (err) {
      console.error('[appointments] Error enviando recordatorio:', err.message);
    }
  }, msUntil);
}

/** Maneja intenciones de turno: book, confirm, cancel, consult */
export async function handleAppointment(intent, message, account, client_) {
  const { id: accountId } = account;
  const { id: clientId, phone } = client_;
  const sessionKey = `${accountId}:${phone}`;

  // ── book ──────────────────────────────────────────────────────────────────
  if (intent === 'book') {
    const slots = await getAvailableSlots(accountId);

    if (!slots.length) {
      return { type: 'text', body: 'Por el momento no hay turnos disponibles en los próximos 30 días. Te avisamos cuando se libere alguno.' };
    }

    bookingSessions.set(sessionKey, {
      step: 'selecting',
      slots,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });

    return {
      type: 'interactive_list',
      body: '¡Hola! Estos son los turnos disponibles. ¿Cuál te viene mejor?',
      buttonLabel: 'Ver turnos',
      sections: [{
        title: 'Turnos disponibles',
        rows: slots.map((dt, i) => ({
          id: `slot_${i}`,
          title: formatSlotTitle(dt),
          description: '',
        })),
      }],
    };
  }

  // ── confirm (usuario elige de la lista) ───────────────────────────────────
  if (intent === 'confirm') {
    const session = bookingSessions.get(sessionKey);

    if (!session || session.expiresAt <= Date.now()) {
      bookingSessions.delete(sessionKey);
      return { type: 'text', body: 'La sesión expiró. Escribí "turno" para ver los horarios disponibles nuevamente.' };
    }

    const bodyText = (message.body ?? '').trim().toLowerCase();

    // Salida explícita del flujo de reserva
    if (/cancelar|salir|no quiero|no gracias/.test(bodyText)) {
      bookingSessions.delete(sessionKey);
      return { type: 'text', body: '¡Listo! Cancelé la reserva. Cuando quieras podés escribir "turno" para ver los horarios.' };
    }

    // Buscar el slot cuyo título coincide con el body del mensaje interactivo
    const slotIndex = session.slots.findIndex((dt) => formatSlotTitle(dt) === (message.body ?? '').trim());

    if (slotIndex === -1) {
      // No se identificó el slot: renovar sesión y mostrar lista de nuevo
      session.expiresAt = Date.now() + SESSION_TTL_MS;
      return {
        type: 'interactive_list',
        body: 'Por favor elegí uno de los horarios disponibles:',
        buttonLabel: 'Ver turnos',
        sections: [{
          title: 'Turnos disponibles',
          rows: session.slots.map((dt, i) => ({
            id: `slot_${i}`,
            title: formatSlotTitle(dt),
            description: '',
          })),
        }],
      };
    }

    const selectedSlot = session.slots[slotIndex];
    bookingSessions.delete(sessionKey);

    const appointment = await prisma.appointment.create({
      data: { accountId, clientId, datetime: selectedSlot, status: 'confirmed' },
    });

    scheduleReminder(appointment, account);

    notifyOwner(account, { type: 'NEW_APPOINTMENT', client: client_, appointment }).catch((err) =>
      console.error('[appointments] Error notificando al dueño:', err.message),
    )

    return {
      type: 'text',
      body: `¡Turno confirmado! Te esperamos el ${formatDatetimeLong(selectedSlot)}. Si necesitás cancelar, escribí "cancelar turno".`,
    };
  }

  // ── cancel ────────────────────────────────────────────────────────────────
  if (intent === 'cancel') {
    const appt = await getNextAppointment(accountId, clientId);

    if (!appt) {
      return { type: 'text', body: 'No encontré ningún turno próximo. ¿Querés reservar uno? Escribí "quiero turno".' };
    }

    await prisma.appointment.update({ where: { id: appt.id }, data: { status: 'cancelled' } });

    notifyOwner(account, { type: 'CANCELLED_APPOINTMENT', client: client_, appointment: appt }).catch((err) =>
      console.error('[appointments] Error notificando cancelación:', err.message),
    )

    return { type: 'text', body: `Tu turno del ${formatDatetimeLong(new Date(appt.datetime))} fue cancelado. Podés reservar otro cuando quieras.` };
  }

  // ── consult ───────────────────────────────────────────────────────────────
  if (intent === 'consult') {
    const appt = await getNextAppointment(accountId, clientId);

    if (!appt) {
      return { type: 'text', body: 'No tenés turnos próximos agendados. ¿Querés reservar uno? Escribí "quiero turno".' };
    }

    return { type: 'text', body: `Tu próximo turno es el ${formatDatetimeLong(new Date(appt.datetime))}${appt.service ? ` — ${appt.service}` : ''}. ¡Te esperamos!` };
  }

  return { type: 'text', body: 'Puedo ayudarte a reservar, cancelar o consultar tus turnos. ¿Qué necesitás?' };
}
