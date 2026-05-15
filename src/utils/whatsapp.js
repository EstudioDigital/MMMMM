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
