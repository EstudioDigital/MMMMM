import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useStore } from '../store.js'
import { getAppointments, updateAppointment } from '../api/client.js'

const STATUS = {
  confirmed: { label: 'Confirmado', cls: 'bg-emerald-500/15 text-emerald-400' },
  cancelled:  { label: 'Cancelado',  cls: 'bg-red-500/15    text-red-400'     },
  completed:  { label: 'Completado', cls: 'bg-gray-500/15   text-gray-400'    },
}

function Badge({ status }) {
  const s = STATUS[status] ?? STATUS.confirmed
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  )
}

export default function Appointments() {
  const account = useStore((s) => s.account)
  const qc = useQueryClient()

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', account?.id],
    queryFn: () => getAppointments(account.id).then((r) => r.data),
    enabled: !!account,
  })

  const { mutate: changeStatus } = useMutation({
    mutationFn: ({ id, status }) => updateAppointment(account.id, id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments', account.id] }),
  })

  if (!account) return null

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">Turnos — próximos 7 días</h2>

      <div className="bg-card border border-card-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border">
              {['Cliente', 'Fecha y hora', 'Servicio', 'Estado', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-secondary uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id} className="border-b border-card-border/40 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <p className="font-medium text-text-primary">{appt.client?.name ?? '—'}</p>
                  <p className="text-xs text-text-secondary">{appt.client?.phone}</p>
                </td>
                <td className="px-4 py-3 text-text-primary">
                  {format(
                    new Date(appt.datetime),
                    "EEEE d 'de' MMMM 'a las' HH:mm",
                    { locale: es },
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary">{appt.service ?? '—'}</td>
                <td className="px-4 py-3"><Badge status={appt.status} /></td>
                <td className="px-4 py-3">
                  {appt.status === 'confirmed' && (
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => changeStatus({ id: appt.id, status: 'completed' })}
                        title="Marcar como completado"
                        className="p-1.5 text-text-secondary hover:text-emerald-400 rounded transition-colors"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => changeStatus({ id: appt.id, status: 'cancelled' })}
                        title="Cancelar turno"
                        className="p-1.5 text-text-secondary hover:text-red-400 rounded transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-text-secondary">
                  Sin turnos en los próximos 7 días
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
