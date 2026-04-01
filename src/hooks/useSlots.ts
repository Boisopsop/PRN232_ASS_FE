/**
 * Custom hooks cho thao tác với slots (theo vòng phản biện).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { GroupSlotRegistration } from '@/types'
import { cancelGroupRegistration, getSlotsForRound, registerGroupSlot } from '@/lib/api'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Có lỗi xảy ra'
}

export function useSlotsForRound(round_id: number) {
  return useQuery({
    queryKey: ['slots', round_id],
    queryFn: () => getSlotsForRound(round_id),
    enabled: round_id > 0,
  })
}

export function useRegisterGroupSlot() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (vars: { group_id: number; slot_id: number; registered_by: number }) =>
      registerGroupSlot(vars.group_id, vars.slot_id, vars.registered_by),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['slots'] })
      toast.success('Đăng ký slot thành công')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useCancelGroupRegistration() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (vars: { registration_id: number }) => cancelGroupRegistration(vars.registration_id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['slots'] })
      toast.success('Đã hủy đăng ký thành công')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}

// Tránh lỗi lint: ép kiểu export mutation
export type { GroupSlotRegistration }

