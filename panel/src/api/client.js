import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Accounts
export const getAccounts          = ()           => api.get('/accounts')
export const getAccount           = (id)         => api.get(`/accounts/${id}`)
export const updateAccount        = (id, data)   => api.put(`/accounts/${id}`, data)

// Stats & conversations
export const getStats             = (id)         => api.get(`/accounts/${id}/stats`)
export const getConversations     = (id)         => api.get(`/accounts/${id}/messages`)
export const getClientMessages    = (id, cid)    => api.get(`/accounts/${id}/clients/${cid}/messages`)

// Products
export const getProducts          = (id)         => api.get(`/accounts/${id}/products`)
export const createProduct        = (id, data)   => api.post(`/accounts/${id}/products`, data)
export const updateProduct        = (id, pid, data) => api.put(`/accounts/${id}/products/${pid}`, data)
export const deleteProduct        = (id, pid)    => api.delete(`/accounts/${id}/products/${pid}`)

// Appointments
export const getAppointments      = (id)         => api.get(`/accounts/${id}/appointments`)
export const updateAppointment    = (id, aid, data) => api.put(`/accounts/${id}/appointments/${aid}`, data)

// Rules
export const getRules             = (id)         => api.get(`/accounts/${id}/rules`)
export const createRule           = (id, data)   => api.post(`/accounts/${id}/rules`, data)
export const updateRule           = (id, rid, data) => api.put(`/accounts/${id}/rules/${rid}`, data)
export const deleteRule           = (id, rid)    => api.delete(`/accounts/${id}/rules/${rid}`)

// Clients
export const getClients           = (id)         => api.get(`/accounts/${id}/clients`)

// Modules
export const getModules           = (id)         => api.get(`/accounts/${id}/modules`)
export const updateModule         = (id, type, data) => api.put(`/accounts/${id}/modules/${type}`, data)
