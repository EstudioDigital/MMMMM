import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layout } from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Catalog from './pages/Catalog.jsx'
import Appointments from './pages/Appointments.jsx'
import Rules from './pages/Rules.jsx'
import Clients from './pages/Clients.jsx'
import Settings from './pages/Settings.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Onboarding from './pages/Onboarding.jsx'
import NotFound from './pages/NotFound.jsx'
import { getAccount } from './api/client.js'
import { useStore } from './store.js'
import { useAuthStore } from './store/authStore.js'

function AccountLoader() {
  const setAccount = useStore((s) => s.setAccount)
  const user = useAuthStore((s) => s.user)

  const { data: account } = useQuery({
    queryKey: ['account', user?.accountId],
    queryFn: () => getAccount(user.accountId).then((r) => r.data),
    enabled: !!user?.accountId,
  })

  useEffect(() => {
    if (account) setAccount(account)
  }, [account, setAccount])

  return null
}

export default function App() {
  const hydrated = useAuthStore((s) => s._hasHydrated ?? true)

  if (!hydrated) return <LoadingScreen />

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot"   element={<ForgotPassword />} />

        {/* Rutas protegidas (requieren token) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<Layout />}>
            <Route index           element={<><AccountLoader /><Dashboard /></>} />
            <Route path="catalog"      element={<Catalog />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="rules"        element={<Rules />} />
            <Route path="clients"      element={<Clients />} />
            <Route path="settings"     element={<Settings />} />
          </Route>
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}