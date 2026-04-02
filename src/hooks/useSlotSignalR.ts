import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createSlotHubConnection, HubConnectionState } from '@/lib/signalr'
import type { HubConnection } from '@microsoft/signalr'
import type { SlotWithDetails } from '@/types'

interface SlotStatusPayload {
  slotId: number
  roundId: number
  currentGroupCount: number
  maxGroups: number
  availabilityStatus: string
}

function mapAvailabilityToStatus(availability: string, slotStatus: string): string {
  if (availability === 'da het cho') return 'FULL'
  if (slotStatus === 'LOCKED') return 'LOCKED'
  if (slotStatus === 'CANCELLED') return 'CANCELLED'
  return 'OPEN'
}

/**
 * Hook kết nối SignalR hub `/hubs/slots`.
 * Tự động join group của round, lắng nghe `slotStatusChanged`,
 * và cập nhật trực tiếp query cache khi nhận event realtime.
 */
export function useSlotSignalR(roundId: number) {
  const qc = useQueryClient()
  const connectionRef = useRef<HubConnection | null>(null)

  useEffect(() => {
    if (roundId <= 0) return

    const connection = createSlotHubConnection()
    connectionRef.current = connection

    const groupName = `round-${roundId}`

    connection
      .start()
      .then(() => {
        console.log(`[SignalR] Connected, joining ${groupName}`)
        return connection.invoke('JoinRound', groupName)
      })
      .then(() => console.log(`[SignalR] Joined ${groupName}`))
      .catch((err) => console.error('[SignalR] Connection/join error:', err))

    connection.on('slotStatusChanged', (payload: SlotStatusPayload) => {
      console.log('[SignalR] slotStatusChanged received:', payload)
      const queryKey = ['slots', roundId]

      const currentData = qc.getQueryData<SlotWithDetails[]>(queryKey)
      if (currentData && payload?.slotId) {
        const updated = currentData.map((slot) => {
          if (slot.slot_id !== payload.slotId) return slot
          return {
            ...slot,
            current_group_count: payload.currentGroupCount,
            max_groups: payload.maxGroups,
            status: mapAvailabilityToStatus(payload.availabilityStatus, slot.status),
          } as SlotWithDetails
        })
        qc.setQueryData(queryKey, updated)
      } else {
        void qc.invalidateQueries({ queryKey })
      }
    })

    connection.onreconnected(() => {
      console.log(`[SignalR] Reconnected, re-joining ${groupName}`)
      void connection.invoke('JoinRound', groupName).catch(console.error)
    })

    connection.onclose((err) => {
      console.log('[SignalR] Connection closed', err ?? '')
    })

    return () => {
      if (connection.state === HubConnectionState.Connected) {
        connection
          .invoke('LeaveRound', groupName)
          .catch(console.error)
          .finally(() => connection.stop())
      } else {
        void connection.stop()
      }
      connectionRef.current = null
    }
  }, [roundId, qc])
}
