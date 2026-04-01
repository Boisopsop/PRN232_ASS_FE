/**
 * Hook CRUD Groups.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  getGroups,
  getGroupsBySemester,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupMembersByGroup,
  addGroupMember,
  removeGroupMember,
  getUserById,
} from '@/lib/api'
import type { Group, GroupMember, User } from '@/types'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Có lỗi xảy ra'
}

export function useGroups(semesterId?: number) {
  return useQuery({
    queryKey: ['groups', semesterId ?? 'all'],
    queryFn: () => (semesterId ? getGroupsBySemester(semesterId) : getGroups(500)),
  })
}

export function useGroupMembers(groupId: number) {
  return useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async (): Promise<(GroupMember & { student?: User })[]> => {
      const members = await getGroupMembersByGroup(groupId)
      const enriched = await Promise.all(
        members.map(async (m) => {
          try {
            const student = await getUserById(m.student_id)
            return { ...m, student }
          } catch {
            return { ...m, student: undefined }
          }
        }),
      )
      return enriched
    },
    enabled: groupId > 0,
  })
}

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Group, 'group_id' | 'created_at' | 'updated_at'>) => createGroup(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Tạo nhóm thành công')
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  })
}

export function useUpdateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { group_id: number; data: Partial<Group> }) =>
      updateGroup(vars.group_id, vars.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Cập nhật nhóm thành công')
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  })
}

export function useDeleteGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { group_id: number }) => deleteGroup(vars.group_id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Xóa nhóm thành công')
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  })
}

export function useAddGroupMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { groupId: number; studentId: number }) =>
      addGroupMember(vars.groupId, vars.studentId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['group-members'] })
      toast.success('Thêm thành viên thành công')
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  })
}

export function useRemoveGroupMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { memberId: number }) => removeGroupMember(vars.memberId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['group-members'] })
      toast.success('Xóa thành viên thành công')
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  })
}
