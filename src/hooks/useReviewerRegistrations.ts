/**
 * Hook lấy danh sách đăng ký slot của reviewer.
 */
import { useQuery } from '@tanstack/react-query'

import { getReviewerRegistrations } from '@/lib/api'

export function useReviewerRegistrations(reviewerId: number) {
  return useQuery({
    queryKey: ['reviewer-registrations', reviewerId],
    queryFn: () => getReviewerRegistrations(reviewerId),
    enabled: reviewerId > 0,
  })
}
