import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Loader2, ArrowLeft, Mail } from 'lucide-react'
import api from '../api/client.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot', { email })
      setSent(true)
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#25D366] flex items-center justify-center mb-4">
            <MessageCircle size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-[#e2e8f0]">Recuperar contraseña</h1>
          <p className="text-[#64748b] text-sm mt-1 text-center">
            Te mandamos instrucciones a tu email
          </p>
        </div>

        <div className="bg-[#1e2030] border border-[#2a2d3e] rounded-2xl p-7">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#25D366]/15 border border-[#25D366]/25 flex items-center justify-center">
                <Mail size={22} className="text-[#25D366]" />
              </div>
              <div>
                <p className="text-[#e2e8f0] font-medium">¡Listo!</p>
                <p className="text-[#64748b] text-sm mt-1">
                  Si {email} tiene una cuenta, recibirás un email con instrucciones.
                </p>
              </div>
              <Link
                to="/login"
                className="text-sm text-[#25D366] hover:underline flex items-center gap-1.5"
              >
                <ArrowLeft size={14} />
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#e2e8f0]">Email de tu cuenta</label>
                <input
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3.5 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#25D366] transition-colors"
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="bg-[#25D366] hover:bg-[#20c05a] disabled:opacity-60 text-black font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? 'Enviando...' : 'Enviar instrucciones'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-5">
          <Link
            to="/login"
            className="text-sm text-[#64748b] hover:text-[#e2e8f0] flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={14} />
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  )
}