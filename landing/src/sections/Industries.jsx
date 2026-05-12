import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

const industries = [
  {
    label: 'Clínicas',
    emoji: '🏥',
    messages: [
      { from: 'user', text: 'Necesito turno con la doctora' },
      { from: 'bot', text: 'Tenemos martes 10hs o jueves 15hs. ¿Cuál te queda mejor?' },
      { from: 'user', text: 'El jueves' },
      { from: 'bot', text: '✅ Confirmado: jueves 15hs con Dra. López. Recordatorio el miércoles.' },
    ],
    bullets: [
      'Agenda turnos automáticamente',
      'Manda recordatorios 24hs antes',
      'Historial de cada paciente',
    ],
  },
  {
    label: 'Verdulerías',
    emoji: '🥦',
    messages: [
      { from: 'user', text: '¿Tienen tomates cherry?' },
      { from: 'bot', text: 'Sí, $1.800 el kilo. ¿Te armo un pedido?' },
      { from: 'user', text: 'Sí, 1 kilo y medio de lechuga también' },
      { from: 'bot', text: 'Tomates $1.800 + Lechuga $900 = $2.700. ¿Retiro o envío?' },
    ],
    bullets: [
      'Catálogo con precios actualizados',
      'Pedidos por chat, sin llamadas',
      'Cierre de caja automático',
    ],
  },
  {
    label: 'Gimnasios',
    emoji: '🏋️',
    messages: [
      { from: 'user', text: '¿Cuánto sale la membresía?' },
      { from: 'bot', text: 'Full $12.000/mes (libre) o Básico $8.000/mes (3 días). ¿Empezás esta semana?' },
      { from: 'user', text: 'Sí el full' },
      { from: 'bot', text: '¡Genial! Te mando el link de pago por MercadoPago. 💪' },
    ],
    bullets: [
      'Planes y pagos automáticos',
      'Retención de socios que se van de baja',
      'Control de asistencia',
    ],
  },
  {
    label: 'Inmobiliarias',
    emoji: '🏠',
    messages: [
      { from: 'user', text: 'Vi el depto en Colón al 300' },
      { from: 'bot', text: '¡Hola! ¿Es para vivienda o inversión? ¿Contado o financiado?' },
      { from: 'user', text: 'Para vivir, tengo hipoteca' },
      { from: 'bot', text: 'Perfecto, te mando 3 opciones similares financiables en esa zona.' },
    ],
    bullets: [
      'Califica leads automáticamente',
      'Envía fichas de propiedades',
      'Agenda visitas sin intermediarios',
    ],
  },
  {
    label: 'Restaurantes',
    emoji: '🍕',
    messages: [
      { from: 'user', text: '¿A qué hora abren?' },
      { from: 'bot', text: 'Abrimos de 12 a 15hs y de 20hs a 23hs. ¿Querés reservar una mesa?' },
      { from: 'user', text: 'Sí, para 4 personas el viernes' },
      { from: 'bot', text: 'Mesa para 4 el viernes. ¿A las 20, 21 o 22hs?' },
    ],
    bullets: [
      'Responde consultas automáticamente',
      'Reservas de mesa por chat',
      'Programa de fidelidad integrado',
    ],
  },
]

function MiniChat({ messages }) {
  return (
    <div className="bg-[#0d0d0d] rounded-2xl border border-white/6 p-4 flex flex-col gap-3">
      {messages.map((msg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`flex ${msg.from === 'bot' ? 'justify-start' : 'justify-end'}`}
        >
          <div
            className={`max-w-[80%] px-3.5 py-2 rounded-xl text-sm leading-relaxed ${
              msg.from === 'bot'
                ? 'bg-[#1e1e1e] text-white rounded-bl-sm'
                : 'bg-[#25D366] text-black font-medium rounded-br-sm'
            }`}
          >
            {msg.text}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default function Industries() {
  const [active, setActive] = useState(0)
  const industry = industries[active]

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-[#25D366] text-sm font-medium tracking-widest uppercase mb-3">Por rubro</p>
          <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
            Hecho para tu tipo de negocio
          </h2>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {industries.map((ind, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                active === i
                  ? 'bg-[#25D366] text-black'
                  : 'bg-[#161616] border border-white/8 text-[#a0a0a0] hover:text-white hover:border-white/15'
              }`}
            >
              <span>{ind.emoji}</span>
              <span>{ind.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-2 gap-8 items-start bg-[#111111] border border-white/6 rounded-2xl p-8"
          >
            <div>
              <h3 className="text-white font-semibold text-xl mb-1">
                {industry.emoji} {industry.label}
              </h3>
              <p className="text-[#a0a0a0] text-sm mb-6">Conversación real con MateBot</p>
              <MiniChat messages={industry.messages} />
            </div>
            <div className="flex flex-col justify-center gap-4">
              <p className="text-[#a0a0a0] text-sm font-medium uppercase tracking-widest">Lo que hace el bot</p>
              {industry.bullets.map((b, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#25D366]/15 border border-[#25D366]/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={12} className="text-[#25D366]" />
                  </div>
                  <p className="text-white text-sm leading-relaxed">{b}</p>
                </div>
              ))}
              <a
                href="#precios"
                className="mt-4 bg-[#25D366] hover:bg-[#20c05a] text-black font-semibold text-sm px-6 py-3 rounded-xl transition-colors w-fit"
              >
                Probar para {industry.label.toLowerCase()} →
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}