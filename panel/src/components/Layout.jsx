import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Package, Calendar, Zap, Users, Settings, MessageCircle,
} from 'lucide-react'
import { useStore } from '../store.js'

const NAV = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/catalog',      icon: Package,         label: 'Catálogo'      },
  { to: '/appointments', icon: Calendar,        label: 'Turnos'        },
  { to: '/rules',        icon: Zap,             label: 'Reglas'        },
  { to: '/clients',      icon: Users,           label: 'Clientes'      },
  { to: '/settings',     icon: Settings,        label: 'Configuración' },
]

export function Layout() {
  const account = useStore((s) => s.account)

  return (
    <div className="flex h-screen bg-app-bg text-text-primary overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-sidebar border-r border-card-border flex flex-col">
        {/* Logo */}
        <div className="h-14 px-5 flex items-center gap-2.5 border-b border-card-border">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <MessageCircle size={14} className="text-white" />
          </div>
          <span className="font-semibold text-text-primary text-sm">MateBot</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-card'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Account pill */}
        <div className="p-3 border-t border-card-border">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
            <p className="text-xs text-text-primary font-medium truncate">
              {account?.name ?? 'Cargando...'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-card-border flex items-center px-6 flex-shrink-0">
          <p className="text-sm text-text-secondary">
            {account?.name ?? ''} &nbsp;·&nbsp; Panel de administración
          </p>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
