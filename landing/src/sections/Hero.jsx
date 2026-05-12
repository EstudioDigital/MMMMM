import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const messages = [
  { from: 'user', text: 'Hola, quiero sacar un turno' },
  { from: 'bot', text: '¡Hola! Tenemos estos turnos disponibles:\n📅 Martes 10hs\n📅 Miércoles 14hs\n📅 Jueves 15hs' },
  { from: 'user', text: 'El martes a las 10' },
  { from: 'bot', text: '✅ Turno confirmado para el martes a las 10hs. Te mando recordatorio el lunes.' },
]

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-[#1e1e1e] rounded-2xl rounded-bl-sm w-fit">
      <span className="typing-dot w-2 h-2 bg-[#a0a0a0] rounded-full inline-block" />
      <span className="typing-dot w-2 h-2 bg-[#a0a0a0] rounded-full inline-block" />
      <span className="typing-dot w-2 h-2 bg-[#a0a0a0] rounded-full inline-block" />
    </div>
  )
}

function ChatMessage({ msg }) {
  const isBot = msg.from === 'bot'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
          isBot
            ? 'bg-[#1e1e1e] text-white rounded-bl-sm'
            : 'bg-[#25D366] text-black font-medium rounded-br-sm'
        }`}
      >
        {msg.text}
      </div>
    </motion.div>
  )
}

function ChatMockup() {
  const [visible, setVisible] = useState([])
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    let idx = 0
    function next() {
      if (idx >= messages.length) return
      const msg = messages[idx]
      if (msg.from === 'bot') {
        setTyping(true)
        setTimeout(() => {
          setTyping(false)
          setVisible(v => [...v, msg])
          idx++
          setTimeout(next, 900)
        }, 1200)
      } else {
        setVisible(v => [...v, msg])
        idx++
        setTimeout(next, 700)
      }
    }
    const t = setTimeout(next, 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Phone frame */}
      <div className="bg-[#111111] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        {/* WhatsApp header */}
        <div className="bg-[#128C7E] px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-black font-bold text-sm">
            M
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">MateBot</p>
            <p className="text-white/70 text-xs mt-0.5">En línea</p>
          </div>
        </div>
        {/* Messages */}
        <div className="bg-[#0d0d0d] px-4 py-4 min-h-[260px] flex flex-col gap-3">
          <AnimatePresence>
            {visible.map((msg, i) => (
              <ChatMessage key={i} msg={msg} />
            ))}
            {typing && (
              <motion.div
                key="typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* Glow */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#25D366]/20 blur-3xl rounded-full pointer-events-none" />
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#25D366 1px, transparent 1px), linear-gradient(90deg, #25D366 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#25D366]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center w-full">
        {/* Left: copy */}
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 text-sm font-medium text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/20 rounded-full px-4 py-1.5">
              🧉 El socio digital de tu negocio
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl font-semibold text-white leading-[1.1] tracking-tight"
          >
            Tu negocio,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] to-[#128C7E]">
              atendido las 24 horas.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[#a0a0a0] text-lg leading-relaxed max-w-lg"
          >
            MateBot automatiza tu WhatsApp. Atiende clientes, agenda turnos, gestiona pedidos y lleva las cuentas — sin que vos hagas nada.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-3 pt-2"
          >
            <a
              href="http://localhost:5173/register"
              className="bg-[#25D366] hover:bg-[#20c05a] text-black font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#25D366]/25"
            >
              Empezar gratis
            </a>
            <a
              href="#como-funciona"
              className="border border-white/15 hover:border-white/30 text-white font-medium px-7 py-3.5 rounded-xl transition-colors"
            >
              Ver demo
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center gap-6 pt-2"
          >
            {[
              { value: '500+', label: 'negocios activos' },
              { value: '24/7', label: 'sin interrupciones' },
              { value: '15min', label: 'para configurar' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-white font-semibold text-xl">{stat.value}</p>
                <p className="text-[#a0a0a0] text-xs">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: chat mockup */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <ChatMockup />
        </motion.div>
      </div>
    </section>
  )
}