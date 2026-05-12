import { motion } from 'framer-motion'

export default function CtaBanner() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#128C7E] to-[#075E54] p-12 md:p-16 text-center"
        >
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight mb-4">
              Empezá hoy. Tu negocio no puede esperar.
            </h2>
            <p className="text-white/75 text-lg mb-10">
              Configuración en 15 minutos. Sin tarjeta de crédito.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 bg-white hover:bg-white/90 text-black font-semibold text-base px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-2xl"
            >
              Crear mi cuenta gratis →
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}