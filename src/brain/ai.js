import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function aiResponse(message, account, client, history = []) {
  const config = account.aiConfig || {}
  const temperature = typeof config.temperature === 'number' ? config.temperature : 0.7
  const max_tokens = config.maxTokens ?? 300
  const customInstructions = config.customInstructions || ''

  const systemPrompt = buildSystemPrompt(account, client, customInstructions)
  const messages = buildMessages(message, history, systemPrompt)

  try {
    const response = await openai.chat.completions.create(
      { model: 'gpt-4o-mini', max_tokens, temperature, messages },
      { timeout: 15000 },
    )

    const text = response.choices[0]?.message?.content?.trim()
    if (!text) return null

    return { type: 'text', body: text }

  } catch (err) {
    console.error('[AI] Error llamando a GPT-4o mini:', err.message)
    return {
      type: 'text',
      body: `Hola${client.name ? `, ${client.name}` : ''}! Recibimos tu mensaje. Te respondemos a la brevedad.`,
    }
  }
}

function buildSystemPrompt(account, client, customInstructions = '') {
  const toneDesc = {
    friendly:  'amigable, cálido y cercano',
    formal:    'formal, profesional y serio',
    casual:    'casual, relajado e informal',
    technical: 'técnico, preciso y detallado',
  }[account.tone] ?? 'amigable, cálido y cercano'

  let prompt = `Sos el asistente de WhatsApp de "${account.name}". Tu tono debe ser ${toneDesc}.`

  if (account.businessInfo) {
    prompt += `\n\nInformación del negocio:\n${account.businessInfo}`
  }

  if (account.faq) {
    prompt += `\n\nPreguntas frecuentes:\n${account.faq}`
  }

  if (client?.name) {
    prompt += `\n\nEstás hablando con: ${client.name}.`
  }

  prompt += '\n\nSé breve y útil. Respondé en español rioplatense. Nunca inventes precios ni fechas que no se mencionaron explícitamente.'

  if (customInstructions) {
    prompt += `\n\nINSTRUCCIONES ESPECIALES:\n${customInstructions}`
  }

  return prompt
}

function buildMessages(currentMessage, history, systemPrompt) {
  const messages = [{ role: 'system', content: systemPrompt }]

  // Historial en orden cronológico (más viejo primero)
  const sorted = [...history].reverse()
  for (const h of sorted) {
    if (!h.body || h.body.startsWith('[')) continue
    messages.push({
      role: h.direction === 'in' ? 'user' : 'assistant',
      content: h.body,
    })
  }

  messages.push({ role: 'user', content: currentMessage.body || '' })
  return messages
}