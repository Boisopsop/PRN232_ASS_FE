/**
 * Mock dữ liệu các vòng phản biện cho CapReview.
 */
import { type ReviewRound } from '@/types'

export const mockReviewRounds: ReviewRound[] = [
  {
    round_id: 1,
    semester_id: 1,
    round_number: 1,
    round_name: 'Review 1',
    registration_open_at: '2024-10-01',
    registration_close_at: '2024-10-08',
    review_date_from: '2024-10-10',
    review_date_to: '2024-10-12',
    status: 'OPEN',
  },
  {
    round_id: 2,
    semester_id: 1,
    round_number: 2,
    round_name: 'Review 2',
    registration_open_at: '2024-11-01',
    registration_close_at: '2024-11-08',
    review_date_from: '2024-11-10',
    review_date_to: '2024-11-12',
    status: 'UPCOMING',
  },
  {
    round_id: 3,
    semester_id: 1,
    round_number: 3,
    round_name: 'Review 3',
    registration_open_at: '2024-12-10',
    registration_close_at: '2024-12-17',
    review_date_from: '2024-12-19',
    review_date_to: '2024-12-21',
    status: 'UPCOMING',
  },
]

