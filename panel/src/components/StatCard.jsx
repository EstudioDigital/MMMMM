const COLOR_MAP = {
  green:  { icon: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  blue:   { icon: 'text-blue-400',    bg: 'bg-blue-400/10'    },
  purple: { icon: 'text-purple-400',  bg: 'bg-purple-400/10'  },
  yellow: { icon: 'text-yellow-400',  bg: 'bg-yellow-400/10'  },
}

export function StatCard({ icon: Icon, label, value, color = 'green' }) {
  const c = COLOR_MAP[color] ?? COLOR_MAP.green
  return (
    <div className="bg-card border border-card-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">{label}</span>
        <div className={`p-2 rounded-md ${c.bg}`}>
          <Icon size={15} className={c.icon} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
    </div>
  )
}
