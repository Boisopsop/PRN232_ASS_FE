/**
 * Mock data - no longer imported by production code.
 * All pages now use API hooks instead.
 */
import { type Group, type GroupMember, type User } from '@/types'

export const mockUsers: User[] = [
  {
    user_id: 1,
    full_name: 'Nguyen Van An',
    email: 'an.sv@uni.edu',
    role: 'STUDENT',
    created_at: '2024-08-20',
    updated_at: '2024-08-20',
  },
]

export const mockGroups: Group[] = []
export const mockGroupMembers: GroupMember[] = []
