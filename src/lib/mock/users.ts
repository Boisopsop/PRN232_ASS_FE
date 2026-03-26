/**
 * Mock dữ liệu người dùng, nhóm và thành viên nhóm cho CapReview.
 */
import { type Group, type GroupMember, type User } from '@/types'

export const mockUsers: User[] = [
  {
    user_id: 1,
    full_name: 'Nguyễn Văn An',
    email: 'an.sv@uni.edu',
    password: '123456',
    role: 'STUDENT',
    created_at: '2024-08-20',
    updated_at: '2024-08-20',
  },
  {
    user_id: 2,
    full_name: 'Trần Thị Bình',
    email: 'binh.sv@uni.edu',
    password: '123456',
    role: 'STUDENT',
    created_at: '2024-08-20',
    updated_at: '2024-08-20',
  },
  {
    user_id: 3,
    full_name: 'Phạm Thu Cúc',
    email: 'cuc.sv@uni.edu',
    password: '123456',
    role: 'STUDENT',
    created_at: '2024-08-21',
    updated_at: '2024-08-21',
  },
  {
    user_id: 4,
    full_name: 'Lê Văn Dũng',
    email: 'dung.gvr@uni.edu',
    password: '123456',
    role: 'GV_REVIEW',
    created_at: '2024-08-22',
    updated_at: '2024-08-22',
  },
  {
    user_id: 5,
    full_name: 'Hoàng Minh Đức',
    email: 'duc.gvr@uni.edu',
    password: '123456',
    role: 'GV_REVIEW',
    created_at: '2024-08-22',
    updated_at: '2024-08-22',
  },
  {
    user_id: 6,
    full_name: 'Vũ Thị Lan',
    email: 'lan.gvhd@uni.edu',
    password: '123456',
    role: 'GVHD',
    created_at: '2024-08-23',
    updated_at: '2024-08-23',
  },
  {
    user_id: 7,
    full_name: 'Ngô Quang Minh',
    email: 'minh.gvhd@uni.edu',
    password: '123456',
    role: 'GVHD',
    created_at: '2024-08-23',
    updated_at: '2024-08-23',
  },
  {
    user_id: 8,
    full_name: 'Đặng Văn Nam',
    email: 'nam.mod@uni.edu',
    password: '123456',
    role: 'MODERATOR',
    created_at: '2024-08-24',
    updated_at: '2024-08-24',
  },
]

export const mockGroups: Group[] = [
  {
    group_id: 1,
    group_name: 'Nhóm 01',
    project_title: 'AI Chatbot for Smart Education',
    semester_id: 1,
    gvhd_id: 6,
    created_at: '2024-09-05',
    updated_at: '2024-09-05',
  },
  {
    group_id: 2,
    group_name: 'Nhóm 02',
    project_title: 'Smart Campus IoT Dashboard',
    semester_id: 1,
    gvhd_id: 6,
    created_at: '2024-09-05',
    updated_at: '2024-09-05',
  },
  {
    group_id: 3,
    group_name: 'Nhóm 03',
    project_title: 'Blockchain Certificate Verification',
    semester_id: 1,
    gvhd_id: 7,
    created_at: '2024-09-05',
    updated_at: '2024-09-05',
  },
  {
    group_id: 4,
    group_name: 'Nhóm 04',
    project_title: 'Real-time Flood Monitoring System',
    semester_id: 1,
    gvhd_id: 7,
    created_at: '2024-09-05',
    updated_at: '2024-09-05',
  },
]

export const mockGroupMembers: GroupMember[] = [
  { member_id: 1, group_id: 1, student_id: 1, joined_at: '2024-09-05' },
  { member_id: 2, group_id: 1, student_id: 2, joined_at: '2024-09-05' },
  { member_id: 3, group_id: 2, student_id: 3, joined_at: '2024-09-05' },
]

