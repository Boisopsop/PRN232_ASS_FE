/**
 * Custom hooks cho quản lý vòng phản biện (rounds).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ReviewRound } from '@/types'
import {
  createRound,
  deleteRound,
  getRoundsForSemester,
  updateRound,
} from '@/lib/mock/api'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Có lỗi xảy ra'
}

export function useRounds(semester_id: number) {
  return useQuery({
    queryKey: ['rounds', semester_id],
    queryFn: () => getRoundsForSemester(semester_id),
  })
}

export function useCreateRound() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<ReviewRound, 'round_id'>) => createRound(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['rounds'] })
      toast.success('Tạo vòng phản biện thành công')
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  })
}

export function useUpdateRound() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (vars: { round_id: number; data: Partial<ReviewRound> }) =>
      updateRound(vars.round_id, vars.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['rounds'] })
      toast.success('Cập nhật vòng phản biện thành công')
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  })
}

export function useDeleteRound() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (vars: { round_id: number }) => deleteRound(vars.round_id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['rounds'] })
      toast.success('Xóa vòng phản biện thành công')
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  })
}

