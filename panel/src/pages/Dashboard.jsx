import { useState, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChatCircle, UserPlus, CalendarCheck, CurrencyDollar, FilePdf } from '@phosphor-icons/react'
import { StatCard } from '../components/StatCard.jsx'
import { ConversationList } from '../components/ConversationList.jsx'
import { ChatWindow } from '../components/ChatWindow.jsx'
import { getStats, getConversations, getClientMessages, getModules, getWeeklyReport } from '../api/client.js'
import { useStore } from '../store.js'
import { useAuthStore } from '../store/authStore.js'
import { useSocket } from '../hooks/useSocket.js'

function fmtARS(n) {
  return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export default function Dashboard() {
  useEffect(() => { document.title = 'Dashboard — MateBot' }, [])
  const account = useStore((s) => s.account)
  const user = useAuthStore((s) => s.user)
  const [selectedClient, setSelectedClient] = useState(null)
  const [mobileView, setMobileView] = useState('list') // 'list' | 'chat'
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

  const { data: modules = [] } = useQuery({
    queryKey: ['modules', account?.id],
    queryFn: () => getModules(account.id).then((r) => r.data),
    enabled: !!account,
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

  const handleSelectClient = (client) => {
    setSelectedClient(client)
    setMobileView('chat')
  }

  const handleMobileBack = () => {
    setMobileView('list')
  }

  const financeActive = modules.some((m) => m.type === 'finance' && m.active)
  const canViewReport = user?.plan === 'pro' || user?.plan === 'business'

  const downloadReport = async () => {
    try {
      const { data } = await getWeeklyReport(account.id)
      const lines = [
        `Reporte semanal — ${account.name}`,
        `Período: ${new Date(data.period.from).toLocaleDateString('es-AR')} al ${new Date(data.period.to).toLocaleDateString('es-AR')}`,
        '',
        `Mensajes recibidos:  ${data.mensajes.estaSemana} (semana anterior: ${data.mensajes.semanaAnterior})`,
        `Clientes nuevos:     ${data.clientes.estaSemana} (semana anterior: ${data.clientes.semanaAnterior})`,
        `Turnos confirmados:  ${data.turnos.estaSemana} (semana anterior: ${data.turnos.semanaAnterior})`,
      ]
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-semanal-${new Date().toISOString().slice(0, 10)}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error descargando reporte:', err)
    }
  }

  if (!account) {
    return <div className="text-text-secondary text-sm">Cargando cuenta...</div>
  }

  return (
    <div className="space-y-4 lg:space-y-5 h-full flex flex-col">
      {/* Stats row — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 flex-shrink-0">
        <StatCard icon={ChatCircle}     label="Mensajes hoy"    value={stats?.mensajesToday ?? 0}   color="blue"   />
        <StatCard icon={UserPlus}       label="Clientes nuevos" value={stats?.clientesNuevos ?? 0}  color="green"  />
        <StatCard icon={CalendarCheck}  label="Turnos hoy"      value={stats?.turnosHoy ?? 0}       color="purple" />
        <StatCard
          icon={CurrencyDollar}
          label={financeActive ? 'Ventas hoy' : 'Finanzas'}
          color="yellow"
          value={
            financeActive
              ? fmtARS(stats?.ventasHoy ?? 0)
              : <span className="text-xs font-medium text-emerald-400 bg-emerald-400/15 px-2 py-0.5 rounded">Próximamente</span>
          }
        />
      </div>

      {/* Report button */}
      <div className="flex-shrink-0 flex items-center gap-3">
        {canViewReport ? (
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary
                       border border-card-border rounded-lg hover:text-text-primary
                       hover:border-accent/40 transition-colors"
          >
            <FilePdf size={15} />
            <span className="hidden sm:inline">Descargar reporte semanal</span>
            <span className="sm:hidden">Reporte</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary
                          border border-card-border rounded-lg opacity-50 cursor-not-allowed">
            <FilePdf size={15} />
            <span className="hidden sm:inline">Reporte semanal</span>
            <span className="sm:hidden">Reporte</span>
            <span className="text-xs font-medium text-amber-400 bg-amber-400/15 px-1.5 py-0.5 rounded ml-1">
              Pro
            </span>
          </div>
        )}
      </div>

      {/* Mobile: show list OR chat */}
      <div className="lg:hidden flex-1 min-h-0">
        {mobileView === 'list' || !selectedClient ? (
          <ConversationList
            conversations={conversations}
            selected={selectedClient}
            onSelect={handleSelectClient}
          />
        ) : (
          <ChatWindow
            messages={messages}
            client={selectedClient}
            accountId={account?.id}
            onBack={handleMobileBack}
          />
        )}
      </div>

      {/* Desktop: split view */}
      <div className="hidden lg:grid lg:grid-cols-[300px_1fr] gap-4 flex-1 min-h-0">
        <ConversationList
          conversations={conversations}
          selected={selectedClient}
          onSelect={setSelectedClient}
        />
        <ChatWindow messages={messages} client={selectedClient} accountId={account?.id} />
      </div>
    </div>
  )
}