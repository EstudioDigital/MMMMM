import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FloppyDisk, Check } from '@phosphor-icons/react'
import { useStore } from '../store.js'
import { getAccount, updateAccount, getModules, updateModule } from '../api/client.js'

const TONES = [
  { value: 'friendly',  label: 'Amigable',  desc: 'Cálido y cercano'       },
  { value: 'formal',    label: 'Formal',    desc: 'Profesional y serio'    },
  { value: 'casual',    label: 'Casual',    desc: 'Relajado e informal'     },
  { value: 'technical', label: 'Técnico',   desc: 'Preciso y detallado'    },
]

const MODULES = [
  { type: 'appointments', label: 'Turnos',         desc: 'Gestión de reservas y recordatorios' },
  { type: 'catalog',      label: 'Catálogo',        desc: 'Mostrar productos y tomar pedidos'   },
  { type: 'finance',      label: 'Finanzas',        desc: 'Registro de ingresos y gastos'       },
  { type: 'ai',           label: 'IA Generativa',   desc: 'Respuestas automáticas con GPT'      },
  { type: 'campaigns',    label: 'Campañas',        desc: 'Envíos masivos a clientes'           },
  { type: 'loyalty',      label: 'Fidelización',    desc: 'Puntos y recompensas'               },
]

const INPUT = 'w-full bg-sidebar border border-card-border rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors'

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-card-border'}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  )
}

export default function Settings() {
  useEffect(() => { document.title = 'Configuración — MateBot' }, [])
  const account = useStore((s) => s.account)
  const setAccount = useStore((s) => s.setAccount)
  const qc = useQueryClient()
  const [tone, setTone] = useState('friendly')
  const [saved, setSaved] = useState(false)

  const { data: accountData } = useQuery({
    queryKey: ['account', account?.id],
    queryFn: () => getAccount(account.id).then((r) => r.data),
    enabled: !!account,
  })

  const { data: modules = [] } = useQuery({
    queryKey: ['modules', account?.id],
    queryFn: () => getModules(account.id).then((r) => r.data),
    enabled: !!account,
  })

  useEffect(() => {
    if (accountData?.tone) setTone(accountData.tone)
  }, [accountData?.tone])

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => updateAccount(account.id, data),
    onSuccess: (r) => {
      setAccount(r.data)
      qc.invalidateQueries({ queryKey: ['account', account.id] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const toggleModule = (type) => {
    const mod = modules.find((m) => m.type === type)
    updateModule(account.id, type, { active: !(mod?.active ?? false) }).then(() =>
      qc.invalidateQueries({ queryKey: ['modules', account.id] }),
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const f = new FormData(e.target)
    save({
      name:         f.get('name'),
      industry:     f.get('industry') || null,
      ownerPhone:   f.get('ownerPhone'),
      tone,
      businessInfo: f.get('businessInfo') || null,
      faq:          f.get('faq') || null,
    })
  }

  if (!account || !accountData) return <div className="text-sm text-text-secondary">Cargando...</div>

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold text-text-primary">Configuración</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* General */}
        <section className="bg-card border border-card-border rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">General</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Nombre del negocio</label>
              <input name="name" defaultValue={accountData.name} className={INPUT} />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Industria</label>
              <input name="industry" defaultValue={accountData.industry ?? ''} placeholder="Ej: Verdulería, Peluquería..." className={INPUT} />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary block mb-1">Teléfono del dueño</label>
              <input name="ownerPhone" defaultValue={accountData.ownerPhone} className={INPUT} />
            </div>
          </div>
        </section>

        {/* Tone */}
        <section className="bg-card border border-card-border rounded-lg p-5 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Tono del bot</h3>
          <div className="grid grid-cols-4 gap-3">
            {TONES.map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTone(value)}
                className={`border rounded-lg p-3 text-center transition-colors ${
                  tone === value
                    ? 'border-accent bg-accent/10'
                    : 'border-card-border hover:border-accent/40'
                }`}
              >
                <p className="text-sm font-medium text-text-primary">{label}</p>
                <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Business info */}
        <section className="bg-card border border-card-border rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Información para el bot</h3>
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Descripción del negocio</label>
            <textarea name="businessInfo" rows={3} defaultValue={accountData.businessInfo ?? ''}
              placeholder="Describí tu negocio: qué hacen, dónde están, horarios de atención..."
              className={`${INPUT} resize-none`} />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Preguntas frecuentes</label>
            <textarea name="faq" rows={4} defaultValue={accountData.faq ?? ''}
              placeholder="Preguntas y respuestas frecuentes de tu negocio..."
              className={`${INPUT} resize-none`} />
          </div>
        </section>

        <button type="submit" disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent/90 transition-colors disabled:opacity-60">
          {saved ? <Check size={15} weight="bold" /> : <FloppyDisk size={15} weight="bold" />}
          {saved ? '¡Guardado!' : isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      {/* Modules */}
      <section className="bg-card border border-card-border rounded-lg p-5 space-y-1">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Módulos activos</h3>
        {MODULES.map(({ type, label, desc }) => {
          const mod = modules.find((m) => m.type === type)
          return (
            <div key={type} className="flex items-center justify-between py-3 border-b border-card-border/40 last:border-0">
              <div>
                <p className="text-sm font-medium text-text-primary">{label}</p>
                <p className="text-xs text-text-secondary">{desc}</p>
              </div>
              <Toggle checked={mod?.active ?? false} onChange={() => toggleModule(type)} />
            </div>
          )
        })}
      </section>
    </div>
  )
}
