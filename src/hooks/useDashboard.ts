/**
 * Custom hook lấy dữ liệu dashboard moderator.
 */
import { useQuery } from '@tanstack/react-query'

import { getModeratorDashboardData } from '@/lib/api'

export function useModeratorDashboard(round_id: number) {
  return useQuery({
    queryKey: ['dashboard', round_id],
    queryFn: () => getModeratorDashboardData(round_id),
    enabled: round_id > 0,
  })
}

