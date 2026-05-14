import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle } from '@phosphor-icons/react'

const plans = [
  {
    name: 'Starter',
    monthly: 19,
    annual: 15,
    badge: null,
    features: [
      '1 número de WhatsApp',
      'Respuestas automáticas ilimitadas',
      'Módulo de turnos',
      'Historial 30 días',
      'Soporte por email',
    ],
  },
  {
    name: 'Pro',
    monthly: 39,
    annual: 32,
    badge: 'Más elegido',
    features: [
      '3 números de WhatsApp',
      'Todo de Starter +',
      'Catálogo y pedidos',
      'Control de finanzas',
      'Reportes semanales',
      'IA conversacional',
      'Soporte prioritario',
    ],
  },
  {
    name: 'Business',
    monthly: 79,
    annual: 65,
    badge: null,
    features: [
      '10 números de WhatsApp',
      'Todo de Pro +',
      'Fidelización y campañas',
      'Integraciones externas',
      'Onboarding personalizado',
      'Soporte 24/7',
    ],
  },
]

const PANEL_URL = import.meta.env.VITE_PANEL_URL || 'http://localhost:5173'

export default function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <section id="precios" className="py-24 px-6 bg-[#111111]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-[#25D366] text-sm font-medium tracking-widest uppercase mb-3">Precios</p>
          <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight mb-4">
            Sin contratos. Sin letra chica.
          </h2>
          <p className="text-[#a0a0a0] mb-8">Cancelás cuando quieras. Sin permanencia.</p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-[#161616] border border-white/8 rounded-xl p-1.5">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !annual ? 'bg-white text-black' : 'text-[#a0a0a0] hover:text-white'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                annual ? 'bg-white text-black' : 'text-[#a0a0a0] hover:text-white'
              }`}
            >
              Anual
              <span className="bg-[#25D366] text-black text-xs font-semibold px-1.5 py-0.5 rounded-md">
                -2 meses
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 items-start">
          {plans.map((plan, i) => {
            const isPro = plan.badge === 'Más elegido'
            const price = annual ? plan.annual : plan.monthly
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`relative rounded-2xl p-7 flex flex-col gap-6 ${
                  isPro
                    ? 'bg-[#161616] border border-[#25D366]/40 shadow-xl shadow-[#25D366]/8 md:scale-105'
                    : 'bg-[#161616] border border-white/6'
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#25D366] text-black text-xs font-semibold px-3 py-1 rounded-full">
                      ⭐ {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  <p className="text-[#a0a0a0] text-sm font-medium mb-3">{plan.name}</p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-4xl font-semibold text-white">${price}</span>
                    <span className="text-[#a0a0a0] text-sm mb-1.5">USD/mes</span>
                  </div>
                  {annual && (
                    <p className="text-[#25D366] text-xs mt-1">
                      Antes ${plan.monthly} — ahorrás ${(plan.monthly - plan.annual) * 12} al año
                    </p>
                  )}
                </div>

                <ul className="flex flex-col gap-3">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <CheckCircle size={14} weight="fill" color="#25D366" className="flex-shrink-0 mt-0.5" />
                      <span className="text-[#a0a0a0] text-sm">{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={`${PANEL_URL}/register`}
                  className={`w-full text-center py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 mt-auto ${
                    isPro
                      ? 'bg-[#25D366] hover:bg-[#20c05a] text-black hover:shadow-lg hover:shadow-[#25D366]/25'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  }`}
                >
                  Empezar ahora
                </a>
              </motion.div>
            )
          })}
        </div>

        <p className="text-center text-[#a0a0a0] text-sm mt-8">
          ¿Tenés más de 10 números? <a href="mailto:NuestroEstudioDigital@gmail.com" className="text-[#25D366] hover:underline">Hablá con nosotros</a> para un plan a medida.
        </p>
      </div>
    </section>
  )
}