/**
 * Dashboard moderator tổng hợp dữ liệu round/slot/reviewer/group.
 */
import { useMemo, useState } from 'react'
import { Bell, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format, isValid, parseISO } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { StatsCard } from '@/components/shared/StatsCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useModeratorDashboard } from '@/hooks/useDashboard'
import { useRounds } from '@/hooks/useRounds'
import { mockGroupMembers, mockSemesters, mockUsers } from '@/lib/mock'
import { sendReminder } from '@/lib/mock/api'
import { cn } from '@/lib/utils'

function safeFormat(value: string, pattern: string): string {
  const d = parseISO(value)
  if (!isValid(d)) return value
  return format(d, pattern)
}

function getProgressClass(ratio: number): string {
  if (ratio <= 0) return 'w-0 bg-destructive'
  if (ratio < 0.35) return 'w-1/4 bg-destructive'
  if (ratio < 0.7) return 'w-1/2 bg-amber-600'
  if (ratio < 1) return 'w-3/4 bg-amber-600'
  return 'w-full bg-green-600'
}

type RowStatus = 'ok' | 'needs-reviewer' | 'empty'

function getRowStatus(hasReviewer: boolean, groupCount: number): RowStatus {
  if (groupCount === 0) return 'empty'
  if (!hasReviewer) return 'needs-reviewer'
  return 'ok'
}

function rowStatusClass(status: RowStatus): string {
  if (status === 'ok') return 'border-l-4 border-l-green-600'
  if (status === 'needs-reviewer') return 'border-l-4 border-l-amber-600'
  return 'border-l-4 border-l-destructive'
}

export function ModeratorDashboard() {
  const roundsQuery = useRounds(1)
  const rounds = roundsQuery.data ?? []

  const [selectedRoundId, setSelectedRoundId] = useState<number>(1)
  const dashboardQuery = useModeratorDashboard(selectedRoundId)

  const [page, setPage] = useState(1)
  const [expandedSlotIds, setExpandedSlotIds] = useState<number[]>([])

  const selectedRound = useMemo(
    () => rounds.find((r) => r.round_id === selectedRoundId) ?? null,
    [rounds, selectedRoundId],
  )
  const semesterName = useMemo(() => {
    if (!selectedRound) return 'Học kỳ'
    const semester = mockSemesters.find((s) => s.semester_id === selectedRound.semester_id)
    return semester?.semester_name ?? 'Học kỳ'
  }, [selectedRound])

  const slotStats = dashboardQuery.data?.slotStats ?? []
  const reviewerStats = dashboardQuery.data?.reviewerStats ?? []
  const groupStats = dashboardQuery.data?.groupStats ?? []

  const totalSlots = slotStats.length
  const fullAssignedSlots = slotStats.filter((s) => s.hasReviewer).length
  const reviewerCompliant = reviewerStats.filter((r) => r.isSufficient).length
  const groupsRegistered = groupStats.filter((g) => g.hasRegistered).length

  const pageSize = 5
  const pageCount = Math.max(1, Math.ceil(slotStats.length / pageSize))
  const pageSafe = Math.min(page, pageCount)
  const paginatedSlots = slotStats.slice((pageSafe - 1) * pageSize, pageSafe * pageSize)

  const toggleExpandSlot = (slot_id: number) => {
    setExpandedSlotIds((prev) =>
      prev.includes(slot_id) ? prev.filter((id) => id !== slot_id) : [...prev, slot_id],
    )
  }

  const reminderMutation = useMutation({
    mutationFn: async (vars: { user_id: number; message: string }) =>
      sendReminder(vars.user_id, vars.message),
  })

  const sendReviewerReminder = async (reviewerName: string, reviewerId: number, roundName: string) => {
    await reminderMutation.mutateAsync({
      user_id: reviewerId,
      message: `Bạn đang thiếu số lượng slot tối thiểu cho ${roundName}. Vui lòng đăng ký bổ sung.`,
    })
    toast.success(`Đã gửi nhắc nhở đến ${reviewerName}`)
  }

  const sendGroupReminder = async (groupName: string, groupId: number, roundName: string) => {
    const memberIds = mockGroupMembers.filter((m) => m.group_id === groupId).map((m) => m.student_id)
    await Promise.all(
      memberIds.map((user_id) =>
        sendReminder(user_id, `Nhóm ${groupName} chưa đăng ký slot cho ${roundName}. Vui lòng xử lý sớm.`),
      ),
    )
    toast.success(`Đã gửi nhắc nhở cho ${groupName}`)
  }

  const onRefresh = async () => {
    await Promise.all([roundsQuery.refetch(), dashboardQuery.refetch()])
    toast.success('Đã làm mới dữ liệu')
  }

  const onChangeRound = (value: string) => {
    const id = Number(value)
    if (!Number.isFinite(id) || id <= 0) return
    setSelectedRoundId(id)
    setPage(1)
    setExpandedSlotIds([])
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-xl p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="font-sora text-xl font-bold text-foreground">Tổng quan — {semesterName}</h1>

          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={String(selectedRoundId)} onValueChange={onChangeRound}>
              <TabsList>
                {rounds.map((r) => (
                  <TabsTrigger key={r.round_id} value={String(r.round_id)}>
                    Round {r.round_number}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Button type="button" variant="outline" onClick={() => void onRefresh()}>
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Tổng slot trong round" value={totalSlots} icon={RefreshCw} />
        <StatsCard title="Slot đã đủ GV" value={fullAssignedSlots} icon={Bell} />
        <StatsCard title="GV Review compliant" value={`${reviewerCompliant}/${reviewerStats.length}`} icon={Bell} />
        <StatsCard title="Nhóm đã đăng ký" value={`${groupsRegistered}/${groupStats.length}`} icon={Bell} />
      </section>

      <Card className="rounded-xl p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-sora text-lg font-bold text-foreground">Trạng thái Slot</h2>
          <Badge variant="outline" className="rounded-lg">
            {totalSlots} slot
          </Badge>
        </div>

        <div className="max-h-[480px] overflow-auto rounded-lg border border-border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>Slot</TableHead>
                <TableHead>Ngày & Giờ</TableHead>
                <TableHead>Phòng</TableHead>
                <TableHead>Nhóm (X/3)</TableHead>
                <TableHead>GV Review</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSlots.map((row) => {
                const status = getRowStatus(row.hasReviewer, row.slot.registered_groups.length)
                const expanded = expandedSlotIds.includes(row.slot.slot_id)
                return (
                  <>
                    <TableRow key={row.slot.slot_id} className={rowStatusClass(status)}>
                      <TableCell className="font-medium">#{row.slot.slot_id}</TableCell>
                      <TableCell>
                        <div>{safeFormat(row.slot.start_time, 'dd/MM/yyyy')}</div>
                        <div className="text-xs text-muted-foreground">
                          {safeFormat(row.slot.start_time, 'HH:mm')} - {safeFormat(row.slot.end_time, 'HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>{row.slot.room}</TableCell>
                      <TableCell>
                        <div className="mb-1 text-xs text-muted-foreground">
                          {row.slot.registered_groups.length}/{row.slot.max_groups}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {row.slot.registered_groups.length === 0 ? (
                            <Badge variant="outline" className="rounded-lg">
                              Trống
                            </Badge>
                          ) : (
                            row.slot.registered_groups.map((g) => (
                              <Badge key={g.group_id} variant="outline" className="rounded-lg bg-card">
                                {g.group_name}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.slot.registered_reviewers.length === 0 ? (
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">⚠️ Chưa có GV</span>
                          ) : (
                            row.slot.registered_reviewers.map((rv) => (
                              <Badge key={rv.user_id} variant="secondary" className="rounded-lg">
                                {rv.full_name}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.slot.status} size="sm" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => toggleExpandSlot(row.slot.slot_id)}
                        >
                          {expanded ? 'Ẩn' : 'Chi tiết'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expanded ? (
                      <TableRow key={`expanded-${row.slot.slot_id}`}>
                        <TableCell colSpan={7}>
                          <div className="space-y-2 py-1">
                            <div className="text-sm font-semibold text-foreground">Danh sách nhóm</div>
                            <div className="text-sm text-muted-foreground">
                              {row.slot.registered_groups.length > 0
                                ? row.slot.registered_groups.map((g) => g.group_name).join(', ')
                                : 'Chưa có nhóm'}
                            </div>
                            <div className="text-sm font-semibold text-foreground">Danh sách GV Review</div>
                            <div className="text-sm text-muted-foreground">
                              {row.slot.registered_reviewers.length > 0
                                ? row.slot.registered_reviewers.map((rv) => rv.full_name).join(', ')
                                : 'Chưa có GV Review'}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pageSafe <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: pageCount }).map((_, idx) => {
            const pageNo = idx + 1
            return (
              <Button
                key={pageNo}
                type="button"
                size="sm"
                variant={pageNo === pageSafe ? 'default' : 'outline'}
                onClick={() => setPage(pageNo)}
              >
                {pageNo}
              </Button>
            )
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={pageSafe >= pageCount}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <Card className="rounded-xl p-5 shadow-sm">
        <h2 className="mb-3 font-sora text-lg font-bold text-foreground">Trạng thái GV Review</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Giảng viên</TableHead>
              <TableHead>Slot đã đăng ký</TableHead>
              <TableHead>Yêu cầu tối thiểu</TableHead>
              <TableHead>Tiến độ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviewerStats.map((r) => {
              const ratio = r.minRequired > 0 ? r.registeredCount / r.minRequired : 1
              const missing = Math.max(0, r.minRequired - r.registeredCount)
              const isBelow = missing > 0
              return (
                <TableRow key={r.reviewer.user_id} className={cn(isBelow ? 'bg-destructive/10' : '')}>
                  <TableCell>{r.reviewer.full_name}</TableCell>
                  <TableCell>{r.registeredCount}</TableCell>
                  <TableCell>{r.minRequired}</TableCell>
                  <TableCell>
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-black/10">
                      <div className={cn('h-2', getProgressClass(ratio))} />
                    </div>
                  </TableCell>
                  <TableCell>
                    {isBelow ? (
                      <span className="text-sm font-semibold text-destructive">⚠️ Thiếu {missing} slot</span>
                    ) : (
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">✅ Đủ</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          onClick={() =>
                            void sendReviewerReminder(
                              r.reviewer.full_name,
                              r.reviewer.user_id,
                              selectedRound?.round_name ?? 'round hiện tại',
                            )
                          }
                          disabled={reminderMutation.isPending}
                        >
                          {reminderMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Bell className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Gửi nhắc nhở</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <Card className="rounded-xl p-5 shadow-sm">
        <h2 className="mb-3 font-sora text-lg font-bold text-foreground">Trạng thái Nhóm SV</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhóm</TableHead>
              <TableHead>Đề tài</TableHead>
              <TableHead>GVHD</TableHead>
              <TableHead>Slot đã đăng ký</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupStats.map((g) => {
              const firstSlot = g.registeredSlots[0]
              const hasSlot = g.hasRegistered
              const gvhdName =
                mockUsers.find((u) => u.user_id === g.group.gvhd_id)?.full_name ?? 'Chưa có GVHD'
              return (
                <TableRow key={g.group.group_id} className={cn(!hasSlot ? 'bg-destructive/10' : '')}>
                  <TableCell className="font-medium">{g.group.group_name}</TableCell>
                  <TableCell>{g.group.project_title}</TableCell>
                  <TableCell>{gvhdName}</TableCell>
                  <TableCell>
                    {firstSlot ? (
                      <Badge variant="outline" className="rounded-lg">
                        {safeFormat(firstSlot.start_time, 'dd/MM HH:mm')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-lg bg-black/5 text-muted-foreground">
                        Chưa đăng ký
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {hasSlot ? (
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">Đã đăng ký</span>
                    ) : (
                      <span className="text-sm font-semibold text-destructive">Chưa đăng ký</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          onClick={() =>
                            void sendGroupReminder(
                              g.group.group_name,
                              g.group.group_id,
                              selectedRound?.round_name ?? 'round hiện tại',
                            )
                          }
                          disabled={reminderMutation.isPending}
                        >
                          {reminderMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Bell className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Gửi nhắc nhở</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

