/**
 * Zustand store quản lý trạng thái đăng nhập (auth) cho CapReview.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { User } from '@/types'

interface AuthState {
  currentUser: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      login: (user) => {
        set({ currentUser: user, isAuthenticated: true })
      },
      logout: () => {
        set({ currentUser: null, isAuthenticated: false })
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
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

