/**
 * Hook tìm nhóm của sinh viên hiện tại.
 */
import { useQuery } from '@tanstack/react-query'

import { getGroupMemberByStudent, getGroupById, getUserById } from '@/lib/api'
import type { Group, User } from '@/types'

export function useStudentGroup(userId: number) {
  return useQuery({
    queryKey: ['student-group', userId],
    queryFn: async (): Promise<{ group: Group; gvhd: User | null } | null> => {
      const membership = await getGroupMemberByStudent(userId)
      if (!membership) return null
      const group = await getGroupById(membership.group_id)
      let gvhd: User | null = null
      try {
        gvhd = await getUserById(group.gvhd_id)
      } catch {
        // GVHD user may not exist yet
      }
      return { group, gvhd }
    },
    enabled: userId > 0,
    retry: false,
  })
}
