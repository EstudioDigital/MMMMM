import { useState, useEffect } from 'react'
import { List, X } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../assets/logo.png'

const PANEL_URL = import.meta.env.VITE_PANEL_URL || 'http://localhost:5173'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = [
    { label: 'Cómo funciona', href: '#como-funciona' },
    { label: 'Módulos', href: '#modulos' },
    { label: 'Precios', href: '#precios' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 text-white font-semibold text-lg">
          <motion.img
            src={logo}
            alt="MateBot"
            className="w-8 h-8 md:w-10 md:h-10 object-contain"
            animate={{ y: [0, -4, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span>MateBot</span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="text-[#a0a0a0] hover:text-white transition-colors text-sm font-medium"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a
            href={`${PANEL_URL}/register`}
            className="bg-[#25D366] hover:bg-[#20c05a] text-black font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            Empezar gratis
          </a>
        </div>

        <button
          className="md:hidden text-white p-1"
          onClick={() => setMobileOpen(v => !v)}
        >
          {mobileOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#111111] border-t border-white/5 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {links.map(l => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-[#a0a0a0] hover:text-white transition-colors text-sm font-medium py-1"
                >
                  {l.label}
                </a>
              ))}
              <a
                href="#precios"
                onClick={() => setMobileOpen(false)}
                className="bg-[#25D366] hover:bg-[#20c05a] text-black font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors text-center mt-2"
              >
                Empezar gratis
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
