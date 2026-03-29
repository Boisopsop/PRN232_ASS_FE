/**
 * Trang lịch dùng chung cho sinh viên và GV Review.
 */
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import React from 'react'
import { CalendarDays, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useCancelReviewerRegistration } from '@/hooks/useReviewer'
import { useRounds } from '@/hooks/useRounds'
import { useCancelGroupRegistration } from '@/hooks/useSlots'
import { getSlotsForRound } from '@/lib/mock/api'
import { mockDb, mockGroupMembers } from '@/lib/mock'
import { useAuthStore } from '@/stores/authStore'
import type { ReviewRound, Slot, SlotWithDetails } from '@/types'

type RegistrationFilter = 'ALL' | 'REGISTERED' | 'CANCELLED'

type ScheduleItem = {
  kind: 'student' | 'reviewer'
  id: number
  status: 'REGISTERED' | 'CANCELLED'
  slot: Slot
  round: ReviewRound
  slotDetails: SlotWithDetails | null
}

function weekdayLabel(iso: string): string {
  return format(parseISO(iso), 'EEEE', { locale: vi })
}

function dateLabel(iso: string): string {
  return format(parseISO(iso), 'dd/MM/yyyy')
}

function timeLabel(start: string, end: string): string {
  return `${format(parseISO(start), 'HH:mm')} - ${format(parseISO(end), 'HH:mm')}`
}

export function MySchedule() {
  const { currentUser } = useAuthStore()
  const roundsQuery = useRounds(1)
  const rounds = roundsQuery.data ?? []
  const isStudent = currentUser?.role === 'STUDENT'
  const isReviewer = currentUser?.role === 'GV_REVIEW'

  const [selectedRoundId, setSelectedRoundId] = React.useState<number | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = React.useState<RegistrationFilter>('ALL')
  const [expandedRoundIds, setExpandedRoundIds] = React.useState<number[]>([])
  const [pendingCancel, setPendingCancel] = React.useState<ScheduleItem | null>(null)

  const cancelGroupMutation = useCancelGroupRegistration()
  const cancelReviewerMutation = useCancelReviewerRegistration()

  const slotDetailsQuery = useQuery({
    queryKey: ['my-schedule-slot-details', rounds.map((r) => r.round_id).join('-')],
    enabled: rounds.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        rounds.map(async (round) => [round.round_id, await getSlotsForRound(round.round_id)] as const),
      )
      return new Map(entries)
    },
  })

  const allItemsQuery = useQuery({
    queryKey: ['my-schedule-registrations', currentUser?.user_id, currentUser?.role, slotDetailsQuery.dataUpdatedAt],
    enabled: Boolean(currentUser && rounds.length > 0),
    queryFn: async () => {
      if (!currentUser) return [] as ScheduleItem[]
      const slotById = new Map(mockDb.slots.map((s) => [s.slot_id, s] as const))
      const roundById = new Map(mockDb.rounds.map((r) => [r.round_id, r] as const))
      const detailsBySlotId = new Map<number, SlotWithDetails>()
      ;[...(slotDetailsQuery.data?.values() ?? [])].flat().forEach((slot) => {
        detailsBySlotId.set(slot.slot_id, slot)
      })

      if (currentUser.role === 'STUDENT') {
        const member = mockGroupMembers.find((m) => m.student_id === currentUser.user_id)
        if (!member) return [] as ScheduleItem[]
        const collected: ScheduleItem[] = []
        mockDb.groupRegistrations
          .filter((r) => r.group_id === member.group_id)
          .forEach((reg) => {
            const slot = slotById.get(reg.slot_id)
            const round = slot ? roundById.get(slot.round_id) : null
            if (!slot || !round) return
            collected.push({
              kind: 'student',
              id: reg.registration_id,
              status: reg.status,
              slot,
              round,
              slotDetails: detailsBySlotId.get(slot.slot_id) ?? null,
            })
          })
        return collected
      }

      if (currentUser.role === 'GV_REVIEW') {
        const collected: ScheduleItem[] = []
        mockDb.reviewerRegistrations
          .filter((r) => r.reviewer_id === currentUser.user_id)
          .forEach((reg) => {
            const slot = slotById.get(reg.slot_id)
            const round = slot ? roundById.get(slot.round_id) : null
            if (!slot || !round) return
            collected.push({
              kind: 'reviewer',
              id: reg.reviewer_registration_id,
              status: reg.status,
              slot,
              round,
              slotDetails: detailsBySlotId.get(slot.slot_id) ?? null,
            })
          })
        return collected
      }

      return [] as ScheduleItem[]
    },
  })

  const allItems = allItemsQuery.data ?? []

  React.useEffect(() => {
    if (expandedRoundIds.length === 0 && rounds.length > 0) {
      setExpandedRoundIds(rounds.map((r) => r.round_id))
    }
  }, [rounds, expandedRoundIds.length])

  const filteredItems = React.useMemo(() => {
    return allItems.filter((item) => {
      const roundOk = selectedRoundId === 'ALL' || item.round.round_id === selectedRoundId
      const statusOk = statusFilter === 'ALL' || item.status === statusFilter
      return roundOk && statusOk
    })
  }, [allItems, selectedRoundId, statusFilter])

  const grouped = React.useMemo(() => {
    return rounds
      .map((round) => ({
        round,
        items: filteredItems.filter((item) => item.round.round_id === round.round_id),
      }))
      .filter((group) => group.items.length > 0)
  }, [filteredItems, rounds])

  const onCancel = async () => {
    if (!pendingCancel) return
    try {
      if (pendingCancel.kind === 'student') {
        await cancelGroupMutation.mutateAsync({ registration_id: pendingCancel.id })
      } else {
        await cancelReviewerMutation.mutateAsync({ reviewer_registration_id: pendingCancel.id })
      }
      await Promise.all([allItemsQuery.refetch(), slotDetailsQuery.refetch()])
      toast.success('Hủy đăng ký thành công')
      setPendingCancel(null)
    } catch {
      // global mutation toast da xu ly
    }
  }

  const toggleRound = (roundId: number) => {
    setExpandedRoundIds((prev) =>
      prev.includes(roundId) ? prev.filter((id) => id !== roundId) : [...prev, roundId],
    )
  }

  if (allItemsQuery.isLoading || slotDetailsQuery.isLoading) {
    return <Card className="rounded-xl p-6 shadow-sm">Đang tải lịch...</Card>
  }

  if (allItems.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="font-sora text-2xl font-bold text-foreground">Lịch của tôi</h1>
        <EmptyState
          icon={CalendarDays}
          title="Chưa có lịch đăng ký"
          description="Bạn chưa có slot nào trong hệ thống."
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <h1 className="font-sora text-2xl font-bold text-foreground">Lịch của tôi</h1>

      <Card className="space-y-3 rounded-xl p-4 shadow-sm">
        <div className="text-sm font-medium text-muted-foreground">Round</div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={selectedRoundId === 'ALL' ? 'default' : 'outline'}
            onClick={() => setSelectedRoundId('ALL')}
          >
            Tất cả
          </Button>
          {rounds.map((round) => (
            <Button
              key={round.round_id}
              type="button"
              size="sm"
              variant={selectedRoundId === round.round_id ? 'default' : 'outline'}
              onClick={() => setSelectedRoundId(round.round_id)}
            >
              Round {round.round_number}
            </Button>
          ))}
        </div>

        <div className="text-sm font-medium text-muted-foreground">Trạng thái</div>
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'REGISTERED', 'CANCELLED'] as const).map((status) => (
            <Button
              key={status}
              type="button"
              size="sm"
              variant={statusFilter === status ? 'default' : 'outline'}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'ALL' ? 'Tất cả' : status === 'REGISTERED' ? 'Đã đăng ký' : 'Đã hủy'}
            </Button>
          ))}
        </div>
      </Card>

      <TooltipProvider>
        <div className="space-y-4">
          {grouped.map(({ round, items }) => {
            const isOpen = expandedRoundIds.includes(round.round_id)
            const registeredCount = items.filter((i) => i.status === 'REGISTERED').length
            return (
              <Card key={round.round_id} className="rounded-xl p-4 shadow-sm">
                <button
                  type="button"
                  className="flex w-full items-center justify-between"
                  onClick={() => toggleRound(round.round_id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="font-sora text-lg font-semibold text-foreground">{round.round_name}</div>
                    <StatusBadge status={round.status} size="sm" />
                    <span className="text-sm text-muted-foreground">{registeredCount} đã đăng ký</span>
                  </div>
                  {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>

                {isOpen ? (
                  <div className="mt-4 space-y-3">
                    {items.map((item) => {
                      const canCancel =
                        item.status === 'REGISTERED' &&
                        item.round.status === 'OPEN' &&
                        item.slot.status !== 'LOCKED'
                      const disableReason =
                        item.slot.status === 'LOCKED'
                          ? 'Slot đã khóa'
                          : item.round.status === 'CLOSED' || item.round.status === 'COMPLETED'
                            ? 'Đã khóa'
                            : ''
                      return (
                        <div
                          key={`${item.kind}-${item.id}`}
                          className="grid grid-cols-1 gap-3 rounded-lg border p-3 md:grid-cols-[220px_1fr_auto]"
                        >
                          <div className="rounded-md bg-primary/10 p-3 text-primary">
                            <div className="text-sm capitalize">{weekdayLabel(item.slot.start_time)}</div>
                            <div className="font-semibold">{dateLabel(item.slot.start_time)}</div>
                            <div className="text-sm">{timeLabel(item.slot.start_time, item.slot.end_time)}</div>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="font-medium text-foreground">{item.slot.room}</div>
                            {isStudent ? (
                              <div>
                                GV phản biện:{' '}
                                {item.slotDetails?.registered_reviewers.length
                                  ? item.slotDetails.registered_reviewers.map((u) => u.full_name).join(', ')
                                  : 'Chưa có'}
                              </div>
                            ) : null}
                            {isReviewer ? (
                              <div>
                                Nhóm tham gia:{' '}
                                {item.slotDetails?.registered_groups.length
                                  ? item.slotDetails.registered_groups.map((g) => g.group_name).join(', ')
                                  : 'Chưa có'}
                              </div>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={item.status} size="sm" />
                            {canCancel ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => setPendingCancel(item)}
                              >
                                Hủy
                              </Button>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button type="button" size="sm" variant="outline" disabled>
                                    Đã khóa
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{disableReason || 'Không thể thao tác'}</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </Card>
            )
          })}
        </div>
      </TooltipProvider>

      <ConfirmDialog
        isOpen={Boolean(pendingCancel)}
        onClose={() => setPendingCancel(null)}
        onConfirm={() => void onCancel()}
        title="Xác nhận hủy đăng ký"
        description="Bạn có chắc muốn hủy đăng ký slot này không?"
        confirmLabel="Xác nhận hủy"
        confirmVariant="destructive"
        isLoading={cancelGroupMutation.isPending || cancelReviewerMutation.isPending}
      />
    </div>
  )
}
