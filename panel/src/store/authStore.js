import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/client.js'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      register: async (name, email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/register', { name, email, password })
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false })
          return data
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false })
          return data
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      logout: async () => {
        try { await api.post('/auth/logout') } catch {}
        set({ user: null, token: null, isAuthenticated: false })
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) return false
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data, isAuthenticated: true })
          return true
        } catch {
          set({ user: null, token: null, isAuthenticated: false })
          return false
        }
      },

      updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),
    }),
    {
      name: 'matebot-auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
    },
  ),
)