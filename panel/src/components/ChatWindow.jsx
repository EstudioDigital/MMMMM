import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ChatCircleDots } from '@phosphor-icons/react'

function initials(str) {
  return (str ?? '?').charAt(0).toUpperCase()
}

export function ChatWindow({ messages, client }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
                {msg.autoSent && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">
                    Auto
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
    </div>
  )
}
