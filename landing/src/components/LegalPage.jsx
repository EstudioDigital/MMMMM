import { Link } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import Navbar from './Navbar'
import Footer from '../sections/Footer'

export default function LegalPage({ title, lastUpdated, children }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-24">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#a0a0a0] hover:text-white text-sm transition-colors mb-10 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Volver al inicio
        </Link>

        <h1 className="text-3xl md:text-4xl font-semibold text-white mb-2">{title}</h1>
        <p className="text-[#64748b] text-sm mb-10 pb-8 border-b border-white/5">
          Última actualización: {lastUpdated}
        </p>

        <div className="space-y-10">
          {children}
        </div>
      </div>
      <Footer />
    </div>
  )
}

export function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-white mb-3">{title}</h2>
      <div className="text-[#a0a0a0] text-sm leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  )
}

export function Bullet({ children }) {
  return (
    <li className="flex items-start gap-2">
      <span className="text-[#25D366] mt-0.5 flex-shrink-0">·</span>
      <span>{children}</span>
    </li>
  )
}