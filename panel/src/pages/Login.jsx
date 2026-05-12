import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, MessageCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore.js'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = await login(form.email, form.password)
      if (data.user.accountId) {
        navigate('/', { replace: true })
      } else {
        navigate('/onboarding', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#25D366] flex items-center justify-center mb-4">
            <MessageCircle size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-[#e2e8f0]">MateBot</h1>
          <p className="text-[#64748b] text-sm mt-1">Iniciá sesión en tu panel</p>
        </div>

        {/* Card */}
        <div className="bg-[#1e2030] border border-[#2a2d3e] rounded-2xl p-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3.5 py-2.5 pr-10 text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#25D366] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#e2e8f0] transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

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
              {isLoading && <Loader2 size={15} className="animate-spin" />}
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center mt-4">
            <Link
              to="/forgot"
              className="text-xs text-[#64748b] hover:text-[#25D366] transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </div>

        <p className="text-center mt-5 text-sm text-[#64748b]">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-[#25D366] hover:underline font-medium">
            Registrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}