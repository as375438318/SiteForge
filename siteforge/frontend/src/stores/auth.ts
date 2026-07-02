import { create } from 'zustand'

interface AuthState {
  token: string | null
  isAuthenticated: boolean
  user: { username?: string } | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => boolean
}

interface LoginResponse {
  accessToken?: string
  access_token?: string
  token?: string
  username?: string
  user?: { username?: string }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('sf-token'),
  isAuthenticated: !!localStorage.getItem('sf-token'),
  user: null,
  login: async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) return false
      const data: LoginResponse = await res.json()
      const token = data.accessToken || data.access_token || data.token
      if (!token) return false
      localStorage.setItem('sf-token', token)
      const user = data.user || { username: data.username || username }
      set({ token, isAuthenticated: true, user })
      return true
    } catch {
      return false
    }
  },
  logout: () => {
    localStorage.removeItem('sf-token')
    set({ token: null, isAuthenticated: false, user: null })
  },
  checkAuth: () => !!localStorage.getItem('sf-token'),
}))
