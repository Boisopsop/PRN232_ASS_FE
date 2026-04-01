/**
 * DTO interfaces (camelCase theo BE) và mapper functions (DTO → FE snake_case types).
 *
 * BE dùng PascalCase cho enum values (Student, Open, Registered…)
 * FE dùng UPPER_SNAKE_CASE (STUDENT, OPEN, REGISTERED…)
 * Các mapper xử lý chuyển đổi này.
 */
import type {
  User,
  UserRole,
  Semester,
  ReviewRound,
  RoundStatus,
  Slot,
  SlotStatus,
  Group,
  GroupMember,
  GroupSlotRegistration,
  ReviewerSlotRegistration,
  RegistrationStatus,
  ReviewerSlotConfig,
  Notification,
  NotificationType,
} from '@/types'

// ===================== Enum maps: BE → FE =====================

const beToFeRole: Record<string, UserRole> = {
  Student: 'STUDENT',
  GvReview: 'GV_REVIEW',
  Gvhd: 'GVHD',
  Moderator: 'MODERATOR',
}

const beToFeRoundStatus: Record<string, RoundStatus> = {
  Upcoming: 'UPCOMING',
  Open: 'OPEN',
  Closed: 'CLOSED',
  Completed: 'COMPLETED',
}

const beToFeSlotStatus: Record<string, SlotStatus> = {
  Open: 'OPEN',
  Full: 'FULL',
  Locked: 'LOCKED',
  Cancelled: 'CANCELLED',
}

const beToFeRegStatus: Record<string, RegistrationStatus> = {
  Registered: 'REGISTERED',
  Cancelled: 'CANCELLED',
}

const beToFeNotifType: Record<string, NotificationType> = {
  Reminder: 'REMINDER',
  Alert: 'ALERT',
  Info: 'INFO',
}

// ===================== Enum maps: FE → BE =====================

export const feToBeRole: Record<UserRole, string> = {
  STUDENT: 'Student',
  GV_REVIEW: 'GvReview',
  GVHD: 'Gvhd',
  MODERATOR: 'Moderator',
}

export const feToBeRoundStatus: Record<RoundStatus, string> = {
  UPCOMING: 'Upcoming',
  OPEN: 'Open',
  CLOSED: 'Closed',
  COMPLETED: 'Completed',
}

export const feToBeSlotStatus: Record<SlotStatus, string> = {
  OPEN: 'Open',
  FULL: 'Full',
  LOCKED: 'Locked',
  CANCELLED: 'Cancelled',
}

export const feToBeNotifType: Record<NotificationType, string> = {
  REMINDER: 'Reminder',
  ALERT: 'Alert',
  INFO: 'Info',
}

// ===================== BE DTO interfaces =====================

export interface LoginResponseDto {
  token: string
  userId: number
  fullName: string
  email: string
  role: string
  expiresAt: string
}

export interface UserDto {
  userId: number
  fullName: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

export interface SemesterDto {
  semesterId: number
  semesterName: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
}

export interface ReviewRoundDto {
  roundId: number
  semesterId: number
  roundNumber: number
  roundName: string
  registrationOpenAt: string
  registrationCloseAt: string
  reviewDateFrom: string
  reviewDateTo: string
  status: string
}

export interface SlotDto {
  slotId: number
  roundId: number
  startTime: string
  endTime: string
  room: string
  maxGroups: number
  currentGroupCount: number
  minReviewers: number
  maxReviewers: number
  status: string
  createdBy: number
}

export interface GroupDto {
  groupId: number
  groupName: string
  projectTitle: string
  semesterId: number
  gvhdId: number
  createdAt: string
  updatedAt: string
}

export interface GroupMemberDto {
  memberId: number
  groupId: number
  studentId: number
  joinedAt: string
}

export interface GroupSlotRegistrationDto {
  registrationId: number
  groupId: number
  slotId: number
  registeredBy: number
  registeredAt: string
  status: string
}

export interface ReviewerSlotRegistrationDto {
  reviewerRegistrationId: number
  reviewerId: number
  slotId: number
  registeredAt: string
  status: string
}

export interface ReviewerSlotConfigDto {
  configId: number
  roundId: number
  minSlots: number
  maxSlots: number
  updatedBy: number
  updatedAt: string
}

export interface NotificationDto {
  notificationId: number
  userId: number
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

// ===================== Mapper functions: DTO → FE type =====================

export function mapUser(dto: UserDto): User {
  return {
    user_id: dto.userId,
    full_name: dto.fullName,
    email: dto.email,
    role: beToFeRole[dto.role] ?? 'STUDENT',
    created_at: dto.createdAt,
    updated_at: dto.updatedAt,
  }
}

export function mapSemester(dto: SemesterDto): Semester {
  return {
    semester_id: dto.semesterId,
    semester_name: dto.semesterName,
    start_date: dto.startDate,
    end_date: dto.endDate,
    is_active: dto.isActive,
    created_at: dto.createdAt,
  }
}

export function mapRound(dto: ReviewRoundDto): ReviewRound {
  return {
    round_id: dto.roundId,
    semester_id: dto.semesterId,
    round_number: dto.roundNumber as 1 | 2 | 3,
    round_name: dto.roundName,
    registration_open_at: dto.registrationOpenAt,
    registration_close_at: dto.registrationCloseAt,
    review_date_from: dto.reviewDateFrom,
    review_date_to: dto.reviewDateTo,
    status: beToFeRoundStatus[dto.status] ?? 'UPCOMING',
  }
}

export function mapSlot(dto: SlotDto): Slot {
  return {
    slot_id: dto.slotId,
    round_id: dto.roundId,
    start_time: dto.startTime,
    end_time: dto.endTime,
    room: dto.room,
    max_groups: dto.maxGroups,
    current_group_count: dto.currentGroupCount,
    min_reviewers: dto.minReviewers,
    max_reviewers: dto.maxReviewers,
    status: beToFeSlotStatus[dto.status] ?? 'OPEN',
    created_by: dto.createdBy,
  }
}

export function mapGroup(dto: GroupDto): Group {
  return {
    group_id: dto.groupId,
    group_name: dto.groupName,
    project_title: dto.projectTitle,
    semester_id: dto.semesterId,
    gvhd_id: dto.gvhdId,
    created_at: dto.createdAt,
    updated_at: dto.updatedAt,
  }
}

export function mapGroupMember(dto: GroupMemberDto): GroupMember {
  return {
    member_id: dto.memberId,
    group_id: dto.groupId,
    student_id: dto.studentId,
    joined_at: dto.joinedAt,
  }
}

export function mapGroupRegistration(dto: GroupSlotRegistrationDto): GroupSlotRegistration {
  return {
    registration_id: dto.registrationId,
    group_id: dto.groupId,
    slot_id: dto.slotId,
    registered_by: dto.registeredBy,
    registered_at: dto.registeredAt,
    status: beToFeRegStatus[dto.status] ?? 'REGISTERED',
  }
}

export function mapReviewerRegistration(dto: ReviewerSlotRegistrationDto): ReviewerSlotRegistration {
  return {
    reviewer_registration_id: dto.reviewerRegistrationId,
    reviewer_id: dto.reviewerId,
    slot_id: dto.slotId,
    registered_at: dto.registeredAt,
    status: beToFeRegStatus[dto.status] ?? 'REGISTERED',
  }
}

export function mapReviewerConfig(dto: ReviewerSlotConfigDto): ReviewerSlotConfig {
  return {
    config_id: dto.configId,
    round_id: dto.roundId,
    min_slots: dto.minSlots,
    max_slots: dto.maxSlots,
    updated_by: dto.updatedBy,
    updated_at: dto.updatedAt,
  }
}

export function mapNotification(dto: NotificationDto): Notification {
  return {
    notification_id: dto.notificationId,
    user_id: dto.userId,
    title: dto.title,
    message: dto.message,
    type: beToFeNotifType[dto.type] ?? 'INFO',
    is_read: dto.isRead,
    created_at: dto.createdAt,
  }
}
