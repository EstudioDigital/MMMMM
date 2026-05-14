import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeSlash, SpinnerGap, Check } from '@phosphor-icons/react'
import logo from '../assets/logo.png'
import { useAuthStore } from '../store/authStore.js'

export default function Register() {
  useEffect(() => { document.title = 'Crear cuenta — MateBot' }, [])
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const isLoading = useAuthStore((s) => s.isLoading)

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [terms, setTerms] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      return setError('Las contraseñas no coinciden')
    }
    if (!terms) {
      return setError('Debés aceptar los términos y condiciones')
    }

    try {
      await register(form.name, form.email, form.password)
      navigate('/onboarding', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al crear la cuenta')
    }
  }

  const passwordOk = form.password.length >= 8

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="MateBot" className="w-16 h-16 object-contain mb-4" />
          <h1 className="text-xl font-semibold text-[#e2e8f0]">Crear cuenta gratis</h1>
          <p className="text-[#64748b] text-sm mt-1">14 días de prueba sin tarjeta</p>
        </div>

        {/* Card */}
        <div className="bg-[#1e2030] border border-[#2a2d3e] rounded-2xl p-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#e2e8f0]">Nombre del negocio</label>
              <input
                type="text"
                required
                placeholder="Ej: Peluquería El Rincón"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3.5 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#25D366] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#e2e8f0]">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3.5 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#25D366] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#e2e8f0]">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3.5 py-2.5 pr-10 text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#25D366] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#e2e8f0] transition-colors"
                >
                  {showPass ? <EyeSlash size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password && (
                <div className={`flex items-center gap-1.5 text-xs ${passwordOk ? 'text-[#25D366]' : 'text-[#64748b]'}`}>
                  {passwordOk && <Check size={11} />}
                  {passwordOk ? 'Contraseña válida' : `${8 - form.password.length} caracteres más`}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#e2e8f0]">Confirmar contraseña</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="Repetí tu contraseña"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className={`bg-[#0f1117] border rounded-lg px-3.5 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none transition-colors ${
                  form.confirm && form.confirm !== form.password
                    ? 'border-red-400/50 focus:border-red-400'
                    : 'border-[#2a2d3e] focus:border-[#25D366]'
                }`}
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div
                onClick={() => setTerms((v) => !v)}
                className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                  terms ? 'bg-[#25D366] border-[#25D366]' : 'border-[#2a2d3e] group-hover:border-[#25D366]'
                }`}
              >
                {terms && <Check size={10} className="text-black" />}
              </div>
              <span className="text-xs text-[#64748b] leading-relaxed">
                Acepto los{' '}
                <a href="#" className="text-[#25D366] hover:underline">términos y condiciones</a>
                {' '}y la{' '}
                <a href="#" className="text-[#25D366] hover:underline">política de privacidad</a>
              </span>
            </label>

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#25D366] hover:bg-[#20c05a] disabled:opacity-60 text-black font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {isLoading && <SpinnerGap size={15} weight="bold" className="animate-spin" />}
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-sm text-[#64748b]">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-[#25D366] hover:underline font-medium">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}