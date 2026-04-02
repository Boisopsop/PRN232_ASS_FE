/**
 * Trang lịch hợp nhất cho sinh viên: calendar view + đăng ký slot + xem lịch.
 * Gộp trang "Đăng ký Slot" và "Lịch của tôi" thành 1 trang duy nhất.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  isValid,
} from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  FileText,
  Info,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useRounds } from '@/hooks/useRounds'
import { useSlotsForRound, useRegisterGroupSlot, useCancelGroupRegistration } from '@/hooks/useSlots'
import { useSlotSignalR } from '@/hooks/useSlotSignalR'
import { useStudentGroup } from '@/hooks/useStudentGroup'
import { useGroupRegistrations } from '@/hooks/useGroupRegistrations'
import { useActiveSemester } from '@/hooks/useActiveSemester'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import type { ReviewRound, SlotWithDetails } from '@/types'

/* ---------- helpers ---------- */

function fmtTime(iso: string): string {
  const d = parseISO(iso)
  return isValid(d) ? format(d, 'HH:mm') : iso
}

function fmtDate(iso: string): string {
  const d = parseISO(iso)
  return isValid(d) ? format(d, 'dd/MM/yyyy') : iso
}

function fmtDateLocale(iso: string): string {
  const d = parseISO(iso)
  return isValid(d) ? format(d, 'EEEE, dd/MM/yyyy', { locale: vi }) : iso
}

type SlotDateStatus = 'available' | 'conflict' | 'locked' | 'registered' | 'selected'

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

/* ---------- component ---------- */

export function StudentCalendar() {
  const { currentUser } = useAuthStore()

  // find active semester
  const activeSemesterQuery = useActiveSemester()
  const activeSemester = activeSemesterQuery.data ?? null

  const roundsQuery = useRounds(activeSemester?.semester_id ?? 0)
  const rounds = roundsQuery.data ?? []

  // Round selection
  const firstOpenRoundId = useMemo(
    () => rounds.find((r) => r.status === 'OPEN')?.round_id ?? 0,
    [rounds],
  )
  const [selectedRoundId, setSelectedRoundId] = useState(0)

  useEffect(() => {
    if (selectedRoundId > 0) return
    if (firstOpenRoundId > 0) {
      setSelectedRoundId(firstOpenRoundId)
      return
    }
    if (rounds.length > 0) setSelectedRoundId(rounds[0].round_id)
  }, [firstOpenRoundId, rounds, selectedRoundId])

  const activeRound = useMemo(
    () => rounds.find((r) => r.round_id === selectedRoundId) ?? null,
    [rounds, selectedRoundId],
  )

  // Slots
  const slotsQuery = useSlotsForRound(selectedRoundId)
  useSlotSignalR(selectedRoundId)
  const slots = slotsQuery.data ?? []
  const registerMutation = useRegisterGroupSlot()
  const cancelMutation = useCancelGroupRegistration()

  // Group of current student
  const studentGroupQuery = useStudentGroup(currentUser?.user_id ?? 0)
  const group = studentGroupQuery.data?.group ?? null

  // Existing registration for this round
  const groupRegsQuery = useGroupRegistrations(group?.group_id ?? 0)
  const groupRegistration = useMemo(() => {
    if (!group || !activeRound) return null
    const regs = groupRegsQuery.data ?? []
    return (
      regs.find((r) => {
        if (r.status !== 'REGISTERED') return false
        const slot = slots.find((s) => s.slot_id === r.slot_id)
        return slot ? slot.round_id === activeRound.round_id : false
      }) ?? null
    )
  }, [group, activeRound, groupRegsQuery.data, slots])

  // Calendar month state
  const [monthBase, setMonthBase] = useState<Date>(() => {
    if (activeRound) {
      const d = parseISO(activeRound.review_date_from)
      return isValid(d) ? startOfMonth(d) : startOfMonth(new Date())
    }
    return startOfMonth(new Date())
  })

  // Update calendar month when round changes
  useEffect(() => {
    if (activeRound) {
      const d = parseISO(activeRound.review_date_from)
      if (isValid(d)) setMonthBase(startOfMonth(d))
    }
  }, [activeRound])

  // Selected slot
  const [selectedSlot, setSelectedSlot] = useState<SlotWithDetails | null>(null)

  // Map: dateStr -> slots on that date
  const slotsByDate = useMemo(() => {
    const map = new Map<string, SlotWithDetails[]>()
    for (const slot of slots) {
      const dateKey = format(parseISO(slot.start_time), 'yyyy-MM-dd')
      const arr = map.get(dateKey) ?? []
      arr.push(slot)
      map.set(dateKey, arr)
    }
    return map
  }, [slots])

  // calendar days grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(monthBase)
    const monthEnd = endOfMonth(monthBase)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [monthBase])

  // slot status for a given slot
  const getSlotStatus = useCallback(
    (slot: SlotWithDetails): SlotDateStatus => {
      if (selectedSlot?.slot_id === slot.slot_id) return 'selected'
      if (groupRegistration && groupRegistration.slot_id === slot.slot_id) return 'registered'
      if (slot.status === 'LOCKED' || slot.status === 'CANCELLED') return 'locked'
      if (slot.status === 'FULL') return 'conflict'
      return 'available'
    },
    [selectedSlot, groupRegistration],
  )

  // Aggregate status for a date cell
  // Click date -> show first slot for that day or expand
  const handleDateClick = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    const dateSlots = slotsByDate.get(dateKey)
    if (!dateSlots || dateSlots.length === 0) return

    // If only one slot, select it directly
    if (dateSlots.length === 1) {
      setSelectedSlot(dateSlots[0])
      return
    }

    // If multiple, select first open or first
    const openSlot = dateSlots.find((s) => s.status === 'OPEN')
    setSelectedSlot(openSlot ?? dateSlots[0])
  }

  // Total slots this month
  const totalSlotsThisMonth = useMemo(() => {
    return slots.filter((s) => {
      const d = parseISO(s.start_time)
      return isSameMonth(d, monthBase)
    }).length
  }, [slots, monthBase])

  // Registration dialog
  const [registerDialog, setRegisterDialog] = useState<{ slot_id: number } | null>(null)
  const [cancelDialog, setCancelDialog] = useState<{ registration_id: number } | null>(null)

  const onConfirmRegister = async () => {
    if (!group || !currentUser || !registerDialog) return
    try {
      await registerMutation.mutateAsync({
        group_id: group.group_id,
        slot_id: registerDialog.slot_id,
        registered_by: currentUser.user_id,
      })
      toast.success('Đăng ký thành công! 🎉')
      setRegisterDialog(null)
      setSelectedSlot(null)
      void slotsQuery.refetch()
    } catch {
      // handled by hook
    }
  }

  const onConfirmCancel = async () => {
    if (!cancelDialog) return
    try {
      await cancelMutation.mutateAsync({ registration_id: cancelDialog.registration_id })
      toast.success('Hủy đăng ký thành công')
      setCancelDialog(null)
      setSelectedSlot(null)
      void slotsQuery.refetch()
    } catch {
      // handled by hook
    }
  }

  // No group
  if (!group) {
    return (
      <Card className="rounded-xl p-6 shadow-sm">
        <h1 className="font-sora text-xl font-bold text-foreground">Đăng ký phản biện</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Bạn chưa được gán vào nhóm để thực hiện đăng ký slot.
        </p>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="calendar" className="space-y-4">
      <TabsList>
        <TabsTrigger value="calendar">📅 Lịch tháng</TabsTrigger>
        <TabsTrigger value="list">📋 Danh sách Slot</TabsTrigger>
      </TabsList>

      <TabsContent value="list">
        <SlotBookingPage />
      </TabsContent>

      <TabsContent value="calendar">
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-sora text-2xl font-bold text-foreground">Đăng ký phản biện</h1>
          {activeSemester ? (
            <p className="mt-1 text-sm font-medium text-primary">
              {activeSemester.semester_name}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month navigation */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5">
            <button
              type="button"
              onClick={() => setMonthBase(subMonths(monthBase, 1))}
              className="rounded p-1 transition hover:bg-muted"
              aria-label="Tháng trước"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <span className="min-w-35 text-center text-sm font-semibold text-foreground">
              {format(monthBase, 'MMMM yyyy', { locale: vi })}
            </span>
            <button
              type="button"
              onClick={() => setMonthBase(addMonths(monthBase, 1))}
              className="rounded p-1 transition hover:bg-muted"
              aria-label="Tháng sau"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Round selector */}
          <Select
            value={String(selectedRoundId)}
            onValueChange={(val) => setSelectedRoundId(Number(val))}
          >
            <SelectTrigger className="w-55">
              <SelectValue placeholder="Chọn round" />
            </SelectTrigger>
            <SelectContent>
              {rounds.map((round) => (
                <SelectItem key={round.round_id} value={String(round.round_id)}>
                  Round {round.round_number}: {round.round_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Registered banner */}
      {groupRegistration ? (
        <Card className="rounded-xl border border-green-600/30 bg-green-600/10 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                ✅ Nhóm bạn đã đăng ký slot cho {activeRound?.round_name}
              </div>
              {(() => {
                const slot = slots.find(
                  (s) => s.slot_id === groupRegistration.slot_id,
                )
                if (!slot) return null
                return (
                  <div className="mt-1 text-sm text-green-600 dark:text-green-400">
                    {fmtDate(slot.start_time)} · {fmtTime(slot.start_time)} -{' '}
                    {fmtTime(slot.end_time)} · {slot.room}
                  </div>
                )
              })()}
            </div>
            {activeRound?.status === 'OPEN' ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() =>
                  setCancelDialog({
                    registration_id: groupRegistration.registration_id,
                  })
                }
              >
                Hủy đăng ký
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* Main content: Calendar + Side panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar grid */}
        <Card className="overflow-hidden rounded-xl shadow-sm">
          <div className="p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-border pb-2">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="text-center text-xs font-semibold uppercase text-muted-foreground"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Calendar body */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day) => {
                const inMonth = isSameMonth(day, monthBase)
                const today = isToday(day)
                const dateKey = format(day, 'yyyy-MM-dd')
                const dateSlots = slotsByDate.get(dateKey) ?? []
                const hasSlots = dateSlots.length > 0
                const isSelected =
                  selectedSlot &&
                  dateKey ===
                    format(parseISO(selectedSlot.start_time), 'yyyy-MM-dd')

                return (
                  <button
                    key={dateKey}
                    type="button"
                    disabled={!inMonth || !hasSlots}
                    onClick={() => handleDateClick(day)}
                    className={cn(
                      'relative flex min-h-20 flex-col items-start border-b border-r border-border p-1.5 text-left transition-colors',
                      !inMonth && 'bg-muted/30 text-muted-foreground/40',
                      inMonth && 'hover:bg-muted/50',
                      isSelected && 'bg-primary/10',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm',
                        today && 'bg-primary font-bold text-primary-foreground',
                        !today && inMonth && 'text-foreground',
                        isSelected && !today && 'bg-primary/20 font-semibold text-primary',
                      )}
                    >
                      {format(day, 'd')}
                    </span>

                    {/* Slot badges */}
                    <div className="mt-0.5 flex w-full flex-col gap-0.5">
                      {dateSlots.slice(0, 3).map((slot) => {
                        const status = getSlotStatus(slot)
                        return (
                          <button
                            key={slot.slot_id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedSlot(slot)
                            }}
                            className={cn(
                              'w-full truncate rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight transition-colors',
                              status === 'available' &&
                                'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300',
                              status === 'registered' &&
                                'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300',
                              status === 'conflict' &&
                                'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
                              status === 'locked' &&
                                'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                              status === 'selected' &&
                                'bg-primary text-primary-foreground',
                            )}
                          >
                            {fmtTime(slot.start_time)}
                            {status === 'available'
                              ? ' · Trống'
                              : status === 'registered'
                                ? ' · Đã ĐK'
                                : status === 'conflict'
                                  ? ' · Đầy'
                                  : status === 'locked'
                                    ? ' · Khóa'
                                    : ''}
                          </button>
                        )
                      })}
                      {dateSlots.length > 3 ? (
                        <span className="text-[10px] text-muted-foreground">
                          +{dateSlots.length - 3} thêm
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer legend */}
          <div className="flex flex-wrap items-center justify-between border-t border-border px-4 py-3">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                Trống
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                Đầy
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
                Đã khóa
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                Đã đăng ký
              </span>
            </div>
            <Badge variant="secondary" className="text-xs font-semibold uppercase">
              {totalSlotsThisMonth} slot trong tháng
            </Badge>
          </div>
        </Card>

        {/* Right panel — Review Summary */}
        <div className="space-y-4">
          {selectedSlot ? (
            <SlotDetailPanel
              slot={selectedSlot}
              round={activeRound}
              group={group}
              isRegistered={
                groupRegistration?.slot_id === selectedSlot.slot_id
              }
              hasOtherRegistration={Boolean(
                groupRegistration &&
                  groupRegistration.slot_id !== selectedSlot.slot_id,
              )}
              onRegister={() =>
                setRegisterDialog({ slot_id: selectedSlot.slot_id })
              }
              onCancel={() => {
                if (groupRegistration) {
                  setCancelDialog({
                    registration_id: groupRegistration.registration_id,
                  })
                }
              }}
              isRoundOpen={activeRound?.status === 'OPEN'}
            />
          ) : (
            <Card className="rounded-xl p-6 shadow-sm">
              <div className="flex flex-col items-center gap-3 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Chọn một ngày trên lịch để xem chi tiết slot
                </p>
              </div>
            </Card>
          )}

          {/* Pro-tip */}
          <Card className="rounded-xl border-primary/20 bg-primary/5 p-4 shadow-sm">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <div className="text-sm font-semibold text-primary">Mẹo</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Chọn slot sớm để đảm bảo có chỗ trống. Các slot buổi chiều
                  thường có thời gian phản hồi thoải mái hơn.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={Boolean(registerDialog)}
        onClose={() => setRegisterDialog(null)}
        onConfirm={() => void onConfirmRegister()}
        title="Xác nhận đăng ký slot"
        description={
          registerDialog
            ? (() => {
                const slot = slots.find(
                  (s) => s.slot_id === registerDialog.slot_id,
                )
                if (!slot) return 'Bạn có chắc chắn muốn đăng ký slot này?'
                return `Xác nhận đăng ký slot ${fmtTime(slot.start_time)} - ${fmtTime(slot.end_time)} phòng ${slot.room}?`
              })()
            : undefined
        }
        confirmLabel="Xác nhận đăng ký"
        isLoading={registerMutation.isPending}
      />

      <ConfirmDialog
        isOpen={Boolean(cancelDialog)}
        onClose={() => setCancelDialog(null)}
        onConfirm={() => void onConfirmCancel()}
        title="Xác nhận hủy đăng ký"
        description="Bạn có chắc chắn muốn hủy đăng ký slot này không?"
        confirmLabel="Xác nhận hủy"
        confirmVariant="destructive"
        isLoading={cancelMutation.isPending}
      />
    </div>
      </TabsContent>
    </Tabs>
  )
}

/* ---------- Slot Detail Panel ---------- */

function SlotDetailPanel({
  slot,
  round: _round,
  group: _group,
  isRegistered,
  hasOtherRegistration,
  onRegister,
  onCancel,
  isRoundOpen,
}: {
  slot: SlotWithDetails
  round: ReviewRound | null
  group: { group_id: number; group_name: string; project_title: string }
  isRegistered: boolean
  hasOtherRegistration: boolean
  onRegister: () => void
  onCancel: () => void
  isRoundOpen: boolean
}) {
  const canRegister =
    isRoundOpen &&
    !isRegistered &&
    !hasOtherRegistration &&
    slot.status === 'OPEN'

  return (
    <Card className="overflow-hidden rounded-xl shadow-sm">
      {/* Header image / room */}
      <div className="relative bg-linear-to-br from-primary/80 to-primary px-4 py-6">
        <div className="flex items-center gap-2 text-primary-foreground">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-semibold">{slot.room}</span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <h3 className="font-sora text-lg font-bold text-foreground">
          Chi tiết Slot
        </h3>

        {/* Date & time */}
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              Ngày & giờ
            </div>
            <div className="text-sm font-medium text-foreground">
              {fmtDateLocale(slot.start_time)}
            </div>
            <div className="text-sm text-muted-foreground">
              {fmtTime(slot.start_time)} - {fmtTime(slot.end_time)}
            </div>
          </div>
        </div>

        {/* Reviewers */}
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              GV Phản biện
            </div>
            <div className="text-sm font-medium text-foreground">
              {slot.registered_reviewers.length > 0
                ? slot.registered_reviewers.map((u) => u.full_name).join(', ')
                : 'Chưa có'}
            </div>
            {slot.registered_reviewers.length > 0 ? (
              <div className="text-xs text-muted-foreground">
                {slot.registered_reviewers.length} giảng viên
              </div>
            ) : null}
          </div>
        </div>

        {/* Capacity */}
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              Sức chứa
            </div>
            <div className="text-sm font-medium text-foreground">
              {slot.current_group_count}/{slot.max_groups} nhóm
            </div>
            {slot.registered_groups.length > 0 ? (
              <div className="text-xs text-muted-foreground">
                {slot.registered_groups.map((g) => g.group_name).join(', ')}
              </div>
            ) : null}
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant={
              isRegistered
                ? 'default'
                : slot.status === 'OPEN'
                  ? 'secondary'
                  : 'outline'
            }
            className={cn(
              isRegistered &&
                'bg-green-600 text-white hover:bg-green-700 dark:bg-green-700',
              slot.status === 'FULL' &&
                !isRegistered &&
                'border-red-300 text-red-600 dark:border-red-700 dark:text-red-400',
              slot.status === 'LOCKED' &&
                'border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400',
            )}
          >
            {isRegistered
              ? 'Đã đăng ký'
              : slot.status === 'OPEN'
                ? 'Còn trống'
                : slot.status === 'FULL'
                  ? 'Đã đầy'
                  : 'Đã khóa'}
          </Badge>
        </div>

        {/* Action button */}
        {canRegister ? (
          <Button
            type="button"
            className="w-full rounded-full"
            size="lg"
            onClick={onRegister}
          >
            Xác nhận đăng ký
          </Button>
        ) : isRegistered && isRoundOpen ? (
          <Button
            type="button"
            variant="destructive"
            className="w-full rounded-full"
            size="lg"
            onClick={onCancel}
          >
            Hủy đăng ký
          </Button>
        ) : hasOtherRegistration ? (
          <p className="text-center text-xs text-muted-foreground">
            Nhóm bạn đã đăng ký slot khác trong round này.
          </p>
        ) : null}

        {canRegister ? (
          <p className="text-center text-[11px] text-muted-foreground">
            Tuân theo quy định và chính sách điểm danh bắt buộc.
          </p>
        ) : null}
      </div>
    </Card>
  )
}

/* ---------- Slot Booking Page (inline) ---------- */

type BookingSlotState = 'available' | 'nearly-full' | 'full' | 'locked'

function getSlotState(slot: SlotWithDetails): BookingSlotState {
  if (slot.status === 'LOCKED' || slot.status === 'CANCELLED') return 'locked'
  if (slot.status === 'FULL' || slot.current_group_count >= slot.max_groups) return 'full'
  if (slot.current_group_count >= slot.max_groups - 1) return 'nearly-full'
  return 'available'
}

function BookingStateBadge({ state }: { state: BookingSlotState }) {
  if (state === 'full')
    return <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive gap-1"><XCircle className="size-3" /> Full</Badge>
  if (state === 'nearly-full')
    return <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1"><AlertTriangle className="size-3" /> Gần đầy</Badge>
  if (state === 'locked')
    return <Badge variant="outline" className="border-muted-foreground/30 bg-muted text-muted-foreground gap-1">Đã khóa</Badge>
  return <Badge variant="outline" className="border-green-600/30 bg-green-600/10 text-green-600 dark:text-green-400 gap-1"><CheckCircle2 className="size-3" /> Available</Badge>
}

function BookingOccupancyBar({ current, max }: { current: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((current / max) * 100)
  const color = pct >= 100 ? 'bg-destructive' : pct >= 67 ? 'bg-amber-500' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2 min-w-20">
      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">{current}/{max}</span>
    </div>
  )
}

export function SlotBookingPage() {
  const { currentUser } = useAuthStore()

  const activeSemesterQuery = useActiveSemester()
  const activeSemester = activeSemesterQuery.data ?? null
  const roundsQuery = useRounds(activeSemester?.semester_id ?? 0)
  const rounds = roundsQuery.data ?? []

  const firstOpenRoundId = useMemo(
    () => rounds.find((r) => r.status === 'OPEN')?.round_id ?? 0,
    [rounds],
  )
  const [selectedRoundId, setSelectedRoundId] = useState(0)

  useEffect(() => {
    if (selectedRoundId > 0) return
    if (firstOpenRoundId > 0) { setSelectedRoundId(firstOpenRoundId); return }
    if (rounds.length > 0) setSelectedRoundId(rounds[0].round_id)
  }, [firstOpenRoundId, rounds, selectedRoundId])

  const activeRound = useMemo(
    () => rounds.find((r) => r.round_id === selectedRoundId) ?? null,
    [rounds, selectedRoundId],
  )

  const slotsQuery = useSlotsForRound(selectedRoundId)
  useSlotSignalR(selectedRoundId)
  const slots = slotsQuery.data ?? []

  const studentGroupQuery = useStudentGroup(currentUser?.user_id ?? 0)
  const group = studentGroupQuery.data?.group ?? null

  const groupRegsQuery = useGroupRegistrations(group?.group_id ?? 0)
  const groupRegistration = useMemo(() => {
    if (!group || !activeRound) return null
    const regs = groupRegsQuery.data ?? []
    return (
      regs.find((r) => {
        if (r.status !== 'REGISTERED') return false
        const slot = slots.find((s) => s.slot_id === r.slot_id)
        return slot ? slot.round_id === activeRound.round_id : false
      }) ?? null
    )
  }, [group, activeRound, groupRegsQuery.data, slots])

  const registeredSlot = useMemo(
    () => slots.find((s) => s.slot_id === groupRegistration?.slot_id) ?? null,
    [slots, groupRegistration],
  )

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [roomFilter, setRoomFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [registerDialog, setRegisterDialog] = useState<{ slot_id: number } | null>(null)
  const [cancelDialog, setCancelDialog] = useState<{ registration_id: number } | null>(null)

  const registerMutation = useRegisterGroupSlot()
  const cancelMutation = useCancelGroupRegistration()

  const dateStr = format(selectedDate, 'yyyy-MM-dd')
  const allRooms = useMemo(() => Array.from(new Set(slots.map((s) => s.room))).sort(), [slots])
  const slotDates = useMemo(() => slots.map((s) => parseISO(s.start_time)), [slots])

  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      const slotDate = format(parseISO(s.start_time), 'yyyy-MM-dd')
      if (slotDate !== dateStr) return false
      const state = getSlotState(s)
      if (onlyAvailable && state !== 'available' && state !== 'nearly-full') return false
      if (roomFilter !== 'all' && s.room !== roomFilter) return false
      return true
    })
  }, [slots, dateStr, onlyAvailable, roomFilter])

  function toggleExpand(id: number) { setExpandedId((prev) => (prev === id ? null : id)) }

  const onConfirmRegister = async () => {
    if (!group || !currentUser || !registerDialog) return
    try {
      await registerMutation.mutateAsync({
        group_id: group.group_id,
        slot_id: registerDialog.slot_id,
        registered_by: currentUser.user_id,
      })
      setRegisterDialog(null)
    } catch {
      // handled by hook
    }
  }

  const onConfirmCancel = async () => {
    if (!cancelDialog) return
    try {
      await cancelMutation.mutateAsync({ registration_id: cancelDialog.registration_id })
      setCancelDialog(null)
    } catch {
      // handled by hook
    }
  }

  const isRoundOpen = activeRound?.status === 'OPEN'

  return (
    <div className="space-y-4">
      {/* Banner */}
      {registeredSlot ? (
        <Card className="border-primary/30 bg-primary/5">
          <div className="py-3 px-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <CheckCircle2 className="size-5 text-primary shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-primary">Bạn đã đăng ký slot</p>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{fmtTime(registeredSlot.start_time)} – {fmtTime(registeredSlot.end_time)}</span>{' · '}
                <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{registeredSlot.room}</span>{' · '}
                {fmtDate(registeredSlot.start_time)}
              </p>
            </div>
            {isRoundOpen && groupRegistration ? (
              <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setCancelDialog({ registration_id: groupRegistration.registration_id })}>
                <XCircle className="size-4 mr-1" /> Hủy đăng ký
              </Button>
            ) : null}
          </div>
        </Card>
      ) : (
        <Card className="border-muted bg-muted/30">
          <div className="py-3 px-4 flex items-center gap-3">
            <CalendarDays className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Bạn chưa đăng ký slot nào.</p>
          </div>
        </Card>
      )}

      {/* 2-column layout */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Mini Calendar */}
        <Card className="w-full lg:w-auto shrink-0">
          <div className="pb-1 pt-4 px-4">
            <p className="text-sm font-semibold flex items-center gap-2"><CalendarDays className="size-4 text-primary" /> Chọn ngày</p>
          </div>
          <div className="p-2 pt-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d: Date | undefined) => d && setSelectedDate(d)}
              modifiers={{ hasSlot: slotDates }}
              modifiersClassNames={{ hasSlot: 'after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-primary' }}
              className="rounded-md"
            />
            <Separator className="my-2" />
            <p className="text-xs text-center text-muted-foreground pb-1">Chấm = có slot</p>
          </div>
        </Card>

        {/* Slot list */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Filters */}
          <Card>
            <div className="py-3 px-4 flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" />
                <Select value={roomFilter} onValueChange={setRoomFilter}>
                  <SelectTrigger className="h-8 w-40 text-sm"><SelectValue placeholder="Tất cả phòng" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả phòng</SelectItem>
                    {allRooms.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} className="size-4 accent-primary rounded" />
                <span className="text-muted-foreground">Chỉ còn chỗ</span>
              </label>
              <span className="ml-auto text-sm font-medium text-muted-foreground">
                {format(selectedDate, 'EEEE, dd MMM yyyy', { locale: vi })}
              </span>
            </div>
          </Card>

          {/* Table */}
          <Card>
            <div className="p-0">
              {slotsQuery.isLoading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <span className="text-sm">Đang tải slot...</span>
                </div>
              ) : filteredSlots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <CalendarDays className="size-8 opacity-40" />
                  <p className="text-sm">Không có slot nào cho ngày / bộ lọc này.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-36"><span className="flex items-center gap-1"><Clock className="size-3.5" /> Giờ</span></TableHead>
                      <TableHead><span className="flex items-center gap-1"><MapPin className="size-3.5" /> Phòng</span></TableHead>
                      <TableHead className="w-32"><span className="flex items-center gap-1"><Users className="size-3.5" /> Nhóm</span></TableHead>
                      <TableHead className="hidden md:table-cell">Reviewers</TableHead>
                      <TableHead className="w-28">Trạng thái</TableHead>
                      <TableHead className="w-28 text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSlots.map((slot) => {
                      const state = getSlotState(slot)
                      const isExpanded = expandedId === slot.slot_id
                      const isRegistered = groupRegistration?.slot_id === slot.slot_id
                      const canBook = isRoundOpen && !groupRegistration && (state === 'available' || state === 'nearly-full')
                      return (
                        <>
                          <TableRow
                            key={slot.slot_id}
                            className={cn('cursor-pointer transition-colors', isExpanded && 'bg-muted/40', isRegistered && 'bg-primary/5')}
                            onClick={() => toggleExpand(slot.slot_id)}
                          >
                            <TableCell className="font-medium text-sm">
                              <div className="flex items-center gap-1.5">
                                {isRegistered && <span className="size-2 rounded-full bg-primary shrink-0" />}
                                {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{slot.room}</TableCell>
                            <TableCell><BookingOccupancyBar current={slot.current_group_count} max={slot.max_groups} /></TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="flex flex-wrap gap-1">
                                {slot.registered_reviewers.slice(0, 2).map((r) => (
                                  <Badge key={r.user_id} variant="secondary" className="text-xs">{r.full_name.split(' ').at(-1)}</Badge>
                                ))}
                                {slot.registered_reviewers.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">+{slot.registered_reviewers.length - 2}</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell><BookingStateBadge state={state} /></TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                {isRegistered ? (
                                  isRoundOpen ? (
                                    <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setCancelDialog({ registration_id: groupRegistration!.registration_id })}>Hủy</Button>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">Đã đăng ký</Badge>
                                  )
                                ) : canBook ? (
                                  <Button
                                    size="sm"
                                    className={cn('h-7 text-xs', state === 'nearly-full' && 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500')}
                                    onClick={() => setRegisterDialog({ slot_id: slot.slot_id })}
                                  >
                                    Đăng ký
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="outline" className="h-7 text-xs" disabled>
                                    {state === 'full' ? 'Đầy' : state === 'locked' ? 'Khóa' : '—'}
                                  </Button>
                                )}
                                <Button size="icon" variant="ghost" className="size-7" onClick={(e) => { e.stopPropagation(); toggleExpand(slot.slot_id) }}>
                                  {isExpanded ? <ChevronLeft className="size-3.5 rotate-90" /> : <ChevronRight className="size-3.5 rotate-90" />}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${slot.slot_id}-detail`} className="hover:bg-transparent">
                              <TableCell colSpan={6} className="p-0">
                                <div className="px-4 py-3 bg-muted/30 border-t space-y-3">
                                  <div className="flex flex-wrap gap-2 items-center">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-1 flex items-center gap-1"><Users className="size-3.5" /> Reviewers</span>
                                    {slot.registered_reviewers.length === 0
                                      ? <span className="text-xs text-muted-foreground italic">Chưa có reviewer</span>
                                      : slot.registered_reviewers.map((r) => <Badge key={r.user_id} variant="secondary" className="text-xs">{r.full_name}</Badge>)
                                    }
                                  </div>
                                  <div>
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-2"><BookOpen className="size-3.5" /> Nhóm đã đăng ký</span>
                                    {slot.registered_groups.length === 0
                                      ? <p className="text-xs text-muted-foreground italic pl-1">Chưa có nhóm đăng ký.</p>
                                      : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                          {slot.registered_groups.map((g) => (
                                            <div key={g.group_id} className="rounded-lg border bg-background px-3 py-2 text-xs">
                                              <p className="font-semibold">{g.group_name}</p>
                                              <p className="text-muted-foreground truncate">{g.project_title}</p>
                                            </div>
                                          ))}
                                        </div>
                                    }
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground px-1">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-green-500" /> Còn chỗ</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" /> Gần đầy</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-destructive" /> Đầy</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> Slot của bạn</span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!registerDialog}
        onClose={() => setRegisterDialog(null)}
        title="Xác nhận đăng ký slot?"
        description="Nhóm bạn sẽ được đăng ký slot này. Bạn có thể hủy trước khi round đóng."
        confirmLabel="Đăng ký"
        onConfirm={onConfirmRegister}
        isLoading={registerMutation.isPending}
      />
      <ConfirmDialog
        isOpen={!!cancelDialog}
        onClose={() => setCancelDialog(null)}
        title="Hủy đăng ký slot?"
        description="Nhóm bạn sẽ mất vị trí trong slot này."
        confirmLabel="Hủy đăng ký"
        confirmVariant="destructive"
        onConfirm={onConfirmCancel}
        isLoading={cancelMutation.isPending}
      />
    </div>
  )
}
