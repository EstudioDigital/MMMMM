// Envía mensajes via Meta WhatsApp Cloud API v19.0

const GRAPH_URL = 'https://graph.facebook.com/v19.0';

/** Construye el payload según el tipo de mensaje a enviar */
function buildPayload(to, message) {
  const base = { messaging_product: 'whatsapp', recipient_type: 'individual', to };

  switch (message.type) {
    case 'text':
      return { ...base, type: 'text', text: { body: message.body, preview_url: false } };

    case 'interactive_buttons':
      return {
        ...base,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: message.body },
          action: {
            buttons: message.buttons.slice(0, 3).map((btn, i) => ({
              type: 'reply',
              reply: { id: btn.id ?? `btn_${i}`, title: btn.title.slice(0, 20) },
            })),
          },
        },
      };

    case 'interactive_list':
      return {
        ...base,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: message.body },
          action: {
            button: message.buttonLabel ?? 'Ver opciones',
            sections: message.sections.map((section) => ({
              title: section.title,
              rows: section.rows.slice(0, 10).map((row) => ({
                id: row.id,
                title: row.title.slice(0, 24),
                description: row.description?.slice(0, 72) ?? '',
              })),
            })),
          },
        },
      };

    case 'template':
      return {
        ...base,
        type: 'template',
        template: {
          name: message.templateName,
          language: { code: message.languageCode ?? 'es_AR' },
          components: message.components ?? [],
        },
      };

    case 'image':
      return {
        ...base,
        type: 'image',
        image: message.mediaId
          ? { id: message.mediaId, caption: message.caption ?? '' }
          : { link: message.link, caption: message.caption ?? '' },
      };

    default:
      return { ...base, type: 'text', text: { body: String(message.body ?? '') } };
  }
}

/** Sube un PDF a Meta y lo envía como documento por WhatsApp */
export async function sendWhatsAppDocument({ to, phoneNumberId, token, pdfBase64, filename, caption }) {
  const pdfBuffer = Buffer.from(pdfBase64, 'base64')

  // Paso 1: subir el archivo a Meta Media
  const form = new FormData()
  form.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), filename)
  form.append('messaging_product', 'whatsapp')
  form.append('type', 'application/pdf')

  const uploadRes = await fetch(`${GRAPH_URL}/${phoneNumberId}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}))
    throw new Error(`WhatsApp upload error: ${err?.error?.message ?? `HTTP ${uploadRes.status}`}`)
  }

  const { id: mediaId } = await uploadRes.json()

  // Paso 2: enviar el documento usando el media_id
  const sendRes = await fetch(`${GRAPH_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'document',
      document: { id: mediaId, filename, caption },
    }),
  })

  if (!sendRes.ok) {
    const err = await sendRes.json().catch(() => ({}))
    throw new Error(`WhatsApp document send error: ${err?.error?.message ?? `HTTP ${sendRes.status}`}`)
  }

  return sendRes.json()
}

/** Envía un mensaje de WhatsApp y lanza error si Meta responde con fallo */
export async function sendWhatsAppMessage({ to, phoneNumberId, token, message }) {
  const url = `${GRAPH_URL}/${phoneNumberId}/messages`;
  const payload = buildPayload(to, message);

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  let res
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const metaError = errorBody?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`WhatsApp API error: ${metaError}`);
  }

  return res.json();
}
