export default function SocialProof() {
  const items = [
    { emoji: '🏥', label: 'Clínicas' },
    { emoji: '✂️', label: 'Peluquerías' },
    { emoji: '🥦', label: 'Verdulerías' },
    { emoji: '🏋️', label: 'Gimnasios' },
    { emoji: '🏠', label: 'Inmobiliarias' },
    { emoji: '🍕', label: 'Restaurantes' },
    { emoji: '💅', label: 'Estéticas' },
    { emoji: '🦷', label: 'Dentistas' },
  ]

  const doubled = [...items, ...items]

  return (
    <section className="py-14 border-y border-white/5 overflow-hidden">
      <p className="text-center text-[#a0a0a0] text-sm font-medium mb-8 tracking-wide uppercase">
        Funciona para todo tipo de negocios
      </p>
      <div className="relative">
        <div className="flex gap-6 animate-marquee whitespace-nowrap">
          {doubled.map((item, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-3 bg-[#161616] border border-white/6 rounded-xl px-5 py-3 flex-shrink-0"
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="text-white/80 font-medium text-sm">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}