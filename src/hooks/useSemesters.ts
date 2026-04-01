/**
 * Hook CRUD Semester.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getSemesters, createSemester, updateSemester, deleteSemester } from '@/lib/api'
import type { Semester } from '@/types'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Có lỗi xảy ra'
}

export function useSemesters() {
  return useQuery({
    queryKey: ['semesters'],
    queryFn: () => getSemesters(100),
  })
}

export function useCreateSemester() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Semester, 'semester_id' | 'created_at'>) => createSemester(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['semesters'] })
      toast.success('Tạo học kỳ thành công')
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  })
}

export function useUpdateSemester() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { semester_id: number; data: Partial<Semester> }) =>
      updateSemester(vars.semester_id, vars.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['semesters'] })
      toast.success('Cập nhật học kỳ thành công')
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  })
}

export function useDeleteSemester() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { semester_id: number }) => deleteSemester(vars.semester_id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['semesters'] })
      toast.success('Xóa học kỳ thành công')
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  })
}
