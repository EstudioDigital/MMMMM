import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FilePdf, DownloadSimple, LockSimple, CalendarBlank } from '@phosphor-icons/react'
import { useStore } from '../store.js'
import { useAuthStore } from '../store/authStore.js'
import { getReports, getReportDownloadUrl } from '../api/client.js'

const TYPE_LABELS = { daily: 'Diario', weekly: 'Semanal' }
const TYPE_COLORS = {
  daily:  'bg-[#25D366]/15 text-[#25D366] border-[#25D366]/25',
  weekly: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function Reports() {
  const account = useStore((s) => s.account)
  const user    = useAuthStore((s) => s.user)
  const isPro   = ['pro', 'business'].includes(user?.plan)

  useEffect(() => { document.title = 'Reportes — MateBot' }, [])

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports', account?.id],
    queryFn:  () => getReports(account.id).then((r) => r.data),
    enabled:  !!account?.id && isPro,
  })

  if (!isPro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-[#1e1e1e] border border-white/8 flex items-center justify-center">
          <LockSimple size={28} weight="duotone" className="text-[#a0a0a0]" />
        </div>
        <h2 className="text-xl font-semibold text-[#e2e8f0]">Función exclusiva Pro</h2>
        <p className="text-[#64748b] text-sm max-w-xs">
          Los reportes PDF están disponibles a partir del plan Pro. Subí tu plan para acceder a reportes
          diarios y semanales descargables.
        </p>
        <a
          href="#precios"
          className="mt-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20c05a] text-black font-semibold text-sm rounded-xl transition-colors"
        >
          Ver planes
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Reportes PDF</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Historial de los últimos reportes generados automáticamente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748b]">Generados automáticamente a las 23:59 (diario) y lunes 8am (semanal)</span>
        </div>
      </div>

      {/* Leyenda de tipos */}
      <div className="flex flex-wrap gap-3">
        {[['daily', 'Diario'], ['weekly', 'Semanal']].map(([type, label]) => (
          <div key={type} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border ${TYPE_COLORS[type]}`}>
            <FilePdf size={12} weight="fill" />
            {label}
          </div>
        ))}
      </div>

      {/* Lista de reportes */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-text-secondary text-sm">Cargando reportes...</div>
        ) : reports.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-3 text-center">
            <CalendarBlank size={40} weight="duotone" className="text-[#a0a0a0]" />
            <p className="text-text-secondary text-sm">Todavía no hay reportes generados.</p>
            <p className="text-[#64748b] text-xs">Los reportes se generan automáticamente cada día a las 23:59.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border">
                <th className="text-left text-xs font-medium text-text-secondary px-5 py-3">Tipo</th>
                <th className="text-left text-xs font-medium text-text-secondary px-5 py-3">Archivo</th>
                <th className="text-left text-xs font-medium text-text-secondary px-5 py-3 hidden sm:table-cell">Fecha</th>
                <th className="text-right text-xs font-medium text-text-secondary px-5 py-3">Descargar</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, i) => (
                <tr key={report.id} className={i % 2 === 0 ? 'bg-transparent' : 'bg-[#0f1117]/40'}>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${TYPE_COLORS[report.type] ?? TYPE_COLORS.daily}`}>
                      {TYPE_LABELS[report.type] ?? report.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <FilePdf size={16} weight="duotone" className="text-[#a0a0a0] flex-shrink-0" />
                      <span className="text-text-primary text-sm truncate max-w-[200px] sm:max-w-none">
                        {report.filename}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className="text-text-secondary text-sm">{formatDate(report.createdAt)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <a
                      href={getReportDownloadUrl(account.id, report.id)}
                      download={report.filename}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#25D366] hover:text-[#20c05a] transition-colors"
                    >
                      <DownloadSimple size={14} weight="bold" />
                      <span className="hidden sm:inline">Descargar PDF</span>
                      <span className="sm:hidden">PDF</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info card */}
      <div className="bg-[#1a1a2e]/50 border border-white/6 rounded-xl p-4 flex gap-3">
        <FilePdf size={20} weight="duotone" className="text-[#25D366] flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-text-primary text-sm font-medium">¿Cómo funcionan los reportes?</p>
          <p className="text-text-secondary text-xs leading-relaxed">
            Los <strong className="text-text-primary">reportes diarios</strong> se generan automáticamente a las 23:59 con el resumen del día (mensajes, clientes, turnos, ventas) y se envían por WhatsApp al número configurado en Configuración → Notificaciones.<br />
            Los <strong className="text-text-primary">reportes semanales</strong> se generan los lunes a las 8am con el análisis detallado de los últimos 7 días incluyendo gráficos de actividad y top clientes.
          </p>
        </div>
      </div>
    </div>
  )
}