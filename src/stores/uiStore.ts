/**
 * Zustand store quản lý trạng thái UI cho CapReview (sidebar + active round).
 */
import { create } from 'zustand'

interface UiState {
  sidebarOpen: boolean
  activeRoundId: number
  toggleSidebar: () => void
  setSidebarOpen: (val: boolean) => void
  setActiveRoundId: (id: number) => void
}

const getDefaultSidebarOpen = (): boolean => {
  if (typeof window === 'undefined') return true
  return window.innerWidth >= 768
}

export const useUiStore = create<UiState>()((set) => ({
  sidebarOpen: getDefaultSidebarOpen(),
  activeRoundId: 1,
  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),
  setSidebarOpen: (val) => set({ sidebarOpen: val }),
  setActiveRoundId: (id) => set({ activeRoundId: id }),
}))

