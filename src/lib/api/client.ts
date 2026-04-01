/**
 * Axios instance cấu hình sẵn JWT auth interceptor cho CapReview API.
 */
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const baseURL = (import.meta.env.VITE_API_BASE_URL as string) || ''

export const apiClient = axios.create({
  baseURL: baseURL ? `${baseURL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Tự động gắn JWT token vào header mỗi request
apiClient.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Helper: trích validation errors từ .NET ProblemDetails format
function extractValidationErrors(data: Record<string, unknown>): string | null {
  if (data?.errors && typeof data.errors === 'object') {
    const messages: string[] = []
    for (const [, fieldErrors] of Object.entries(data.errors as Record<string, string[]>)) {
      if (Array.isArray(fieldErrors)) {
        messages.push(...fieldErrors)
      }
    }
    if (messages.length > 0) return messages.join('; ')
  }
  return null
}

// Xử lý lỗi response: 401 → logout, map lỗi thành Error message
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isAxiosError(error)) {
      const isLoginRequest = error.config?.url?.includes('/Auth/login')
      if (error.response?.status === 401 && !isLoginRequest) {
        useAuthStore.getState().logout()
      }
      const data = error.response?.data as Record<string, unknown> | undefined
      const msg =
        extractValidationErrors(data ?? {}) ||
        data?.message ||
        data?.error ||
        data?.title ||
        error.message ||
        'Có lỗi xảy ra'
      return Promise.reject(new Error(String(msg)))
    }
    return Promise.reject(error)
  },
)
