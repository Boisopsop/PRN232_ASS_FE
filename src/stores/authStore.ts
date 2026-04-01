/**
 * Zustand store quản lý trạng thái đăng nhập (auth) cho CapReview.
 * Lưu JWT token + thông tin user (persist qua localStorage).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { User } from '@/types'

interface AuthState {
  currentUser: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      token: null,
      isAuthenticated: false,
      login: (user) => {
        set({ currentUser: user, isAuthenticated: true })
      },
      setToken: (token) => {
        set({ token })
      },
      logout: () => {
        set({ currentUser: null, token: null, isAuthenticated: false })
        if (typeof window !== 'undefined') window.location.assign('/login')
      },
      updateUser: (updates) => {
        set((state) => {
          if (!state.currentUser) return state
          return { currentUser: { ...state.currentUser, ...updates } }
        })
      },
    }),
    {
      name: 'capreview-auth',
      partialize: (state) => ({
        currentUser: state.currentUser,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

