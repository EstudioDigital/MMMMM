import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

function initials(str) {
  return (str ?? '?').charAt(0).toUpperCase()
}

export function ConversationList({ conversations, selected, onSelect }) {
  return (
    <div className="bg-card border border-card-border rounded-lg flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-card-border flex-shrink-0">
        <h3 className="text-sm font-semibold text-text-primary">Conversaciones</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => {
          const isSelected = selected?.id === conv.client.id
          return (
            <button
              key={conv.client.id}
              onClick={() => onSelect(conv.client)}
              className={`w-full px-4 py-3 flex items-start gap-3 text-left border-b border-card-border/40 transition-colors ${
                isSelected ? 'bg-accent/10' : 'hover:bg-white/[0.03]'
              }`}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-accent/20 flex-shrink-0 flex items-center justify-center">
                <span className="text-accent text-xs font-semibold">
                  {initials(conv.client.name ?? conv.client.phone)}
                </span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {conv.client.name ?? conv.client.phone}
                  </p>
                  {conv.lastMessage?.createdAt && (
                    <span className="text-xs text-text-secondary flex-shrink-0">
                      {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                        addSuffix: false,
                        locale: es,
                      })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary truncate">
                  {conv.lastMessage?.body ?? '—'}
                </p>
              </div>
            </button>
          )
        })}

        {conversations.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-text-secondary">
            Sin conversaciones todavía
          </div>
        )}
      </div>
    </div>
  )
}
