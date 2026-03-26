/**
 * Custom hooks cho thao tác reviewer và thống kê theo vòng.
 */
import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ReviewerSlotRegistration } from '@/types'
import {
  cancelReviewerRegistration,
  getReviewerConfig,
  getSlotsForRound,
  registerReviewerSlot,
} from '@/lib/mock/api'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Có lỗi xảy ra'
}

export function useRegisterReviewerSlot() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (vars: { reviewer_id: number; slot_id: number }): Promise<ReviewerSlotRegistration> =>
      registerReviewerSlot(vars.reviewer_id, vars.slot_id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['slots'] })
      toast.success('Đăng ký reviewer thành công')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useCancelReviewerRegistration() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (vars: { reviewer_registration_id: number }): Promise<void> =>
      cancelReviewerRegistration(vars.reviewer_registration_id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['slots'] })
      toast.success('Đã hủy đăng ký reviewer thành công')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error))
    },
  })
}

export function useReviewerStats(reviewer_id: number, round_id: number) {
  const configQuery = useQuery({
    queryKey: ['reviewer-config', round_id],
    queryFn: () => getReviewerConfig(round_id),
    enabled: round_id > 0,
  })

  const slotsQuery = useQuery({
    queryKey: ['slots', round_id],
    queryFn: () => getSlotsForRound(round_id),
    enabled: round_id > 0,
  })

  const registeredCount = useMemo(() => {
    const slots = slotsQuery.data
    if (!slots) return 0
    return slots.filter((slot) =>
      slot.registered_reviewers.some((u) => u.user_id === reviewer_id),
    ).length
  }, [slotsQuery.data, reviewer_id])

  const minRequired = configQuery.data?.min_slots ?? 0
  const maxAllowed = configQuery.data?.max_slots ?? 0

  return {
    registeredCount,
    minRequired,
    maxAllowed,
    isSufficient: registeredCount >= minRequired && minRequired > 0,
    isAtMax: registeredCount >= maxAllowed && maxAllowed > 0,
    isLoading: configQuery.isPending || slotsQuery.isPending,
  }
}

