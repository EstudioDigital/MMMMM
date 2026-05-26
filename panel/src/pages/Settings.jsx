import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FloppyDisk, Check } from '@phosphor-icons/react'
import { useStore } from '../store.js'
import { useAuthStore } from '../store/authStore.js'
import { getAccount, updateAccount, getModules, updateModule, getAiConfig, updateAiConfig, cancelSubscription, updateNotificationSettings } from '../api/client.js'

const TONES = [
  { value: 'friendly',  label: 'Amigable',  desc: 'Cálido y cercano'    },
  { value: 'formal',    label: 'Formal',    desc: 'Profesional y serio'  },
  { value: 'casual',    label: 'Casual',    desc: 'Relajado e informal'  },
  { value: 'technical', label: 'Técnico',   desc: 'Preciso y detallado'  },
]

const MODULES = [
  { type: 'appointments', label: 'Turnos',          desc: 'Gestión de reservas y recordatorios', soon: false },
  { type: 'catalog',      label: 'Catálogo',         desc: 'Mostrar productos y tomar pedidos',   soon: false },
  { type: 'ai',           label: 'IA Generativa',    desc: 'Respuestas automáticas con GPT',      soon: false },
  { type: 'finance',      label: 'Finanzas',         desc: 'Registro de ingresos y gastos',       soon: true  },
  { type: 'loyalty',      label: 'Fidelización',     desc: 'Puntos y recompensas',               soon: true  },
  { type: 'campaigns',    label: 'Campañas masivas', desc: 'Envíos masivos a clientes',           soon: true  },
]

const AI_HISTORY_OPTIONS = [
  { value: 0,  label: 'Sin historial (responde sin contexto)' },
  { value: 5,  label: 'Últimos 5 mensajes' },
  { value: 10, label: 'Últimos 10 mensajes (recomendado)' },
  { value: 20, label: 'Últimos 20 mensajes' },
]

const AI_TOKENS_OPTIONS = [
  { value: 100, label: 'Muy corto (1-2 oraciones)' },
  { value: 200, label: 'Corto (2-3 oraciones)' },
  { value: 300, label: 'Medio (un párrafo)' },
  { value: 500, label: 'Largo (respuesta detallada)' },
]

const INPUT = 'w-full bg-sidebar border border-card-border rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition-colors'

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
        disabled ? 'opacity-40 cursor-not-allowed bg-card-border' : checked ? 'bg-accent' : 'bg-card-border'
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked && !disabled ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  )
}

function CancelModal({ onClose, accountId }) {
  const [step, setStep] = useState(1)
  const [input, setInput] = useState('')
  const qc = useQueryClient()
  const { updateUser } = useAuthStore()

  const { mutate: doCancel, isPending } = useMutation({
    mutationFn: () => cancelSubscription(accountId),
    onSuccess: () => {
      updateUser({ plan: 'starter' })
      qc.invalidateQueries({ queryKey: ['modules'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-card-border rounded-xl p-6 w-full max-w-md mx-4">
        {step === 1 ? (
          <>
            <h3 className="text-base font-semibold text-text-primary mb-2">¿Cancelar suscripción?</h3>
            <p className="text-sm text-text-secondary mb-4">
              Al cancelar tu suscripción perderás acceso a:
            </p>
            <ul className="text-sm text-text-secondary space-y-1 mb-5 list-disc list-inside">
              <li>IA Generativa (respuestas automáticas con GPT)</li>
              <li>Reportes semanales descargables</li>
              <li>Configuración avanzada de IA</li>
            </ul>
            <p className="text-sm text-text-secondary mb-5">
              Tu cuenta pasará al plan <strong className="text-text-primary">Starter</strong> inmediatamente.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                Mantener plan
              </button>
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-sm bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                Continuar cancelación
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-base font-semibold text-text-primary mb-2">Confirmación final</h3>
            <p className="text-sm text-text-secondary mb-4">
              Escribí <strong className="text-red-400">CANCELAR</strong> para confirmar la cancelación:
            </p>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí CANCELAR"
              className={`${INPUT} mb-4`}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => doCancel()}
                disabled={input !== 'CANCELAR' || isPending}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'Procesando...' : 'Confirmar cancelación'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Settings() {
  useEffect(() => { document.title = 'Configuración — MateBot' }, [])
  const account = useStore((s) => s.account)
  const setAccount = useStore((s) => s.setAccount)
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [tone, setTone] = useState('friendly')
  const [saved, setSaved] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  // AI config state
  const [aiConfig, setAiConfig] = useState({ temperature: 0.7, maxTokens: 300, customInstructions: '', historyLength: 10 })
  const [aiSaved, setAiSaved] = useState(false)

  // Notification settings state
  const [notifyPhone1, setNotifyPhone1] = useState('')
  const [notifyPhone2, setNotifyPhone2] = useState('')
  const [reportEnabled, setReportEnabled] = useState(true)
  const [notifySaved, setNotifySaved] = useState(false)

  const isProOrBusiness = user?.plan === 'pro' || user?.plan === 'business'

  const isModuleAvailable = (moduleType) => {
    if (moduleType === 'ai' && !isProOrBusiness) return false
    return true
  }

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

  const { data: aiConfigData } = useQuery({
    queryKey: ['ai-config', account?.id],
    queryFn: () => getAiConfig(account.id).then((r) => r.data),
    enabled: !!account && isProOrBusiness,
  })

  useEffect(() => {
    if (accountData?.tone) setTone(accountData.tone)
  }, [accountData?.tone])

  useEffect(() => {
    if (accountData) {
      setNotifyPhone1(accountData.notifyPhone1 ?? '')
      setNotifyPhone2(accountData.notifyPhone2 ?? '')
      setReportEnabled(accountData.reportEnabled ?? true)
    }
  }, [accountData?.notifyPhone1, accountData?.notifyPhone2, accountData?.reportEnabled])

  useEffect(() => {
    if (aiConfigData && Object.keys(aiConfigData).length > 0) {
      setAiConfig((prev) => ({ ...prev, ...aiConfigData }))
    }
  }, [aiConfigData])

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) => updateAccount(account.id, data),
    onSuccess: (r) => {
      setAccount(r.data)
      qc.invalidateQueries({ queryKey: ['account', account.id] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const { mutate: saveAI, isPending: savingAI } = useMutation({
    mutationFn: (data) => updateAiConfig(account.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-config', account.id] })
      setAiSaved(true)
      setTimeout(() => setAiSaved(false), 2500)
    },
  })

  const { mutate: saveNotify, isPending: savingNotify } = useMutation({
    mutationFn: (data) => updateNotificationSettings(account.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account', account.id] })
      setNotifySaved(true)
      setTimeout(() => setNotifySaved(false), 2500)
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
    <div className="max-w-2xl space-y-5 lg:space-y-6">
      <h2 className="text-lg font-semibold text-text-primary">Configuración</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* General */}
        <section className="bg-card border border-card-border rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">General</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent/90 transition-colors disabled:opacity-60">
          {saved ? <Check size={15} weight="bold" /> : <FloppyDisk size={15} weight="bold" />}
          {saved ? '¡Guardado!' : isPending ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>

      {/* Modules */}
      <section className="bg-card border border-card-border rounded-lg p-5 space-y-1">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Módulos activos</h3>
        {MODULES.map(({ type, label, desc, soon }) => {
          const mod = modules.find((m) => m.type === type)
          const planLocked = !soon && !isModuleAvailable(type)
          const isDisabled = soon || planLocked
          return (
            <div key={type} className="flex items-center justify-between py-3 border-b border-card-border/40 last:border-0">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary">{label}</p>
                  {soon && (
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-400/15 px-1.5 py-0.5 rounded">
                      Próximamente
                    </span>
                  )}
                  {planLocked && (
                    <span className="text-xs font-medium text-amber-400 bg-amber-400/15 px-1.5 py-0.5 rounded">
                      Requiere plan Pro
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-secondary">{desc}</p>
              </div>
              <div title={
                soon ? 'Este módulo estará disponible pronto'
                : planLocked ? 'Disponible desde el plan Pro ($39/mes)'
                : undefined
              }>
                <Toggle
                  checked={mod?.active ?? false}
                  onChange={() => toggleModule(type)}
                  disabled={isDisabled}
                />
              </div>
            </div>
          )
        })}
      </section>

      {/* Notification settings */}
      <section className="bg-card border border-card-border rounded-lg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">Notificaciones y reportes</h3>
        <p className="text-xs text-text-secondary">
          Configurá los números que reciben notificaciones y el reporte diario por WhatsApp.
        </p>

        <div>
          <label className="text-xs font-medium text-text-secondary block mb-1">Número principal (dueño/encargado)</label>
          <input
            type="text"
            value={notifyPhone1}
            onChange={(e) => setNotifyPhone1(e.target.value)}
            placeholder="+54 9 351 123-4567"
            className={INPUT}
          />
          <p className="text-xs text-text-secondary mt-1">Recibe alertas de turnos, pedidos y el reporte diario.</p>
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary block mb-1">Número secundario (opcional)</label>
          <input
            type="text"
            value={notifyPhone2}
            onChange={(e) => setNotifyPhone2(e.target.value)}
            placeholder="+54 9 351 765-4321"
            className={INPUT}
          />
          <p className="text-xs text-text-secondary mt-1">Por ejemplo el contador, un socio o encargado de turno.</p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-sm font-medium text-text-primary">Reporte diario automático</p>
            <p className="text-xs text-text-secondary">Se envía todos los días a las 23:59hs</p>
          </div>
          <Toggle checked={reportEnabled} onChange={() => setReportEnabled((v) => !v)} />
        </div>

        <button
          onClick={() => saveNotify({ notifyPhone1: notifyPhone1 || null, notifyPhone2: notifyPhone2 || null, reportEnabled })}
          disabled={savingNotify}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent/90 transition-colors disabled:opacity-60"
        >
          {notifySaved ? <Check size={15} weight="bold" /> : <FloppyDisk size={15} weight="bold" />}
          {notifySaved ? '¡Guardado!' : savingNotify ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </section>

      {/* AI Config — solo Pro/Business */}
      {isProOrBusiness && (
        <section className="bg-card border border-card-border rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Configuración de IA</h3>

          <div>
            <label className="text-xs font-medium text-text-secondary block mb-2">
              Creatividad de las respuestas — {aiConfig.temperature}
            </label>
            <input
              type="range" min="0" max="1" step="0.1"
              value={aiConfig.temperature}
              onChange={(e) => setAiConfig((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-text-secondary">Preciso y formal</span>
              <span className="text-xs text-text-secondary">Creativo y natural</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Largo máximo de respuesta</label>
            <select
              value={aiConfig.maxTokens}
              onChange={(e) => setAiConfig((prev) => ({ ...prev, maxTokens: Number(e.target.value) }))}
              className={INPUT}
            >
              {AI_TOKENS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Mensajes de historial a considerar</label>
            <select
              value={aiConfig.historyLength}
              onChange={(e) => setAiConfig((prev) => ({ ...prev, historyLength: Number(e.target.value) }))}
              className={INPUT}
            >
              {AI_HISTORY_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Instrucciones especiales para la IA</label>
            <textarea
              rows={4}
              value={aiConfig.customInstructions}
              onChange={(e) => setAiConfig((prev) => ({ ...prev, customInstructions: e.target.value }))}
              placeholder="Ej: Siempre ofrecer el servicio premium. Nunca mencionar precios sin consultar disponibilidad primero."
              className={`${INPUT} resize-none`}
            />
          </div>

          <button
            onClick={() => saveAI(aiConfig)}
            disabled={savingAI}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent/90 transition-colors disabled:opacity-60"
          >
            {aiSaved ? <Check size={15} weight="bold" /> : <FloppyDisk size={15} weight="bold" />}
            {aiSaved ? '¡Configuración guardada!' : savingAI ? 'Guardando...' : 'Guardar configuración de IA'}
          </button>
        </section>
      )}

      {/* Danger zone */}
      <section className="border border-red-500/20 rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-semibold text-red-400">Zona de peligro</h3>
        <p className="text-sm text-text-secondary">
          Al cancelar tu suscripción, tu cuenta pasará al plan Starter inmediatamente con funcionalidades limitadas.
        </p>
        <button
          onClick={() => setShowCancelModal(true)}
          className="border border-red-500/40 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Cancelar suscripción
        </button>
      </section>

      {showCancelModal && (
        <CancelModal onClose={() => setShowCancelModal(false)} accountId={account.id} />
      )}
    </div>
  )
}