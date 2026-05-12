import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const testimonials = [
  {
    initials: 'AG',
    color: '#25D366',
    name: 'Dra. Ana García',
    business: 'Clínica Estética',
    text: 'Antes tardaba 2 horas al día respondiendo WhatsApp. Ahora MateBot lo hace solo y yo me concentro en atender a los pacientes.',
  },
  {
    initials: 'PR',
    color: '#128C7E',
    name: 'Pedro Ramírez',
    business: 'Verdulería El Trébol',
    text: 'Mis clientes hacen pedidos a las 11pm y al otro día los tengo listos. Vendí un 30% más desde que lo uso.',
  },
  {
    initials: 'LF',
    color: '#075E54',
    name: 'Lucas Fernández',
    business: 'Gimnasio PowerFit',
    text: 'Los socios que se iban de baja ahora reciben un mensaje automático y muchos renuevan. Vale cada peso.',
  },
]

export default function Testimonials() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-[#25D366] text-sm font-medium tracking-widest uppercase mb-3">Testimonios</p>
          <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
            Negocios que ya usan MateBot
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-[#161616] border border-white/6 rounded-2xl p-7 flex flex-col gap-5 hover:border-white/10 transition-colors"
            >
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={14} className="text-[#25D366] fill-[#25D366]" />
                ))}
              </div>

              <p className="text-[#a0a0a0] text-sm leading-relaxed flex-1">
                "{t.text}"
              </p>

              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                  style={{ backgroundColor: t.color }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{t.name}</p>
                  <p className="text-[#a0a0a0] text-xs">{t.business}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}