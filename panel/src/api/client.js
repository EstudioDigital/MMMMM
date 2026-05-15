import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const api = axios.create({ baseURL: `${API_URL}/api` })

// Inyectar Bearer token desde el store persistido
api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('matebot-auth')
    if (stored) {
      const { state } = JSON.parse(stored)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    }
  } catch {}
  return config
})

// Si el servidor devuelve 401, limpiar sesión y redirigir a login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('matebot-auth')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  },
)

export default api

// Accounts
export const getAccounts          = ()                => api.get('/accounts')
export const getAccount           = (id)              => api.get(`/accounts/${id}`)
export const updateAccount        = (id, data)        => api.put(`/accounts/${id}`, data)

// Stats & conversations
export const getStats             = (id)              => api.get(`/accounts/${id}/stats`)
export const getConversations     = (id)              => api.get(`/accounts/${id}/messages`)
export const getClientMessages    = (id, cid)         => api.get(`/accounts/${id}/clients/${cid}/messages`)

// Products
export const getProducts          = (id)              => api.get(`/accounts/${id}/products`)
export const createProduct        = (id, data)        => api.post(`/accounts/${id}/products`, data)
export const updateProduct        = (id, pid, data)   => api.put(`/accounts/${id}/products/${pid}`, data)
export const deleteProduct        = (id, pid)         => api.delete(`/accounts/${id}/products/${pid}`)

// Appointments
export const getAppointments      = (id)              => api.get(`/accounts/${id}/appointments`)
export const updateAppointment    = (id, aid, data)   => api.put(`/accounts/${id}/appointments/${aid}`, data)

// Rules
export const getRules             = (id)              => api.get(`/accounts/${id}/rules`)
export const createRule           = (id, data)        => api.post(`/accounts/${id}/rules`, data)
export const updateRule           = (id, rid, data)   => api.put(`/accounts/${id}/rules/${rid}`, data)
export const deleteRule           = (id, rid)         => api.delete(`/accounts/${id}/rules/${rid}`)

// Clients
export const getClients           = (id)              => api.get(`/accounts/${id}/clients`)

// Modules
export const getModules           = (id)              => api.get(`/accounts/${id}/modules`)
export const updateModule         = (id, type, data)  => api.put(`/accounts/${id}/modules/${type}`, data)

// Auth
export const setupAccount         = (data)            => api.post('/auth/setup-account', data)
export const verifyWhatsApp       = (id, data)        => api.post(`/accounts/${id}/verify-whatsapp`, data)