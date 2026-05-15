// Gestiona catálogo de productos, consultas de precio y flujo de pedido multi-paso

import { PrismaClient } from '@prisma/client';
import { sendWhatsAppMessage } from '../utils/whatsapp.js';

const prisma = new PrismaClient();

// Sesiones activas: key = `${accountId}:${phone}`
// value: { step, cart, currentProduct, products, expiresAt }
const catalogSessions = new Map();

const SESSION_TTL_MS = 15 * 60 * 1000; // 15 minutos

function normalize(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Formato de precio argentino: $1.500 */
function formatPrice(amount) {
  return '$' + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function cartTotal(cart) {
  return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function cartSummary(cart) {
  return cart
    .map((i) => `• ${i.quantity} ${i.unit} de ${i.name} — ${formatPrice(i.price * i.quantity)}`)
    .join('\n');
}

/** Parsea la cantidad de un texto: "2", "medio", "1,5 kg" → número */
function parseQuantity(text) {
  if (/medio|media|0[.,]5/.test(text.toLowerCase())) return 0.5;
  const m = text.match(/(\d+(?:[.,]\d+)?)/);
  return m ? parseFloat(m[1].replace(',', '.')) : 1;
}

/** Retorna true si hay una sesión de carrito activa y no expirada */
export function hasActiveCatalogSession(accountId, phone) {
  const key = `${accountId}:${phone}`;
  const session = catalogSessions.get(key);
  if (!session) return false;
  if (session.expiresAt <= Date.now()) {
    catalogSessions.delete(key);
    return false;
  }
  return true;
}

/** Carga productos disponibles y abre una sesión mostrando la lista */
async function openProductList(accountId, sessionKey, bodyText) {
  const products = await prisma.product.findMany({
    where: { accountId, available: true },
    orderBy: { order: 'asc' },
    take: 10,
  });

  if (!products.length) {
    return {
      type: 'text',
      body: 'Todavía no tenemos el catálogo cargado. Escribinos directamente para consultar precios.',
    };
  }

  catalogSessions.set(sessionKey, {
    step: 'selecting_product',
    cart: [],
    currentProduct: null,
    products,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  return {
    type: 'interactive_list',
    body: bodyText,
    buttonLabel: 'Ver productos',
    sections: [{
      title: 'Productos disponibles',
      rows: products.map((p) => ({
        id: p.id,
        title: p.name.slice(0, 24),
        description: `${formatPrice(p.price)}${p.unit ? ` / ${p.unit}` : ''}${p.description ? ` — ${p.description.slice(0, 40)}` : ''}`,
      })),
    }],
  };
}

/** Maneja intenciones del catálogo: browse, order, price, cart */
export async function handleCatalog(intent, message, account, client_) {
  const { id: accountId } = account;
  const { id: clientId, phone } = client_;
  const sessionKey = `${accountId}:${phone}`;
  const bodyText = (message.body ?? '').trim();

  // ── browse ────────────────────────────────────────────────────────────────
  if (intent === 'browse') {
    return openProductList(accountId, sessionKey, 'Estos son nuestros productos disponibles:');
  }

  // ── order ─────────────────────────────────────────────────────────────────
  if (intent === 'order') {
    return openProductList(accountId, sessionKey, '¿Qué querés pedir? Elegí un producto:');
  }

  // ── price ─────────────────────────────────────────────────────────────────
  if (intent === 'price') {
    const products = await prisma.product.findMany({
      where: { accountId, available: true },
      orderBy: { order: 'asc' },
    });

    if (!products.length) {
      return { type: 'text', body: 'Todavía no tenemos el catálogo cargado. Escribinos directamente para consultar precios.' };
    }

    // If a specific product is mentioned, answer only that one
    const product = products.find((p) => normalize(bodyText).includes(normalize(p.name)));
    if (product) {
      return {
        type: 'text',
        body: `${product.name}: ${formatPrice(product.price)}${product.unit ? ` por ${product.unit}` : ''}.`,
      };
    }

    // No product specified — list all prices
    const priceList = products
      .map((p) => `• ${p.name}: ${formatPrice(p.price)}${p.unit ? `/${p.unit}` : ''}`)
      .join('\n');
    return { type: 'text', body: `Precios actualizados:\n${priceList}` };
  }

  // ── cart (sesión activa) ──────────────────────────────────────────────────
  if (intent === 'cart') {
    const session = catalogSessions.get(sessionKey);

    if (!session || session.expiresAt <= Date.now()) {
      catalogSessions.delete(sessionKey);
      return { type: 'text', body: 'La sesión expiró. Escribí "catálogo" para ver los productos.' };
    }

    // Renovar TTL en cada interacción
    session.expiresAt = Date.now() + SESSION_TTL_MS;

    const t = normalize(bodyText);

    // Salida explícita del flujo
    if (/^(cancelar|salir|no gracias|hasta luego)$/.test(t)) {
      catalogSessions.delete(sessionKey);
      return { type: 'text', body: '¡Hasta luego! Cuando quieras podés volver a ver el catálogo.' };
    }

    // ── step: selecting_product ───────────────────────────────────────────
    if (session.step === 'selecting_product') {
      const product = session.products.find((p) => p.name.slice(0, 24) === bodyText);

      if (!product) {
        return {
          type: 'interactive_list',
          body: 'No pude identificar el producto. Por favor elegí uno de la lista:',
          buttonLabel: 'Ver productos',
          sections: [{
            title: 'Productos disponibles',
            rows: session.products.map((p) => ({
              id: p.id,
              title: p.name.slice(0, 24),
              description: `${formatPrice(p.price)}${p.unit ? ` / ${p.unit}` : ''}`,
            })),
          }],
        };
      }

      session.currentProduct = product;
      session.step = 'selecting_quantity';

      return {
        type: 'text',
        body: `¿Cuánto/s ${product.unit ?? 'unidades'} de ${product.name} querés? (Ej: 1, 2, medio)`,
      };
    }

    // ── step: selecting_quantity ──────────────────────────────────────────
    if (session.step === 'selecting_quantity') {
      const qty = parseQuantity(bodyText);
      const p = session.currentProduct;

      session.cart.push({ productId: p.id, name: p.name, price: p.price, quantity: qty, unit: p.unit ?? 'u.' });
      session.currentProduct = null;
      session.step = 'adding_more';

      return {
        type: 'interactive_buttons',
        body: `Agregué ${qty} ${p.unit ?? 'u.'} de ${p.name} (${formatPrice(p.price * qty)}). ¿Querés agregar algo más?`,
        buttons: [
          { id: 'more',    title: 'Agregar más' },
          { id: 'confirm', title: 'Confirmar pedido' },
        ],
      };
    }

    // ── step: adding_more ─────────────────────────────────────────────────
    if (session.step === 'adding_more') {
      // Button titles come back as message.body via extractBody
      const confirmsOrder = t === 'confirmar pedido' || /\b(confirmar|confirm|listo|finalizar)\b/.test(t);
      const wantsMore     = t === 'agregar mas'      || /\b(agregar|otro|otra)\b/.test(t) || (/\bmas\b/.test(t) && !confirmsOrder);

      if (wantsMore) {
        session.step = 'selecting_product';
        return {
          type: 'interactive_list',
          body: '¿Qué más querés agregar?',
          buttonLabel: 'Ver productos',
          sections: [{
            title: 'Productos disponibles',
            rows: session.products.map((p) => ({
              id: p.id,
              title: p.name.slice(0, 24),
              description: `${formatPrice(p.price)}${p.unit ? ` / ${p.unit}` : ''}`,
            })),
          }],
        };
      }

      if (confirmsOrder) {
        session.step = 'delivery';
        return {
          type: 'interactive_buttons',
          body: `Resumen del pedido:\n${cartSummary(session.cart)}\n\nTotal: ${formatPrice(cartTotal(session.cart))}\n\n¿Cómo lo recibís?`,
          buttons: [
            { id: 'pickup',   title: 'Retiro' },
            { id: 'delivery', title: 'Envío a domicilio' },
          ],
        };
      }

      return {
        type: 'interactive_buttons',
        body: '¿Agregamos algo más o confirmamos el pedido?',
        buttons: [
          { id: 'more',    title: 'Agregar más' },
          { id: 'confirm', title: 'Confirmar pedido' },
        ],
      };
    }

    // ── step: delivery ────────────────────────────────────────────────────
    if (session.step === 'delivery') {
      const isPickup   = t === 'retiro'             || /\b(retiro|retir|busco|paso)\b/.test(t);
      const isDelivery = t === 'envio a domicilio'  || /\b(envio|delivery|domicilio)\b/.test(t);

      if (!isPickup && !isDelivery) {
        return {
          type: 'interactive_buttons',
          body: '¿Cómo preferís recibir tu pedido?',
          buttons: [
            { id: 'pickup',   title: 'Retiro' },
            { id: 'delivery', title: 'Envío a domicilio' },
          ],
        };
      }

      const deliveryType = isPickup ? 'retiro en local' : 'envío a domicilio';
      const total        = formatPrice(cartTotal(session.cart));
      const summary      = cartSummary(session.cart);
      const orderDetail  = session.cart.map((i) => `${i.quantity} ${i.unit} de ${i.name}`).join(', ');

      await prisma.message.create({
        data: {
          accountId,
          clientId,
          direction: 'in',
          type: 'order',
          body: `PEDIDO: ${orderDetail} | Total: ${total} | Entrega: ${deliveryType}`,
          autoSent: false,
        },
      });

      // Notificar al dueño del negocio
      try {
        await sendWhatsAppMessage({
          to: account.ownerPhone,
          phoneNumberId: account.phoneNumberId,
          token: account.waToken,
          message: {
            type: 'text',
            body: `Nuevo pedido de ${client_.name ?? phone} (+${phone}):\n${summary}\nTotal: ${total}\nEntrega: ${deliveryType}`,
          },
        });
      } catch (err) {
        console.error('[catalog] Error notificando al dueño:', err.message);
      }

      catalogSessions.delete(sessionKey);

      return {
        type: 'text',
        body: `¡Pedido confirmado! Total: ${total} — ${deliveryType}. Te contactamos a la brevedad para coordinar.`,
      };
    }
  }

  return { type: 'text', body: 'Puedo mostrarte el catálogo, consultar precios o tomar tu pedido. ¿Qué necesitás?' };
}
