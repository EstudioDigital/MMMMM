import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Loader2, Check, ChevronRight, ExternalLink } from 'lucide-react'
import { useAuthStore } from '../store/authStore.js'
import api, { setupAccount } from '../api/client.js'

const STEPS = ['Tu negocio', 'WhatsApp', 'Plan', '¡Listo!']

const INDUSTRIES = [
  { value: 'clinic',      label: '🏥 Clínica / Consultorio' },
  { value: 'grocery',     label: '🥦 Verdulería / Almacén' },
  { value: 'gym',         label: '🏋️ Gimnasio / Fitness' },
  { value: 'realestate',  label: '🏠 Inmobiliaria' },
  { value: 'restaurant',  label: '🍕 Restaurante / Gastronomía' },
  { value: 'beauty',      label: '✂️ Peluquería / Estética' },
  { value: 'other',       label: '🏢 Otro' },
]

const TONES = [
  { value: 'formal',    label: 'Formal',   desc: 'Profesional y respetuoso' },
  { value: 'friendly',  label: 'Amigable', desc: 'Cálido y cercano' },
  { value: 'casual',    label: 'Casual',   desc: 'Relajado e informal' },
]

const PLANS = [
  {
    name: 'Starter',
    price: 19,
    features: ['1 número de WhatsApp', 'Respuestas ilimitadas', 'Módulo de turnos', 'Historial 30 días'],
  },
  {
    name: 'Pro',
    price: 39,
    badge: 'Más elegido',
    features: ['3 números de WhatsApp', 'Todo Starter +', 'Catálogo y pedidos', 'Control de finanzas', 'IA conversacional'],
  },
  {
    name: 'Business',
    price: 79,
    features: ['10 números de WhatsApp', 'Todo Pro +', 'Fidelización', 'Soporte 24/7'],
  },
]

function Stepper({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                i < current
                  ? 'bg-[#25D366] text-black'
                  : i === current
                  ? 'bg-[#25D366]/20 border-2 border-[#25D366] text-[#25D366]'
                  : 'bg-[#1e2030] border border-[#2a2d3e] text-[#64748b]'
              }`}
            >
              {i < current ? <Check size={13} /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === current ? 'text-[#e2e8f0]' : 'text-[#64748b]'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-12 sm:w-20 h-px mx-1 mb-5 transition-colors ${i < current ? 'bg-[#25D366]' : 'bg-[#2a2d3e]'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Paso 1: Información del negocio ──────────────────────────────────────────
function Step1({ data, onChange, onNext }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-[#e2e8f0] mb-1">Contanos sobre tu negocio</h2>
        <p className="text-[#64748b] text-sm">Usamos esto para personalizar el bot.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#e2e8f0]">Nombre del negocio</label>
        <input
          type="text"
          placeholder="Ej: Peluquería El Rincón"
          value={data.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3.5 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#25D366] transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#e2e8f0]">Industria</label>
        <div className="grid grid-cols-2 gap-2">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind.value}
              type="button"
              onClick={() => onChange('industry', ind.value)}
              className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                data.industry === ind.value
                  ? 'border-[#25D366] bg-[#25D366]/10 text-[#e2e8f0]'
                  : 'border-[#2a2d3e] text-[#64748b] hover:border-[#25D366]/40 hover:text-[#e2e8f0]'
              }`}
            >
              {ind.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#e2e8f0]">Teléfono del dueño <span className="text-[#64748b]">(opcional)</span></label>
        <input
          type="tel"
          placeholder="+54 9 11 1234-5678"
          value={data.ownerPhone}
          onChange={(e) => onChange('ownerPhone', e.target.value)}
          className="bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3.5 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#25D366] transition-colors"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-[#e2e8f0]">Tono del bot</label>
        <div className="grid grid-cols-3 gap-2">
          {TONES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange('tone', t.value)}
              className={`flex flex-col items-center gap-1 px-3 py-3 rounded-lg border text-center transition-colors ${
                data.tone === t.value
                  ? 'border-[#25D366] bg-[#25D366]/10'
                  : 'border-[#2a2d3e] hover:border-[#25D366]/40'
              }`}
            >
              <span className={`font-medium text-sm ${data.tone === t.value ? 'text-[#25D366]' : 'text-[#e2e8f0]'}`}>
                {t.label}
              </span>
              <span className="text-[#64748b] text-xs">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!data.name}
        className="bg-[#25D366] hover:bg-[#20c05a] disabled:opacity-50 text-black font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
      >
        Continuar <ChevronRight size={16} />
      </button>
    </div>
  )
}

// ── Paso 2: WhatsApp Business ─────────────────────────────────────────────────
function Step2({ data, onChange, onNext, onBack, loading, error }) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      await api.post('/auth/verify-wa-test', {
        phoneNumberId: data.phoneNumberId,
        waToken: data.waToken,
      })
      setTestResult({ ok: true, msg: 'Conexión exitosa ✓' })
    } catch {
      setTestResult({ ok: false, msg: 'No se pudo conectar. Verificá los datos.' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-[#e2e8f0] mb-1">Conectá tu WhatsApp Business</h2>
        <p className="text-[#64748b] text-sm">Necesitás una cuenta de Meta Developer.</p>
      </div>

      <div className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl p-4 flex flex-col gap-3">
        <p className="text-xs font-medium text-[#64748b] uppercase tracking-wider">Pasos para obtener las credenciales</p>
        {[
          'Entrá a developers.facebook.com',
          'Creá una app de tipo "Business"',
          'Agregá el producto WhatsApp',
          'Copiá el Phone Number ID',
          'Copiá el Access Token temporal',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-[#25D366]/15 text-[#25D366] text-xs flex items-center justify-center flex-shrink-0 font-semibold">
              {i + 1}
            </span>
            <span className="text-sm text-[#e2e8f0]">{step}</span>
          </div>
        ))}
        <a
          href="https://developers.facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-[#25D366] hover:underline mt-1"
        >
          Ir a Meta Developers <ExternalLink size={11} />
        </a>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#e2e8f0]">Phone Number ID</label>
        <input
          type="text"
          placeholder="123456789012345"
          value={data.phoneNumberId}
          onChange={(e) => onChange('phoneNumberId', e.target.value)}
          className="bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3.5 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#25D366] transition-colors font-mono"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-[#e2e8f0]">Access Token</label>
        <input
          type="password"
          placeholder="EAAxxxxxxx..."
          value={data.waToken}
          onChange={(e) => onChange('waToken', e.target.value)}
          className="bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3.5 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#25D366] transition-colors font-mono"
        />
      </div>

      {data.phoneNumberId && data.waToken && (
        <button
          type="button"
          onClick={testConnection}
          disabled={testing}
          className="flex items-center gap-2 text-sm text-[#64748b] hover:text-[#25D366] border border-[#2a2d3e] hover:border-[#25D366]/40 rounded-lg px-4 py-2.5 transition-colors w-fit"
        >
          {testing && <Loader2 size={13} className="animate-spin" />}
          {testing ? 'Verificando...' : 'Verificar conexión'}
        </button>
      )}

      {testResult && (
        <p className={`text-xs px-3 py-2 rounded-lg border ${
          testResult.ok
            ? 'text-[#25D366] bg-[#25D366]/10 border-[#25D366]/20'
            : 'text-red-400 bg-red-400/10 border-red-400/20'
        }`}>
          {testResult.msg}
        </p>
      )}

      {error && (
        <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 mt-2">
        <button
          onClick={onBack}
          className="flex-1 border border-[#2a2d3e] hover:border-[#64748b] text-[#64748b] hover:text-[#e2e8f0] font-medium text-sm py-2.5 rounded-lg transition-colors"
        >
          Atrás
        </button>
        <button
          onClick={onNext}
          disabled={!data.phoneNumberId || !data.waToken || loading}
          className="flex-1 bg-[#25D366] hover:bg-[#20c05a] disabled:opacity-50 text-black font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? 'Configurando...' : 'Configurar bot'}
        </button>
      </div>
    </div>
  )
}

// ── Paso 3: Elegir plan ───────────────────────────────────────────────────────
function Step3({ onNext, onBack }) {
  const [selected, setSelected] = useState('trial')

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-[#e2e8f0] mb-1">Elegí tu plan</h2>
        <p className="text-[#64748b] text-sm">Podés cambiar en cualquier momento.</p>
      </div>

      <div className="flex flex-col gap-3">
        {PLANS.map((plan) => (
          <button
            key={plan.name}
            type="button"
            onClick={() => setSelected(plan.name.toLowerCase())}
            className={`text-left p-4 rounded-xl border transition-all relative ${
              selected === plan.name.toLowerCase()
                ? 'border-[#25D366] bg-[#25D366]/8'
                : 'border-[#2a2d3e] hover:border-[#25D366]/30'
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-2.5 right-3 bg-[#25D366] text-black text-xs font-semibold px-2 py-0.5 rounded-full">
                {plan.badge}
              </span>
            )}
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-[#e2e8f0]">{plan.name}</span>
              <span className="text-[#e2e8f0] font-semibold">${plan.price}<span className="text-[#64748b] font-normal text-xs"> USD/mes</span></span>
            </div>
            <ul className="flex flex-col gap-1">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-[#64748b]">
                  <Check size={10} className="text-[#25D366] flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 border border-[#2a2d3e] hover:border-[#64748b] text-[#64748b] hover:text-[#e2e8f0] font-medium text-sm py-2.5 rounded-lg transition-colors"
        >
          Atrás
        </button>
        <button
          onClick={() => onNext(selected)}
          className="flex-1 bg-[#25D366] hover:bg-[#20c05a] text-black font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          Continuar con prueba gratuita (14 días)
        </button>
      </div>
    </div>
  )
}

// ── Paso 4: ¡Listo! ───────────────────────────────────────────────────────────
function Step4({ onFinish }) {
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-[#25D366]/15 border-2 border-[#25D366]/30 flex items-center justify-center animate-pulse">
          <div className="w-14 h-14 rounded-full bg-[#25D366]/20 border-2 border-[#25D366] flex items-center justify-center">
            <span className="text-3xl">🧉</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-[#e2e8f0] mb-2">¡Tu bot está activo!</h2>
        <p className="text-[#64748b] text-sm leading-relaxed max-w-xs mx-auto">
          MateBot ya está respondiendo mensajes en tu WhatsApp. Podés personalizar respuestas y configurar módulos desde el panel.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl p-4 text-left">
        {[
          '✅ Bot conectado a tu WhatsApp',
          '✅ Módulos básicos activados',
          '✅ 14 días de prueba gratis',
        ].map((item, i) => (
          <p key={i} className="text-sm text-[#e2e8f0]">{item}</p>
        ))}
      </div>

      <button
        onClick={onFinish}
        className="w-full bg-[#25D366] hover:bg-[#20c05a] text-black font-semibold text-base py-3 rounded-xl transition-colors"
      >
        Ir al panel →
      </button>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function Onboarding() {
  const navigate = useNavigate()
  const updateUser = useAuthStore((s) => s.updateUser)

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [businessData, setBusinessData] = useState({
    name: '',
    industry: '',
    ownerPhone: '',
    tone: 'friendly',
  })

  const [waData, setWaData] = useState({ phoneNumberId: '', waToken: '' })

  const handleBusinessChange = (key, value) => setBusinessData((d) => ({ ...d, [key]: value }))
  const handleWaChange = (key, value) => setWaData((d) => ({ ...d, [key]: value }))

  const handleStep2Next = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await setupAccount({
        ...businessData,
        phoneNumberId: waData.phoneNumberId,
        waToken: waData.waToken,
      })
      // Actualizar token y user en el store con el nuevo accountId
      useAuthStore.setState((s) => ({
        token: data.token,
        user: { ...s.user, accountId: data.accountId },
      }))
      updateUser({ accountId: data.accountId })
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al configurar la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center">
            <MessageCircle size={16} className="text-white" />
          </div>
          <span className="text-white font-semibold">MateBot</span>
        </div>

        <Stepper current={step} />

        <div className="bg-[#1e2030] border border-[#2a2d3e] rounded-2xl p-7">
          {step === 0 && (
            <Step1
              data={businessData}
              onChange={handleBusinessChange}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <Step2
              data={waData}
              onChange={handleWaChange}
              onNext={handleStep2Next}
              onBack={() => setStep(0)}
              loading={loading}
              error={error}
            />
          )}
          {step === 2 && (
            <Step3
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step4 onFinish={() => navigate('/', { replace: true })} />
          )}
        </div>
      </div>
    </div>
  )
}