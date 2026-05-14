import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Ghost, House } from '@phosphor-icons/react'

export default function NotFound() {
  useEffect(() => {
    document.title = '404 — MateBot'
  }, [])

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <Ghost size={64} weight="duotone" className="text-[#25D366] mx-auto mb-4 opacity-80" />
        <p className="text-8xl font-bold text-[#25D366] mb-4">404</p>
        <h1 className="text-2xl font-semibold text-[#e2e8f0] mb-2">Esta página no existe</h1>
        <p className="text-[#64748b] text-sm mb-8">
          La dirección que ingresaste no corresponde a ninguna sección del panel.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20c05a] text-black font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
        >
          <House size={15} />
          Volver al dashboard
        </Link>
      </div>
    </div>
  )
}