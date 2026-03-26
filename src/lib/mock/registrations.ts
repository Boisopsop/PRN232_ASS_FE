/**
 * Mock dữ liệu đăng ký slot cho nhóm và reviewer.
 */
import { type GroupSlotRegistration, type ReviewerSlotRegistration } from '@/types'

export const mockGroupRegistrations: GroupSlotRegistration[] = [
  {
    registration_id: 1,
    group_id: 1,
    slot_id: 1,
    registered_by: 1,
    status: 'REGISTERED',
    registered_at: '2024-10-03T10:00:00',
  },
  {
    registration_id: 2,
    group_id: 3,
    slot_id: 2,
    registered_by: 3,
    status: 'REGISTERED',
    registered_at: '2024-10-03T11:00:00',
  },
]

export const mockReviewerRegistrations: ReviewerSlotRegistration[] = [
  {
    reviewer_registration_id: 1,
    reviewer_id: 4,
    slot_id: 1,
    status: 'REGISTERED',
    registered_at: '2024-10-02T14:00:00',
  },
]

