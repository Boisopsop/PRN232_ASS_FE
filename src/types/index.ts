/**
 * Định nghĩa toàn bộ kiểu dữ liệu TypeScript dùng chung cho ứng dụng CapReview.
 */

export type UserRole = 'STUDENT' | 'GV_REVIEW' | 'GVHD' | 'MODERATOR'

export interface User {
  user_id: number
  full_name: string
  email: string
  password: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Semester {
  semester_id: number
  semester_name: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export type RoundStatus = 'UPCOMING' | 'OPEN' | 'CLOSED' | 'COMPLETED'

export interface ReviewRound {
  round_id: number
  semester_id: number
  round_number: 1 | 2 | 3
  round_name: string
  registration_open_at: string
  registration_close_at: string
  review_date_from: string
  review_date_to: string
  status: RoundStatus
}

export type SlotStatus = 'OPEN' | 'FULL' | 'LOCKED' | 'CANCELLED'

export interface Slot {
  slot_id: number
  round_id: number
  start_time: string
  end_time: string
  room: string
  max_groups: number
  current_group_count: number
  min_reviewers: number
  max_reviewers: number
  status: SlotStatus
  created_by: number
}

export interface Group {
  group_id: number
  group_name: string
  project_title: string
  semester_id: number
  gvhd_id: number
  created_at: string
  updated_at: string
}

export interface GroupMember {
  member_id: number
  group_id: number
  student_id: number
  joined_at: string
}

export type RegistrationStatus = 'REGISTERED' | 'CANCELLED'

export interface GroupSlotRegistration {
  registration_id: number
  group_id: number
  slot_id: number
  registered_at: string
  registered_by: number
  status: RegistrationStatus
}

export interface ReviewerSlotRegistration {
  reviewer_registration_id: number
  reviewer_id: number
  slot_id: number
  registered_at: string
  status: RegistrationStatus
}

export interface ReviewerSlotConfig {
  config_id: number
  round_id: number
  min_slots: number
  max_slots: number
  updated_by: number
  updated_at: string
}

export type NotificationType = 'REMINDER' | 'ALERT' | 'INFO'

export interface Notification {
  notification_id: number
  user_id: number
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  created_at: string
}

// Composite types for UI
export interface SlotWithDetails extends Slot {
  round: ReviewRound
  registered_groups: Group[]
  registered_reviewers: User[]
}

export interface GroupWithDetails extends Group {
  gvhd: User
  members: User[]
}

