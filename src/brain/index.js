// Motor de decisión en cascada: rules → módulos → IA → fallback

import { PrismaClient } from '@prisma/client';
import { matchRule } from './rules.js';
import { aiResponse } from './ai.js';
import { handleAppointment, hasActiveSession } from '../modules/appointments.js';
import { handleFinance } from '../modules/finance.js';
import { handleCatalog, hasActiveCatalogSession } from '../modules/catalog.js';

const prisma = new PrismaClient();

const FALLBACK = { type: 'text', body: 'Recibimos tu mensaje, te respondemos a la brevedad.' };

/** Normaliza texto para detección de intenciones: minúsculas sin tildes */
function norm(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Detecta intención de turno en el texto */
function detectAppointmentIntent(text) {
  const t = norm(text);
  // cancel must be checked before book — both phrases may contain "turno"
  if (/\b(cancelar|cancelo|anular|anulo)\b/.test(t) || t.includes('no puedo ir')) return 'cancel';
  if (t.includes('mis turnos') || t.includes('tengo turno') || t.includes('cuando es') || t.includes('cuál es mi turno')) return 'consult';
  if (/\b(turno|cita|reserva|agendar)\b/.test(t) || t.includes('sacar turno')) return 'book';
  return null;
}

/** Detecta intención financiera y extrae monto si está presente */
function detectFinanceIntent(text) {
  const t = norm(text);
  const amountMatch = t.match(/\$?\s*([\d.,]+)/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null;

  if (/\b(vendi|ingrese|entre|cobr[eé]|cobré|recibi)\b/.test(t)) {
    return { type: 'income', amount, rawText: text };
  }
  if (/\b(gaste|gasto|pagué|pague|compr[eé]|compré|sali[oó])\b/.test(t)) {
    return { type: 'expense', amount, rawText: text };
  }
  if (/\b(cuanto|cuánto|resumen|total|ventas|gastos|balance|gane|gané)\b/.test(t)) {
    return { type: 'query', amount: null, rawText: text };
  }
  return null;
}

/** Detecta intención de catálogo en el texto */
function detectCatalogIntent(text) {
  const t = norm(text);
  // price before order — "quiero saber el precio" must not match order
  if (t.includes('precio') || t.includes('cuanto cuesta') || t.includes('cuanto vale') || t.includes('cuanto sale')) return 'price';
  if (/\b(catalogo|carta|menu|productos|lista)\b/.test(t) || t.includes('que tienen') || t.includes('que venden')) return 'browse';
  if (t.includes('quiero pedir') || t.includes('hacer pedido') || t.includes('quiero comprar') || /\b(pedir|comprar|pedido)\b/.test(t)) return 'order';
  return null;
}

/** Verifica si un módulo está activo en el account */
function isModuleActive(account, moduleType) {
  return account.modules?.some((m) => m.type === moduleType && m.active) ?? false;
}

/** Recupera el historial reciente de conversación para contexto de IA */
export async function getRecentHistory(accountId, clientId, limit = 10) {
  return prisma.message.findMany({
    where: { accountId, clientId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  }).then((msgs) => msgs.reverse());
}

/** Ejecuta el motor de decisión en cascada y retorna la respuesta a enviar */
export async function brain(message, account, client_) {
  const text = message.body ?? '';

  // Nivel 1: reglas configuradas por el negocio
  const ruleMatch = matchRule(text, account.rules);
  if (ruleMatch) return ruleMatch.response;

  // Nivel 2: módulos activos por intención detectada

  if (isModuleActive(account, 'appointments')) {
    // Active booking session: this message is a slot selection
    if (hasActiveSession(account.id, client_.phone)) {
      try {
        return await handleAppointment('confirm', message, account, client_);
      } catch (err) {
        console.error('[brain] Error en módulo appointments (confirm):', err.message);
      }
    }
    const intent = detectAppointmentIntent(text);
    if (intent) {
      try {
        return await handleAppointment(intent, message, account, client_);
      } catch (err) {
        console.error('[brain] Error en módulo appointments:', err.message);
      }
    }
  }

  if (isModuleActive(account, 'finance')) {
    // El módulo de finanzas solo responde al dueño del negocio
    if (client_.phone === account.ownerPhone) {
      const intentData = detectFinanceIntent(text);
      if (intentData) {
        try {
          return await handleFinance(intentData, account);
        } catch (err) {
          console.error('[brain] Error en módulo finance:', err.message);
        }
      }
    }
  }

  if (isModuleActive(account, 'catalog')) {
    // Active cart session: this message is part of the ordering flow
    if (hasActiveCatalogSession(account.id, client_.phone)) {
      try {
        return await handleCatalog('cart', message, account, client_);
      } catch (err) {
        console.error('[brain] Error en módulo catalog (cart):', err.message);
      }
    }
    const intent = detectCatalogIntent(text);
    if (intent) {
      try {
        return await handleCatalog(intent, message, account, client_);
      } catch (err) {
        console.error('[brain] Error en módulo catalog:', err.message);
      }
    }
  }

  // Nivel 3: IA generativa si el módulo está activo
  if (isModuleActive(account, 'ai')) {
    try {
      const history = await getRecentHistory(account.id, client_.id);
      const responseText = await aiResponse(message, account, client_, history);
      return { type: 'text', body: responseText };
    } catch (err) {
      console.error('[brain] Error en módulo ai:', err.message);
    }
  }

  return FALLBACK;
}
