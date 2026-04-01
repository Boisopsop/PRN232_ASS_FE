/**
 * Hook lấy danh sách user, có thể lọc theo role.
 */
import { useQuery } from '@tanstack/react-query'

import { getUsers } from '@/lib/api'
import type { User, UserRole } from '@/types'

export function useAllUsers(role?: UserRole) {
  return useQuery({
    queryKey: ['users', role ?? 'all'],
    queryFn: async (): Promise<User[]> => {
      const users = await getUsers(500)
      if (role) return users.filter((u) => u.role === role)
      return users
    },
  })
}
