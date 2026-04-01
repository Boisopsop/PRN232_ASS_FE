/**
 * Hook lấy học kỳ đang active.
 */
import { useQuery } from '@tanstack/react-query'

import { getActiveSemester } from '@/lib/api'

export function useActiveSemester() {
  return useQuery({
    queryKey: ['active-semester'],
    queryFn: () => getActiveSemester(),
    retry: false,
  })
}
