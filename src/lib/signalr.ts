import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { useAuthStore } from '@/stores/authStore'

const baseURL = (import.meta.env.VITE_API_BASE_URL as string) || ''

export function createSlotHubConnection() {
  const hubUrl = baseURL ? `${baseURL}/hubs/slots` : '/hubs/slots'

  return new HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => useAuthStore.getState().token ?? '',
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build()
}

export { HubConnectionState }
