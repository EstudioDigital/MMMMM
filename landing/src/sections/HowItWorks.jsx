import { motion } from 'framer-motion'
import { UserPlus, WhatsappLogo, Robot } from '@phosphor-icons/react'

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Registrá tu negocio',
    description: 'Creás tu cuenta, elegís tu industria y configurás el tono del bot en minutos.',
  },
  {
    number: '02',
    icon: WhatsappLogo,
    title: 'Conectás tu WhatsApp',
    description: 'Vinculás tu número de WhatsApp Business con un click. Sin apps adicionales.',
  },
  {
    number: '03',
    icon: Robot,
    title: 'El bot trabaja solo',
    description: 'Desde ese momento MateBot atiende, agenda y responde 24/7 sin que vos intervengas.',
  },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-[#25D366] text-sm font-medium tracking-widest uppercase mb-3">Proceso</p>
          <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
            Configurado en 15 minutos,<br />
            <span className="text-[#a0a0a0]">trabajando para siempre</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-14 left-[calc(33.33%+12px)] right-[calc(33.33%+12px)] h-px bg-gradient-to-r from-transparent via-[#25D366]/30 to-transparent" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative bg-[#161616] border border-white/6 rounded-2xl p-8 hover:border-[#25D366]/20 transition-colors group"
            >
              <div className="flex items-start gap-4 mb-5">
                <span className="text-5xl font-semibold text-white/5 leading-none select-none">
                  {step.number}
                </span>
                <div className="bg-[#25D366]/10 border border-[#25D366]/20 rounded-xl p-3 group-hover:bg-[#25D366]/15 transition-colors">
                  <step.icon size={22} className="text-[#25D366]" />
                </div>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-[#a0a0a0] text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}