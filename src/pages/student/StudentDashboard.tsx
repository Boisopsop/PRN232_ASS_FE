/**
 * Dashboard sinh viên: tổng quan nhóm, thống kê đăng ký và slot đã đăng ký.
 */
import { motion } from 'framer-motion'
import { Calendar, ClipboardCheck, Clock3, Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, isValid, parseISO } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RoundTimeline } from '@/components/shared/RoundTimeline'
import { StatsCard } from '@/components/shared/StatsCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useRounds } from '@/hooks/useRounds'
import { useCancelGroupRegistration, useSlotsForRound } from '@/hooks/useSlots'
import { mockDb, mockGroupMembers, mockGroups, mockUsers } from '@/lib/mock'
import { useAuthStore } from '@/stores/authStore'
import { useUiStore } from '@/stores/uiStore'

function formatDateTime(dateIso: string, fmt: string): string {
  const date = parseISO(dateIso)
  if (!isValid(date)) return dateIso
  return format(date, fmt)
}

export function StudentDashboard() {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { activeRoundId } = useUiStore()

  const roundsQuery = useRounds(1)
  const rounds = roundsQuery.data ?? []

  const openRound = useMemo(() => rounds.find((r) => r.status === 'OPEN') ?? null, [rounds])
  const effectiveRoundId = openRound?.round_id ?? activeRoundId
  const slotsQuery = useSlotsForRound(effectiveRoundId)
  const slots = slotsQuery.data ?? []

  const cancelMutation = useCancelGroupRegistration()

  const group = useMemo(() => {
    if (!currentUser) return null
    const member = mockGroupMembers.find((m) => m.student_id === currentUser.user_id)
    if (!member) return null
    return mockGroups.find((g) => g.group_id === member.group_id) ?? null
  }, [currentUser])

  const gvhdName = useMemo(() => {
    if (!group) return 'Chưa có GVHD'
    const gvhd = mockUsers.find((u) => u.user_id === group.gvhd_id)
    return gvhd?.full_name ?? 'Chưa có GVHD'
  }, [group])

  const groupRegistrations = useMemo(() => {
    if (!group) return []
    return mockDb.groupRegistrations.filter((r) => r.group_id === group.group_id)
  }, [group, cancelMutation.isSuccess])

  const openRoundCount = useMemo(
    () => rounds.filter((r) => r.status === 'OPEN').length,
    [rounds],
  )

  const openSlotCountInActiveRound = useMemo(
    () => slots.filter((s) => s.status === 'OPEN').length,
    [slots],
  )

  const hasRegisteredInOpenRound = useMemo(() => {
    if (!group || !openRound) return false
    return mockDb.groupRegistrations.some((r) => {
      if (r.group_id !== group.group_id || r.status !== 'REGISTERED') return false
      const slot = mockDb.slots.find((s) => s.slot_id === r.slot_id)
      return slot ? slot.round_id === openRound.round_id : false
    })
  }, [group, openRound, cancelMutation.isSuccess])

  const registrationRows = useMemo(() => {
    if (!group) return []

    return groupRegistrations
      .map((reg) => {
        const slot = mockDb.slots.find((s) => s.slot_id === reg.slot_id)
        if (!slot) return null
        const round = mockDb.rounds.find((r) => r.round_id === slot.round_id)
        if (!round) return null
        const cancellable =
          reg.status === 'REGISTERED' &&
          round.status !== 'CLOSED' &&
          slot.status !== 'LOCKED'

        return {
          reg,
          slot,
          round,
          cancellable,
        }
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
  }, [group, groupRegistrations, cancelMutation.isSuccess])

  if (!currentUser) return null

  if (!group) {
    return (
      <Card className="rounded-2xl p-6 shadow-sm">
        <h1 className="font-sora text-xl font-bold text-slate-900">Xin chào, {currentUser.full_name}!</h1>
        <p className="mt-2 text-sm text-slate-600">Bạn chưa được phân vào nhóm nào trong học kỳ hiện tại.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <motion.section
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 p-6 text-white shadow-sm"
      >
        <h1 className="font-sora text-2xl font-bold">Xin chào, {currentUser.full_name}! 👋</h1>
        <p className="mt-2 text-sm text-white/90">
          {group.group_name} · {group.project_title}
        </p>
        <p className="mt-1 text-xs text-white/80">GVHD: {gvhdName}</p>
      </motion.section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatsCard
          title="Lần đã đăng ký"
          value={groupRegistrations.length}
          icon={ClipboardCheck}
          subtitle="Tổng số lượt đăng ký của nhóm"
        />
        <StatsCard
          title="Round đang mở"
          value={openRoundCount}
          icon={Calendar}
          subtitle="Số vòng đang mở đăng ký"
        />
        <StatsCard
          title="Slot còn trống"
          value={openSlotCountInActiveRound}
          icon={Clock3}
          subtitle="Trong round đang active"
        />
      </section>

      <Card className="rounded-2xl p-5 shadow-sm">
        <RoundTimeline rounds={rounds} />
        {openRound ? (
          <div className="mt-3 text-sm text-slate-600">
            {openSlotCountInActiveRound} slot còn trống trong <b>{openRound.round_name}</b>
          </div>
        ) : (
          <div className="mt-3 text-sm text-slate-600">Hiện chưa có round ở trạng thái mở đăng ký.</div>
        )}
      </Card>

      {openRound && !hasRegisteredInOpenRound ? (
        <Card className="rounded-2xl border border-[#D97706]/25 bg-[#D97706]/10 p-4 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <div className="text-sm font-semibold text-[#92400E]">
              ⚠️ Nhóm bạn chưa đăng ký slot cho {openRound.round_name}!
            </div>
            <Button
              type="button"
              className="rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => navigate('/student/register')}
            >
              Đăng ký ngay →
            </Button>
          </div>
        </Card>
      ) : null}

      {registrationRows.length > 0 ? (
        <Card className="rounded-2xl p-5 shadow-sm">
          <h2 className="font-sora text-lg font-bold text-slate-900">Slot đã đăng ký</h2>

          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Round</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Giờ</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrationRows.map((row) => (
                  <TableRow key={row.reg.registration_id}>
                    <TableCell className="font-medium">{row.round.round_name}</TableCell>
                    <TableCell>{formatDateTime(row.slot.start_time, 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      {formatDateTime(row.slot.start_time, 'HH:mm')} - {formatDateTime(row.slot.end_time, 'HH:mm')}
                    </TableCell>
                    <TableCell>{row.slot.room}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={row.reg.status} size="sm" />
                        {row.slot.status === 'LOCKED' ? (
                          <Badge variant="outline" className="rounded-lg">
                            Slot khóa
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.cancellable ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={cancelMutation.isPending}
                          onClick={() =>
                            cancelMutation.mutate({ registration_id: row.reg.registration_id })
                          }
                        >
                          {cancelMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                          Hủy
                        </Button>
                      ) : (
                        <Button type="button" size="sm" variant="outline" disabled>
                          Không thể hủy
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : null}
    </div>
  )
}

