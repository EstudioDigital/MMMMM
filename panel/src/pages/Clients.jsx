import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useStore } from '../store.js'
import { getClients, getClientMessages } from '../api/client.js'

export default function Clients() {
  useEffect(() => { document.title = 'Clientes — MateBot' }, [])
  const account = useStore((s) => s.account)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', account?.id],
    queryFn: () => getClients(account.id).then((r) => r.data),
    enabled: !!account,
  })

  const { data: messages = [] } = useQuery({
    queryKey: ['client-messages', account?.id, selected?.id],
    queryFn: () => getClientMessages(account.id, selected.id).then((r) => r.data),
    enabled: !!account && !!selected,
  })

  const filtered = clients.filter(
    (c) =>
      !search ||
      (c.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  )

  if (!account) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Clientes ({clients.length})</h2>
        <div className="relative">
          <MagnifyingGlass size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o número..."
            className="bg-card border border-card-border rounded-md pl-8 pr-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors w-64"
          />
        </div>
      </div>

      <div className={`grid gap-4 ${selected ? 'grid-cols-[1fr_360px]' : ''}`}>
        {/* Table */}
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border">
                {['Cliente', 'Última visita', 'Mensajes', 'Puntos'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`border-b border-card-border/40 cursor-pointer transition-colors ${
                    selected?.id === c.id ? 'bg-accent/10' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{c.name ?? 'Sin nombre'}</p>
                    <p className="text-xs text-text-secondary">+{c.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs">
                    {c.lastContact
                      ? formatDistanceToNow(new Date(c.lastContact), { addSuffix: true, locale: es })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{c._count?.messages ?? 0}</td>
                  <td className="px-4 py-3 text-text-secondary">{c.points ?? 0}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-text-secondary">
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Conversation side panel */}
        {selected && (
          <div className="bg-card border border-card-border rounded-lg flex flex-col overflow-hidden max-h-[600px]">
            <div className="px-4 py-3 border-b border-card-border flex items-center justify-between flex-shrink-0">
              <div>
                <p className="text-sm font-semibold text-text-primary">{selected.name ?? selected.phone}</p>
                <p className="text-xs text-text-secondary">+{selected.phone}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-text-secondary hover:text-text-primary p-1 rounded">
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    msg.direction === 'out'
                      ? 'bg-accent/20 text-text-primary rounded-br-sm'
                      : 'bg-card-border text-text-primary rounded-bl-sm'
                  }`}>
                    <p className="leading-relaxed">{msg.body}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {msg.autoSent && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 rounded-full">Auto</span>
                      )}
                      <span className="text-[10px] text-text-secondary">
                        {format(new Date(msg.createdAt), 'dd/MM HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-center text-xs text-text-secondary py-6">Sin mensajes</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
