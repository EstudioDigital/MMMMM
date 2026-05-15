import { useState, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChatCircle, UserPlus, CalendarCheck, CurrencyDollar } from '@phosphor-icons/react'
import { StatCard } from '../components/StatCard.jsx'
import { ConversationList } from '../components/ConversationList.jsx'
import { ChatWindow } from '../components/ChatWindow.jsx'
import { getStats, getConversations, getClientMessages } from '../api/client.js'
import { useStore } from '../store.js'
import { useSocket } from '../hooks/useSocket.js'

function fmtARS(n) {
  return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export default function Dashboard() {
  useEffect(() => { document.title = 'Dashboard — MateBot' }, [])
  const account = useStore((s) => s.account)
  const [selectedClient, setSelectedClient] = useState(null)
  const qc = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['stats', account?.id],
    queryFn: () => getStats(account.id).then((r) => r.data),
    enabled: !!account,
    refetchInterval: 60_000,
  })

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', account?.id],
    queryFn: () => getConversations(account.id).then((r) => r.data),
    enabled: !!account,
  })

  const { data: messages = [] } = useQuery({
    queryKey: ['client-messages', account?.id, selectedClient?.id],
    queryFn: () => getClientMessages(account.id, selectedClient.id).then((r) => r.data),
    enabled: !!account && !!selectedClient,
  })

  const handleNewMessage = useCallback(
    (data) => {
      if (data.accountId !== account?.id) return
      qc.invalidateQueries({ queryKey: ['conversations', account.id] })
      qc.invalidateQueries({ queryKey: ['stats', account.id] })
      if (selectedClient?.id === data.client?.id) {
        qc.invalidateQueries({ queryKey: ['client-messages', account.id, selectedClient.id] })
      }
    },
    [account, selectedClient, qc],
  )

  useSocket('new_message', handleNewMessage)

  if (!account) {
    return <div className="text-text-secondary text-sm">Cargando cuenta...</div>
  }

  return (
    <div className="space-y-5 h-full flex flex-col">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 flex-shrink-0">
        <StatCard icon={ChatCircle}     label="Mensajes hoy"    value={stats?.mensajesToday ?? 0}              color="blue"   />
        <StatCard icon={UserPlus}      label="Clientes nuevos" value={stats?.clientesNuevos ?? 0}             color="green"  />
        <StatCard icon={CalendarCheck} label="Turnos hoy"      value={stats?.turnosHoy ?? 0}                  color="purple" />
        <StatCard icon={CurrencyDollar} label="Ventas hoy"     value={fmtARS(stats?.ventasHoy ?? 0)}          color="yellow" />
      </div>

      {/* Conversation panel */}
      <div className="grid grid-cols-[300px_1fr] gap-4 flex-1 min-h-0">
        <ConversationList
          conversations={conversations}
          selected={selectedClient}
          onSelect={setSelectedClient}
        />
        <ChatWindow messages={messages} client={selectedClient} />
      </div>
    </div>
  )
}
