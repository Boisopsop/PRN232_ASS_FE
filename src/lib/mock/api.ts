/**
 * Mock API service layer cho CapReview.
 * Mọi hàm mô phỏng delay 400ms và dùng `mockDb` để lưu trạng thái mutable.
 */
import { type Group, type GroupSlotRegistration, type Notification, type ReviewerSlotConfig, type ReviewerSlotRegistration, type ReviewRound, type Slot, type SlotWithDetails, type SlotStatus, type User } from '@/types'
import { mockGroups, mockGroupMembers, mockUsers } from './users'
import { mockSemesters } from './semesters'
import { mockReviewRounds } from './rounds'
import { mockSlots, mockReviewerSlotConfig } from './slots'
import { mockGroupRegistrations, mockReviewerRegistrations } from './registrations'
import { mockNotifications } from './notifications'
import { mockDb } from './index'

const DELAY_MS = 400

async function withDelay<T>(work: () => T | Promise<T>): Promise<T> {
  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), DELAY_MS)
  })
  return await work()
}

function nowIso(): string {
  return new Date().toISOString()
}

function getUserByEmailAndPassword(email: string, _password: string): User | undefined {
  return mockUsers.find((u) => u.email === email)
}

function getUserById(user_id: number): User | undefined {
  return mockUsers.find((u) => u.user_id === user_id)
}

function getGroupById(group_id: number): Group | undefined {
  return mockGroups.find((g) => g.group_id === group_id)
}

function getRoundById(round_id: number): ReviewRound | undefined {
  return mockDb.rounds.find((r) => r.round_id === round_id)
}

function getSemesterById(semester_id: number) {
  return mockSemesters.find((s) => s.semester_id === semester_id)
}

function getSlotById(slot_id: number): Slot | undefined {
  return mockDb.slots.find((s) => s.slot_id === slot_id)
}

function getReviewerConfigByRoundId(round_id: number): ReviewerSlotConfig | undefined {
  return mockDb.configs.find((c) => c.round_id === round_id)
}

function getRoundIdForSlot(slot_id: number): number {
  const slot = getSlotById(slot_id)
  if (!slot) throw new Error('Không tìm thấy slot')
  return slot.round_id
}

function isSlotFull(slot: Slot): boolean {
  return slot.current_group_count >= slot.max_groups
}

function deriveSlotStatus(slot: Slot): SlotStatus {
  if (slot.status === 'LOCKED') return 'LOCKED'
  if (slot.status === 'CANCELLED') return 'CANCELLED'
  return isSlotFull(slot) ? 'FULL' : 'OPEN'
}

function nextId(current: number[]): number {
  const max = current.length ? Math.max(...current) : 0
  return max + 1
}

function populateSlotDetails(round_id: number, slots: Slot[]): SlotWithDetails[] {
  const round = getRoundById(round_id)
  if (!round) return []

  return slots.map((slot) => {
    const registeredGroupIds = mockDb.groupRegistrations
      .filter((r) => r.slot_id === slot.slot_id && r.status === 'REGISTERED')
      .map((r) => r.group_id)

    const registeredGroups: Group[] = registeredGroupIds
      .map((group_id) => getGroupById(group_id))
      .filter((g): g is Group => Boolean(g))

    const registeredReviewerIds = mockDb.reviewerRegistrations
      .filter((r) => r.slot_id === slot.slot_id && r.status === 'REGISTERED')
      .map((r) => r.reviewer_id)

    const registeredReviewers: User[] = registeredReviewerIds
      .map((reviewer_id) => getUserById(reviewer_id))
      .filter((u): u is User => Boolean(u))

    return {
      ...slot,
      round,
      registered_groups: registeredGroups,
      registered_reviewers: registeredReviewers,
    }
  })
}

function assertRoundOpen(round: ReviewRound): void {
  if (round.status !== 'OPEN') throw new Error('Vòng phản biện hiện không ở trạng thái OPEN')
}

function assertRoundInRegistrationWindow(round: ReviewRound): void {
  const now = Date.now()
  const openAt = new Date(round.registration_open_at).getTime()
  const closeAt = new Date(round.registration_close_at).getTime()
  if (Number.isNaN(openAt) || Number.isNaN(closeAt)) {
    throw new Error('Mốc thời gian đăng ký của round không hợp lệ')
  }
  if (now < openAt || now > closeAt) {
    throw new Error('Hiện không nằm trong thời gian đăng ký của round')
  }
}

function assertRoundNotClosed(round: ReviewRound): void {
  if (round.status === 'CLOSED') throw new Error('Vòng phản biện đã ở trạng thái CLOSED')
}

function assertSlotNotLocked(slot: Slot): void {
  if (slot.status === 'LOCKED') throw new Error('Slot này đang bị LOCKED')
}

function assertSlotOpen(slot: Slot): void {
  if (slot.status !== 'OPEN') {
    throw new Error('Slot hiện không ở trạng thái OPEN')
  }
}

function assertSlotNotFull(slot: Slot): void {
  if (isSlotFull(slot) || slot.status === 'FULL') throw new Error('Slot đã FULL')
}

function countReviewerSlotsForRound(reviewer_id: number, round_id: number): number {
  return mockDb.reviewerRegistrations.filter((r) => {
    if (r.reviewer_id !== reviewer_id) return false
    if (r.status !== 'REGISTERED') return false
    const slot = getSlotById(r.slot_id)
    if (!slot) return false
    return slot.round_id === round_id
  }).length
}

function getSlotRegisteredGroups(slot_id: number): GroupSlotRegistration[] {
  return mockDb.groupRegistrations.filter((r) => r.slot_id === slot_id)
}

function getRegisteredGroupSlotForGroup(group_id: number, slot_id: number): GroupSlotRegistration | undefined {
  return mockDb.groupRegistrations.find((r) => r.group_id === group_id && r.slot_id === slot_id && r.status === 'REGISTERED')
}

function getActiveGroupRegistrationForRound(group_id: number, round_id: number): GroupSlotRegistration | undefined {
  return mockDb.groupRegistrations.find((r) => {
    if (r.group_id !== group_id) return false
    if (r.status !== 'REGISTERED') return false
    const slot = getSlotById(r.slot_id)
    return slot ? slot.round_id === round_id : false
  })
}

function getActiveReviewerRegistration(reviewer_id: number, slot_id: number): ReviewerSlotRegistration | undefined {
  return mockDb.reviewerRegistrations.find((r) => r.reviewer_id === reviewer_id && r.slot_id === slot_id && r.status === 'REGISTERED')
}

export async function loginApi(email: string, password: string): Promise<User> {
  return withDelay(async () => {
    const user = getUserByEmailAndPassword(email, password)
    if (!user) throw new Error('Sai email hoặc mật khẩu')
    return user
  })
}

export async function getSlotsForRound(round_id: number): Promise<SlotWithDetails[]> {
  return withDelay(async () => {
    const slots = mockDb.slots.filter((s) => s.round_id === round_id)
    return populateSlotDetails(round_id, slots)
  })
}

export async function registerGroupSlot(group_id: number, slot_id: number, registered_by: number): Promise<GroupSlotRegistration> {
  return withDelay(async () => {
    const slot = getSlotById(slot_id)
    if (!slot) throw new Error('Không tìm thấy slot')

    const round = getRoundById(slot.round_id)
    if (!round) throw new Error('Không tìm thấy vòng phản biện')
    assertRoundOpen(round)
    assertRoundInRegistrationWindow(round)
    assertSlotOpen(slot)

    assertSlotNotFull(slot)

    const group = getGroupById(group_id)
    if (!group) throw new Error('Không tìm thấy nhóm')

    const existingForGroup = getActiveGroupRegistrationForRound(group_id, round.round_id)
    if (existingForGroup) throw new Error('Nhóm đã đăng ký cho một slot ở vòng này')

    const alreadyRegisteredSameSlot = getRegisteredGroupSlotForGroup(group_id, slot_id)
    if (alreadyRegisteredSameSlot) throw new Error('Nhóm đã đăng ký slot này')

    const newId = nextId(mockDb.groupRegistrations.map((r) => r.registration_id))
    const registration: GroupSlotRegistration = {
      registration_id: newId,
      group_id,
      slot_id,
      registered_at: nowIso(),
      registered_by,
      status: 'REGISTERED',
    }

    mockDb.groupRegistrations.push(registration)

    slot.current_group_count += 1
    slot.status = deriveSlotStatus(slot)

    return registration
  })
}

export async function cancelGroupRegistration(registration_id: number): Promise<void> {
  return withDelay(async () => {
    const registration = mockDb.groupRegistrations.find((r) => r.registration_id === registration_id)
    if (!registration) throw new Error('Không tìm thấy đăng ký nhóm')
    if (registration.status !== 'REGISTERED') throw new Error('Đăng ký này không thể hủy')

    const slot = getSlotById(registration.slot_id)
    if (!slot) throw new Error('Không tìm thấy slot')

    const round = getRoundById(slot.round_id)
    if (!round) throw new Error('Không tìm thấy vòng phản biện')
    assertRoundNotClosed(round)
    assertSlotNotLocked(slot)

    registration.status = 'CANCELLED'
    slot.current_group_count = Math.max(0, slot.current_group_count - 1)
    slot.status = deriveSlotStatus(slot)
  })
}

export async function registerReviewerSlot(reviewer_id: number, slot_id: number): Promise<ReviewerSlotRegistration> {
  return withDelay(async () => {
    const reviewer = getUserById(reviewer_id)
    if (!reviewer) throw new Error('Không tìm thấy reviewer')
    if (reviewer.role === 'GVHD') throw new Error('GVHD không thể đăng ký làm reviewer')

    const slot = getSlotById(slot_id)
    if (!slot) throw new Error('Không tìm thấy slot')

    const round = getRoundById(slot.round_id)
    if (!round) throw new Error('Không tìm thấy vòng phản biện')
    assertRoundOpen(round)
    assertRoundInRegistrationWindow(round)
    assertSlotOpen(slot)

    const hasGvhdConflict = mockDb.groupRegistrations.some((reg) => {
      if (reg.slot_id !== slot_id || reg.status !== 'REGISTERED') return false
      const group = getGroupById(reg.group_id)
      if (!group) return false
      return group.gvhd_id === reviewer_id
    })
    if (hasGvhdConflict) throw new Error('Bạn là GVHD của một nhóm trong slot này')

    const config = getReviewerConfigByRoundId(round.round_id)
    if (!config) throw new Error('Không tìm thấy cấu hình số lượng slot reviewer')

    const activeCount = countReviewerSlotsForRound(reviewer_id, round.round_id)
    if (activeCount >= config.max_slots) throw new Error('Reviewer đã đạt giới hạn số slot có thể đăng ký')

    const existing = getActiveReviewerRegistration(reviewer_id, slot_id)
    if (existing) throw new Error('Reviewer đã đăng ký slot này')

    const newId = nextId(mockDb.reviewerRegistrations.map((r) => r.reviewer_registration_id))
    const reg: ReviewerSlotRegistration = {
      reviewer_registration_id: newId,
      reviewer_id,
      slot_id,
      registered_at: nowIso(),
      status: 'REGISTERED',
    }

    mockDb.reviewerRegistrations.push(reg)

    return reg
  })
}

export async function cancelReviewerRegistration(reviewer_registration_id: number): Promise<void> {
  return withDelay(async () => {
    const registration = mockDb.reviewerRegistrations.find((r) => r.reviewer_registration_id === reviewer_registration_id)
    if (!registration) throw new Error('Không tìm thấy đăng ký reviewer')
    if (registration.status !== 'REGISTERED') throw new Error('Đăng ký reviewer này không thể hủy')

    const slot = getSlotById(registration.slot_id)
    if (!slot) throw new Error('Không tìm thấy slot')

    const round = getRoundById(slot.round_id)
    if (!round) throw new Error('Không tìm thấy vòng phản biện')

    assertRoundNotClosed(round)
    assertSlotNotLocked(slot)

    registration.status = 'CANCELLED'
  })
}

export async function getRoundsForSemester(semester_id: number): Promise<ReviewRound[]> {
  return withDelay(async () => {
    return mockDb.rounds.filter((r) => r.semester_id === semester_id)
  })
}

export async function createRound(data: Omit<ReviewRound, 'round_id'>): Promise<ReviewRound> {
  return withDelay(async () => {
    const semester = getSemesterById(data.semester_id)
    if (!semester) throw new Error('Không tìm thấy học kỳ')

    const id = nextId(mockDb.rounds.map((r) => r.round_id))
    const round: ReviewRound = { ...data, round_id: id }
    mockDb.rounds.push(round)
    return round
  })
}

export async function updateRound(round_id: number, data: Partial<ReviewRound>): Promise<ReviewRound> {
  return withDelay(async () => {
    const round = getRoundById(round_id)
    if (!round) throw new Error('Không tìm thấy vòng phản biện')
    Object.assign(round, data)
    return round
  })
}

export async function deleteRound(round_id: number): Promise<void> {
  return withDelay(async () => {
    const exists = mockDb.rounds.some((r) => r.round_id === round_id)
    if (!exists) throw new Error('Không tìm thấy vòng phản biện')

    mockDb.rounds = mockDb.rounds.filter((r) => r.round_id !== round_id)

    // Xóa slot + hủy các đăng ký liên quan
    const slotsToRemove = mockDb.slots.filter((s) => s.round_id === round_id)
    const slotIdsToRemove = new Set(slotsToRemove.map((s) => s.slot_id))
    mockDb.slots = mockDb.slots.filter((s) => s.round_id !== round_id)
    mockDb.groupRegistrations = mockDb.groupRegistrations.map((r) => {
      if (slotIdsToRemove.has(r.slot_id) && r.status === 'REGISTERED') return { ...r, status: 'CANCELLED' as const }
      return r
    })
    mockDb.reviewerRegistrations = mockDb.reviewerRegistrations.map((r) => {
      if (slotIdsToRemove.has(r.slot_id) && r.status === 'REGISTERED') return { ...r, status: 'CANCELLED' as const }
      return r
    })
    mockDb.configs = mockDb.configs.filter((c) => c.round_id !== round_id)
  })
}

export async function createSlot(data: Omit<Slot, 'slot_id' | 'current_group_count'>): Promise<Slot> {
  return withDelay(async () => {
    const round = getRoundById(data.round_id)
    if (!round) throw new Error('Không tìm thấy vòng phản biện cho slot')

    const id = nextId(mockDb.slots.map((s) => s.slot_id))
    const slot: Slot = {
      slot_id: id,
      current_group_count: 0,
      ...data,
    }

    slot.status = slot.status === 'FULL' ? 'OPEN' : slot.status
    mockDb.slots.push(slot)
    return slot
  })
}

export async function updateSlot(slot_id: number, data: Partial<Slot>): Promise<Slot> {
  return withDelay(async () => {
    const slot = getSlotById(slot_id)
    if (!slot) throw new Error('Không tìm thấy slot')

    Object.assign(slot, data)

    // Chuẩn hóa trạng thái theo số lượng nhóm
    slot.status = deriveSlotStatus(slot)
    return slot
  })
}

export async function deleteSlot(slot_id: number): Promise<void> {
  return withDelay(async () => {
    const slot = getSlotById(slot_id)
    if (!slot) throw new Error('Không tìm thấy slot')

    mockDb.slots = mockDb.slots.filter((s) => s.slot_id !== slot_id)
    mockDb.groupRegistrations = mockDb.groupRegistrations.map((r) => {
      if (r.slot_id === slot_id && r.status === 'REGISTERED') return { ...r, status: 'CANCELLED' as const }
      return r
    })
    mockDb.reviewerRegistrations = mockDb.reviewerRegistrations.map((r) => {
      if (r.slot_id === slot_id && r.status === 'REGISTERED') return { ...r, status: 'CANCELLED' as const }
      return r
    })
  })
}

export async function getReviewerConfig(round_id: number): Promise<ReviewerSlotConfig> {
  return withDelay(async () => {
    const config = getReviewerConfigByRoundId(round_id)
    if (!config) throw new Error('Không tìm thấy cấu hình reviewer')
    return config
  })
}

export async function updateReviewerConfig(round_id: number, min_slots: number, max_slots: number): Promise<ReviewerSlotConfig> {
  return withDelay(async () => {
    const config = getReviewerConfigByRoundId(round_id)
    if (!config) throw new Error('Không tìm thấy cấu hình reviewer')
    if (min_slots > max_slots) throw new Error('min_slots không được lớn hơn max_slots')

    config.min_slots = min_slots
    config.max_slots = max_slots
    config.updated_at = nowIso()
    return config
  })
}

export async function getNotificationsForUser(user_id: number): Promise<Notification[]> {
  return withDelay(async () => {
    return mockDb.notifications.filter((n) => n.user_id === user_id).slice()
  })
}

export async function markAllAsRead(user_id: number): Promise<void> {
  return withDelay(async () => {
    mockDb.notifications = mockDb.notifications.map((n) => {
      if (n.user_id === user_id) return { ...n, is_read: true }
      return n
    })
  })
}

export async function sendReminder(user_id: number, message: string): Promise<Notification> {
  return withDelay(async () => {
    const id = nextId(mockDb.notifications.map((n) => n.notification_id))
    const notification: Notification = {
      notification_id: id,
      user_id,
      title: 'Nhắc nhở',
      message,
      type: 'REMINDER',
      is_read: false,
      created_at: nowIso(),
    }
    mockDb.notifications.push(notification)
    return notification
  })
}

export async function getModeratorDashboardData(
  round_id: number,
): Promise<{
  slotStats: { slot: SlotWithDetails; hasReviewer: boolean }[]
  reviewerStats: { reviewer: User; registeredCount: number; minRequired: number; isSufficient: boolean }[]
  groupStats: { group: Group; registeredSlots: Slot[]; hasRegistered: boolean }[]
}> {
  return withDelay(async () => {
    const round = getRoundById(round_id)
    if (!round) throw new Error('Không tìm thấy vòng phản biện')

    const slots = mockDb.slots.filter((s) => s.round_id === round_id)
    const slotDetails = populateSlotDetails(round_id, slots)

    const slotStats = slotDetails.map((slot) => {
      const hasReviewer = mockDb.reviewerRegistrations.some((r) => r.slot_id === slot.slot_id && r.status === 'REGISTERED')
      return { slot, hasReviewer }
    })

    const config = getReviewerConfigByRoundId(round_id)
    if (!config) throw new Error('Không tìm thấy cấu hình reviewer')

    const reviewerCandidates = mockUsers.filter((u) => u.role === 'GV_REVIEW')
    const reviewerStats = reviewerCandidates.map((reviewer) => {
      const registeredCount = countReviewerSlotsForRound(reviewer.user_id, round_id)
      const minRequired = config.min_slots
      const isSufficient = registeredCount >= minRequired
      return { reviewer, registeredCount, minRequired, isSufficient }
    })

    const semesterGroups = mockGroups.filter((g) => g.semester_id === round.semester_id)
    const groupStats = semesterGroups.map((group) => {
      const slotIds = new Set(
        mockDb.groupRegistrations
          .filter((r) => r.group_id === group.group_id && r.status === 'REGISTERED' && (() => {
            const slot = getSlotById(r.slot_id)
            return slot ? slot.round_id === round_id : false
          })())
          .map((r) => r.slot_id),
      )

      const registeredSlots = mockDb.slots.filter((s) => slotIds.has(s.slot_id))
      return {
        group,
        registeredSlots,
        hasRegistered: registeredSlots.length > 0,
      }
    })

    return { slotStats, reviewerStats, groupStats }
  })
}

// Tránh cảnh báo unused import ở build-time
void mockGroupMembers
void mockReviewRounds
void mockSlots
void mockReviewerSlotConfig
void mockGroupRegistrations
void mockReviewerRegistrations
void mockNotifications
void getSlotRegisteredGroups
void getGroupById
void assertSlotNotFull
void isSlotFull
void getSlotById
void getActiveReviewerRegistration
void getRegisteredGroupSlotForGroup
void getSlotRegisteredGroups
void deriveSlotStatus
void assertSlotNotLocked
void assertRoundOpen
void assertRoundNotClosed
void getRoundIdForSlot
void getReviewerConfigByRoundId
void getSemesterById
void countReviewerSlotsForRound
void populateSlotDetails
void nextId
void deriveSlotStatus
void assertSlotNotLocked
void assertRoundNotClosed
void assertRoundOpen
void getReviewerConfigByRoundId
void getSlotById
void getUserById
void getGroupById
void getRoundById
void getUserByEmailAndPassword
void getActiveReviewerRegistration
void getActiveGroupRegistrationForRound
void getRegisteredGroupSlotForGroup
void countReviewerSlotsForRound
void populateSlotDetails

