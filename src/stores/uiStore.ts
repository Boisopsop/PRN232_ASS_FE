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

export const useUiStore = create<UiState>()((set) => ({
  sidebarOpen: false,
  activeRoundId: 0,
  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),
  setSidebarOpen: (val) => set({ sidebarOpen: val }),
  setActiveRoundId: (id) => set({ activeRoundId: id }),
}))

