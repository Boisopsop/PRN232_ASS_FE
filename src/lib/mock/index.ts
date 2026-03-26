/**
 * Tập hợp mock data và một "mockDb" để các mutation cập nhật trực tiếp vào dữ liệu.
 */
export * from './users'
export * from './semesters'
export * from './rounds'
export * from './slots'
export * from './registrations'
export * from './notifications'

import {
  mockGroupRegistrations,
  mockReviewerRegistrations,
} from './registrations'
import { mockSlots, mockReviewerSlotConfig } from './slots'
import { mockNotifications } from './notifications'
import { mockReviewRounds } from './rounds'

export const mockDb = (() => {
  let groupRegistrations = [...mockGroupRegistrations]
  let reviewerRegistrations = [...mockReviewerRegistrations]
  let slots = [...mockSlots]
  let notifications = [...mockNotifications]
  let rounds = [...mockReviewRounds]
  let configs = [...mockReviewerSlotConfig]

  return {
    groupRegistrations,
    reviewerRegistrations,
    slots,
    notifications,
    rounds,
    configs,
  }
})()

