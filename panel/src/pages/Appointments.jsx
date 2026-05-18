import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X } from '@phosphor-icons/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useStore } from '../store.js'
import { getAppointments, updateAppointment, getBusinessHours, updateBusinessHours } from '../api/client.js'

const STATUS = {
  confirmed: { label: 'Confirmado', cls: 'bg-emerald-500/15 text-emerald-400' },
  cancelled:  { label: 'Cancelado',  cls: 'bg-red-500/15    text-red-400'     },
  completed:  { label: 'Completado', cls: 'bg-gray-500/15   text-gray-400'    },
}

const DAY_NAMES     = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] // Lun→Sáb→Dom
const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120]

const DEFAULT_HOURS = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
  dayOfWeek:    d,
  isOpen:       d >= 1 && d <= 5,
  openTime:     '09:00',
  closeTime:    '18:00',
  slotDuration: 60,
}))

function Badge({ status }) {
  const s = STATUS[status] ?? STATUS.confirmed
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-card-border'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  )
}

const INPUT_CLS = 'bg-sidebar border border-card-border rounded px-2 py-1 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors'

export default function Appointments() {
  useEffect(() => { document.title = 'Turnos — MateBot' }, [])
  const account = useStore((s) => s.account)
  const qc = useQueryClient()
  const [tab, setTab] = useState('upcoming')
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const [saved, setSaved] = useState(false)

  // ── Turnos próximos ────────────────────────────────────────────────────────
  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', account?.id],
    queryFn: () => getAppointments(account.id).then((r) => r.data),
    enabled: !!account,
  })

  const { mutate: changeStatus } = useMutation({
    mutationFn: ({ id, status }) => updateAppointment(account.id, id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments', account.id] }),
  })

  // ── Horarios ───────────────────────────────────────────────────────────────
  const { data: hoursData } = useQuery({
    queryKey: ['business-hours', account?.id],
    queryFn: () => getBusinessHours(account.id).then((r) => r.data),
    enabled: !!account,
  })

  useEffect(() => {
    if (hoursData?.length) setHours(hoursData)
  }, [hoursData])

  const { mutate: saveHours, isPending: saving } = useMutation({
    mutationFn: (data) => updateBusinessHours(account.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-hours', account.id] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const updateDay = (dayOfWeek, field, value) =>
    setHours((prev) => prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h)))

  if (!account) return null

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">Turnos</h2>

      {/* Tab nav */}
      <div className="flex gap-1 bg-card border border-card-border rounded-lg p-1 w-fit">
        {[
          { id: 'upcoming', label: 'Turnos próximos' },
          { id: 'hours',    label: 'Configurar horarios' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              tab === id
                ? 'bg-accent text-white font-medium'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Turnos próximos ── */}
      {tab === 'upcoming' && (
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
                    {format(new Date(appt.datetime), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
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
      )}

      {/* ── Tab: Configurar horarios ── */}
      {tab === 'hours' && (
        <div className="bg-card border border-card-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[160px_80px_1fr] gap-4 px-5 py-3 border-b border-card-border">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Día</span>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Abierto</span>
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">Horario y duración de turno</span>
          </div>

          {DISPLAY_ORDER.map((dayOfWeek) => {
            const day = hours.find((h) => h.dayOfWeek === dayOfWeek) ?? DEFAULT_HOURS.find((h) => h.dayOfWeek === dayOfWeek)
            return (
              <div
                key={dayOfWeek}
                className="grid grid-cols-[160px_80px_1fr] gap-4 items-center px-5 py-3.5 border-b border-card-border/40 last:border-0"
              >
                <span className="text-sm font-medium text-text-primary">{DAY_NAMES[dayOfWeek]}</span>

                <Toggle
                  checked={day.isOpen}
                  onChange={() => updateDay(dayOfWeek, 'isOpen', !day.isOpen)}
                />

                {day.isOpen ? (
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">Desde</span>
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => updateDay(dayOfWeek, 'openTime', e.target.value)}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">Hasta</span>
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => updateDay(dayOfWeek, 'closeTime', e.target.value)}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-secondary">Turno cada</span>
                      <select
                        value={day.slotDuration}
                        onChange={(e) => updateDay(dayOfWeek, 'slotDuration', Number(e.target.value))}
                        className={INPUT_CLS}
                      >
                        {DURATION_OPTIONS.map((min) => (
                          <option key={min} value={min}>{min} min</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-text-secondary italic">Cerrado</span>
                )}
              </div>
            )
          })}

          <div className="px-5 py-4 border-t border-card-border">
            <button
              onClick={() => saveHours(hours)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent/90 transition-colors disabled:opacity-60"
            >
              {saved && <Check size={15} weight="bold" />}
              {saved ? '¡Horarios guardados!' : saving ? 'Guardando...' : 'Guardar horarios'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}