import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layout } from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Catalog from './pages/Catalog.jsx'
import Appointments from './pages/Appointments.jsx'
import Rules from './pages/Rules.jsx'
import Clients from './pages/Clients.jsx'
import Settings from './pages/Settings.jsx'
import { getAccounts } from './api/client.js'
import { useStore } from './store.js'

export default function App() {
  const setAccount = useStore((s) => s.setAccount)

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => getAccounts().then((r) => r.data),
  })

  useEffect(() => {
    if (accounts?.length) setAccount(accounts[0])
  }, [accounts, setAccount])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="rules" element={<Rules />} />
          <Route path="clients" element={<Clients />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
