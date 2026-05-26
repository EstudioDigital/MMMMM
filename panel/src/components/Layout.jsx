import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { House, Package, CalendarCheck, Lightning, Users, Gear, SignOut, List, X, FilePdf } from '@phosphor-icons/react'
import { useStore } from '../store.js'
import { useAuthStore } from '../store/authStore.js'
import logo from '../assets/logo.png'

const NAV = [
  { to: '/',             icon: House,         label: 'Dashboard'     },
  { to: '/catalog',      icon: Package,       label: 'Catálogo'      },
  { to: '/appointments', icon: CalendarCheck, label: 'Turnos'        },
  { to: '/rules',        icon: Lightning,     label: 'Reglas'        },
  { to: '/clients',      icon: Users,         label: 'Clientes'      },
  { to: '/reports',      icon: FilePdf,       label: 'Reportes',     pro: true },
  { to: '/settings',     icon: Gear,          label: 'Configuración' },
]

const PLAN_COLORS = {
  trial:    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  starter:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  pro:      'bg-accent/20 text-accent border-accent/30',
  business: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

const PLAN_LABELS = {
  trial:    'Prueba gratuita',
  starter:  'Plan Starter',
  pro:      'Plan Pro',
  business: 'Plan Business',
}

function SidebarContent({ onLinkClick }) {
  const account = useStore((s) => s.account)
  const { user, logout } = useAuthStore()
  const plan = user?.plan || 'trial'

  const trialDaysLeft =
    user?.plan === 'trial' && user?.trialEndsAt
      ? Math.max(0, Math.ceil((new Date(user.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)))
      : null

  const handleLogout = () => {
    if (window.confirm('¿Seguro que querés cerrar sesión?')) {
      logout()
    }
  }

  return (
    <>
      {/* Logo */}
      <div className="h-14 px-5 flex items-center gap-2.5 border-b border-card-border flex-shrink-0">
        <img src={logo} alt="MateBot" className="w-8 h-8 object-contain flex-shrink-0 animate-mate-walk" />
        <span className="font-semibold text-text-primary text-sm">MateBot</span>
      </div>

      {/* Plan badge */}
      <div className="px-4 pt-3 pb-1 flex-shrink-0">
        <div className={`text-xs px-2 py-1 rounded-md border ${PLAN_COLORS[plan]} text-center`}>
          {PLAN_LABELS[plan]}
        </div>
        {trialDaysLeft !== null && (
          <p className="text-xs text-text-secondary text-center mt-1">
            {trialDaysLeft} días restantes
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, pro }) => {
          const locked = pro && !['pro', 'business'].includes(plan)
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onLinkClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-card'
                }`
              }
            >
              <Icon size={16} weight="duotone" />
              <span className="flex-1">{label}</span>
              {locked && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/25">
                  Pro
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-card-border p-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <span className="text-accent text-xs font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text-primary text-xs font-medium truncate">{user?.name || 'Mi negocio'}</p>
            <p className="text-text-secondary text-xs truncate">{user?.email || ''}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-sm text-text-secondary
                     hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all
                     duration-200 w-full group"
        >
          <SignOut size={16} weight="regular" className="flex-shrink-0 group-hover:text-red-400 transition-colors" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </>
  )
}

export function Layout() {
  const account = useStore((s) => s.account)
  const { logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    if (window.confirm('¿Seguro que querés cerrar sesión?')) {
      logout()
    }
  }

  return (
    <div className="flex h-screen bg-app-bg text-text-primary overflow-hidden">
      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-sidebar border-r border-card-border flex flex-col">
            <div className="absolute right-3 top-3 z-10">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-text-secondary hover:text-text-primary rounded-md"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 bg-sidebar border-r border-card-border flex-col">
        <SidebarContent onLinkClick={undefined} />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 bg-sidebar border-b border-card-border flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-md transition-colors"
          >
            <List size={22} />
          </button>
          <img src={logo} alt="MateBot" className="w-8 h-8 object-contain animate-mate-walk" />
          <button
            onClick={handleLogout}
            className="p-2 -mr-2 text-text-secondary hover:text-red-400 rounded-md transition-colors"
            title="Cerrar sesión"
          >
            <SignOut size={18} />
          </button>
        </div>

        {/* Desktop header */}
        <header className="hidden lg:flex h-14 border-b border-card-border items-center justify-between px-6 flex-shrink-0">
          <p className="text-sm text-text-secondary">
            {account?.name ?? ''} &nbsp;·&nbsp; Panel de administración
          </p>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary
                       hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all duration-200 group"
          >
            <SignOut size={14} weight="regular" className="group-hover:text-red-400 transition-colors" />
            <span>Cerrar sesión</span>
          </button>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}