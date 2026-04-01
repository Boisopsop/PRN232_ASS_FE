/**
 * Hook lấy danh sách đăng ký slot của nhóm.
 */
import { useQuery } from '@tanstack/react-query'

import { getGroupRegistrations } from '@/lib/api'

export function useGroupRegistrations(groupId: number) {
  return useQuery({
    queryKey: ['group-registrations', groupId],
    queryFn: () => getGroupRegistrations(groupId),
    enabled: groupId > 0,
  })
}
