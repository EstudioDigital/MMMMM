import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Nivel 3 del brain — Respuesta con IA (GPT-4o mini)
 *
 * Solo se activa cuando ninguna regla ni módulo respondió.
 * Usa el contexto del negocio para generar respuestas coherentes.
 *
 * Costo: ~$0.00015 por 1k tokens input, $0.0006 output
 * Latencia: ~400ms — perfecto para WhatsApp
 */
export async function aiResponse(message, account, client, history = []) {
  const systemPrompt = buildSystemPrompt(account, client)
  const messages     = buildMessages(message, history, systemPrompt)

  try {
    const response = await openai.chat.completions.create(
      {
        model: 'gpt-4o-mini',
        max_tokens: 300,
        temperature: 0.7,
        messages,
      },
      { timeout: 15000 },
    )

    const text = response.choices[0]?.message?.content?.trim()
    if (!text) return null

    return { type: 'text', body: text }

  } catch (err) {
    console.error('[AI] Error llamando a GPT-4o mini:', err.message)
    // Fallback si la IA falla — nunca dejar al cliente sin respuesta
    return {
      type: 'text',
      body: `Hola${client.name ? `, ${client.name}` : ''}! Recibimos tu mensaje. Te respondemos a la brevedad.`,
    }
  }
}

// ─── Constructor del historial para OpenAI ────────────────────────────────────
// OpenAI recibe el system prompt como primer mensaje del array

function buildMessages(currentMessage, history, systemPrompt) {
  const messages = [
    { role: 'system', content: systemPrompt }
  ]

  // Historial reciente en orden cronológico (más viejo primero)
  const sorted = [...history].reverse()
  for (const h of sorted) {
    if (!h.body || h.body.startsWith('[')) continue
    messages.push({
      role: h.direction === 'in' ? 'user' : 'assistant',
      content: h.body,
    })
  }

  // Mensaje actual
  messages.push({
    role: 'user',
    content: currentMessage.body || '',
  })

  return messages
}