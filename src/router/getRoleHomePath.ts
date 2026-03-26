/**
 * Helper ánh xạ vai trò người dùng sang trang dashboard tương ứng.
 */
import type { UserRole } from '@/types'

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case 'STUDENT':
      return '/student/dashboard'
    case 'GV_REVIEW':
      return '/reviewer/dashboard'
    case 'GVHD':
      return '/reviewer/dashboard'
    case 'MODERATOR':
      return '/moderator/dashboard'
    default: {
      return '/login'
    }
  }
}

