import { motion } from 'framer-motion'
import { Calendar, ShoppingCart, DollarSign, Bot, Star, BarChart2 } from 'lucide-react'

const modules = [
  {
    icon: Calendar,
    title: 'Turnos automáticos',
    description: 'Agenda, confirma y recuerda turnos sin que vos intervengas. Tus clientes eligen horario por chat.',
  },
  {
    icon: ShoppingCart,
    title: 'Catálogo y pedidos',
    description: 'Tus clientes ven precios y hacen pedidos directo por chat. Sin llamadas, sin confusión.',
  },
  {
    icon: DollarSign,
    title: 'Control de finanzas',
    description: 'Registrá ventas y gastos hablándole al bot. Resumen semanal automático cada lunes.',
  },
  {
    icon: Bot,
    title: 'IA conversacional',
    description: 'Responde preguntas no previstas con inteligencia artificial entrenada para tu negocio.',
  },
  {
    icon: Star,
    title: 'Fidelización',
    description: 'Sistema de puntos, cupones de cumpleaños y reactivación automática de clientes inactivos.',
  },
  {
    icon: BarChart2,
    title: 'Reportes automáticos',
    description: 'Recibís un resumen completo de tu negocio todos los lunes a las 8am en tu WhatsApp.',
  },
]

export default function Modules() {
  return (
    <section id="modulos" className="py-24 px-6 bg-[#111111]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-[#25D366] text-sm font-medium tracking-widest uppercase mb-3">Módulos</p>
          <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight">
            Un bot que hace de todo
          </h2>
          <p className="text-[#a0a0a0] mt-4 max-w-xl mx-auto">
            Cada módulo trabaja en conjunto. Cuantos más usás, más poderoso se vuelve tu negocio.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((mod, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              whileHover={{ y: -4 }}
              className="group bg-[#161616] border border-white/6 rounded-2xl p-6 cursor-default hover:border-[#25D366]/25 hover:shadow-xl hover:shadow-[#25D366]/5 transition-all duration-300"
            >
              <div className="bg-[#25D366]/10 border border-[#25D366]/15 rounded-xl w-12 h-12 flex items-center justify-center mb-5 group-hover:bg-[#25D366]/20 transition-colors">
                <mod.icon size={22} className="text-[#25D366]" />
              </div>
              <h3 className="text-white font-semibold text-base mb-2">{mod.title}</h3>
              <p className="text-[#a0a0a0] text-sm leading-relaxed">{mod.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}