/**
 * Mock dữ liệu thông báo cho người dùng trong CapReview.
 */
import { type Notification } from '@/types'

export const mockNotifications: Notification[] = [
  {
    notification_id: 1,
    user_id: 1,
    title: 'Nhắc đăng ký vòng phản biện',
    message: 'Bạn còn có thể đăng ký cho các slot đang mở cho tới ngày 08/10.',
    type: 'REMINDER',
    is_read: false,
    created_at: '2024-10-06T09:10:00',
  },
  {
    notification_id: 2,
    user_id: 4,
    title: 'Thông tin phân công reviewer',
    message: 'Có một slot mới đã được gán đề xuất cho bạn.',
    type: 'INFO',
    is_read: true,
    created_at: '2024-10-05T15:20:00',
  },
  {
    notification_id: 3,
    user_id: 3,
    title: 'Cảnh báo lịch phản biện',
    message: 'Slot bạn đăng ký có thay đổi thời gian. Vui lòng kiểm tra chi tiết.',
    type: 'ALERT',
    is_read: false,
    created_at: '2024-10-04T08:05:00',
  },
  {
    notification_id: 4,
    user_id: 2,
    title: 'Kết quả đăng ký thành công',
    message: 'Nhóm của bạn đã được đăng ký vào một slot phản biện.',
    type: 'INFO',
    is_read: true,
    created_at: '2024-10-03T18:45:00',
  },
  {
    notification_id: 5,
    user_id: 6,
    title: 'Nhắc lịch duyệt nhóm',
    message: 'Vòng phản biện sắp tới. Hãy kiểm tra lại cấu hình số slot reviewer.',
    type: 'REMINDER',
    is_read: true,
    created_at: '2024-10-02T11:30:00',
  },
]

