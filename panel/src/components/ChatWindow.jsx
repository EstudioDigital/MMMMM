import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ChatCircleDots, PaperPlaneTilt, ArrowLeft } from '@phosphor-icons/react'
import { sendMessage } from '../api/client.js'

function initials(str) {
  return (str ?? '?').charAt(0).toUpperCase()
}

export function ChatWindow({ messages, client, accountId, onBack }) {
  const bottomRef = useRef(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendReply = async () => {
    if (!replyText.trim() || sending) return
    setSending(true)
    try {
      await sendMessage(accountId, { clientPhone: client.phone, message: replyText.trim() })
      setReplyText('')
    } catch (err) {
      console.error('Error enviando mensaje:', err)
    } finally {
      setSending(false)
    }
  }

  if (!client) {
    return (
      <div className="bg-card border border-card-border rounded-lg flex items-center justify-center">
        <div className="text-center">
          <ChatCircleDots size={36} weight="duotone" className="mx-auto mb-3 text-text-secondary opacity-40" />
          <p className="text-sm text-text-secondary">Seleccioná una conversación</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-card-border rounded-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-card-border flex items-center gap-3 flex-shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 -ml-1 text-text-secondary hover:text-text-primary rounded transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
          <span className="text-accent text-xs font-semibold">
            {initials(client.name ?? client.phone)}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">{client.name ?? client.phone}</p>
          <p className="text-xs text-text-secondary">+{client.phone}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[72%] px-3 py-2 rounded-xl text-sm ${
                msg.direction === 'out'
                  ? 'bg-accent/20 text-text-primary rounded-br-sm'
                  : 'bg-card-border text-text-primary rounded-bl-sm'
              }`}
            >
              <p className="leading-relaxed">{msg.body}</p>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                {msg.direction === 'out' && msg.autoSent && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
                    Auto
                  </span>
                )}
                {msg.direction === 'out' && !msg.autoSent && (
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-medium">
                    Manual
                  </span>
                )}
                {msg.createdAt && (
                  <span className="text-[10px] text-text-secondary">
                    {format(new Date(msg.createdAt), 'HH:mm')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="text-center text-sm text-text-secondary py-8">Sin mensajes</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      <div className="border-t border-card-border p-3 flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
          placeholder="Escribir respuesta manual..."
          className="flex-1 bg-sidebar border border-card-border rounded-lg px-3 py-2
                     text-sm text-text-primary placeholder-text-secondary
                     focus:outline-none focus:border-accent transition-colors"
        />
        <button
          onClick={handleSendReply}
          disabled={!replyText.trim() || sending}
          className="bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed
                     text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <PaperPlaneTilt size={15} weight="fill" />
          {sending ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}