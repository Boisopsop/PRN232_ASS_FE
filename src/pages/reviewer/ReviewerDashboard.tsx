/**
 * Dashboard cho giảng viên review: thống kê theo round và danh sách slot đã đăng ký.
 */
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format, isValid, parseISO } from 'date-fns'
import { Loader2 } from 'lucide-react'

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
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useRounds } from '@/hooks/useRounds'
import { useCancelReviewerRegistration } from '@/hooks/useReviewer'
import { mockDb, mockGroups } from '@/lib/mock'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

function safeFormat(value: string, pattern: string): string {
  const d = parseISO(value)
  if (!isValid(d)) return value
  return format(d, pattern)
}

function getProgressClass(current: number, min: number): string {
  if (min <= 0) return current > 0 ? 'w-full bg-green-600' : 'w-0 bg-green-600'
  const ratio = current / min
  if (ratio <= 0) return 'w-0 bg-destructive'
  if (ratio < 0.34) return 'w-1/4 bg-destructive'
  if (ratio < 0.67) return 'w-1/2 bg-amber-600'
  if (ratio < 1) return 'w-3/4 bg-amber-600'
  return 'w-full bg-green-600'
}

export function ReviewerDashboard() {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const roundsQuery = useRounds(1)
  const cancelMutation = useCancelReviewerRegistration()

  const registrationsQuery = useQuery({
    queryKey: ['reviewer-registrations', currentUser?.user_id],
    queryFn: async () => {
      if (!currentUser) return []
      return mockDb.reviewerRegistrations.filter((r) => r.reviewer_id === currentUser.user_id)
    },
    enabled: Boolean(currentUser),
  })

  const configQuery = useQuery({
    queryKey: ['reviewer-configs'],
    queryFn: async () => mockDb.configs.slice(),
  })

  const rounds = roundsQuery.data ?? []
  const registrations = registrationsQuery.data ?? []
  const configs = configQuery.data ?? []

  const statsByRound = useMemo(() => {
    return rounds.map((round) => {
      const config = configs.find((c) => c.round_id === round.round_id)
      const minSlots = config?.min_slots ?? 0
      const maxSlots = config?.max_slots ?? 0

      const registeredCount = registrations.filter((reg) => {
        if (reg.status !== 'REGISTERED') return false
        const slot = mockDb.slots.find((s) => s.slot_id === reg.slot_id)
        return slot ? slot.round_id === round.round_id : false
      }).length

      const missing = Math.max(0, minSlots - registeredCount)
      const statusLabel =
        registeredCount < minSlots
          ? `Cần đăng ký thêm ${missing} slot ⚠️`
          : registeredCount === minSlots
            ? 'Đủ tối thiểu ✓'
            : 'Hoàn thành ✓'

      const statusClass =
        registeredCount < minSlots
          ? 'text-destructive'
          : registeredCount === minSlots
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-green-600 dark:text-green-400'

      return {
        round,
        minSlots,
        maxSlots,
        registeredCount,
        missing,
        statusLabel,
        statusClass,
      }
    })
  }, [configs, registrations, rounds])

  const warnings = useMemo(() => {
    return statsByRound.filter((s) => s.round.status === 'OPEN' && s.registeredCount < s.minSlots)
  }, [statsByRound])

  const groupedRegistrations = useMemo(() => {
    return rounds.map((round) => {
      const rows = registrations
        .filter((reg) => reg.status === 'REGISTERED')
        .map((reg) => {
          const slot = mockDb.slots.find((s) => s.slot_id === reg.slot_id)
          if (!slot || slot.round_id !== round.round_id) return null
          const groupNames = mockDb.groupRegistrations
            .filter((gr) => gr.slot_id === slot.slot_id && gr.status === 'REGISTERED')
            .map((gr) => mockGroups.find((g) => g.group_id === gr.group_id)?.group_name)
            .filter((name): name is string => Boolean(name))
          return {
            reg,
            slot,
            groupNames,
          }
        })
        .filter((v): v is NonNullable<typeof v> => Boolean(v))

      return { round, rows }
    })
  }, [registrations, rounds, cancelMutation.isSuccess])

  if (!currentUser) return null

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/70 p-6 text-primary-foreground shadow-sm">
        <h1 className="font-sora text-2xl font-bold">Xin chào, GV {currentUser.full_name}</h1>
        <div className="mt-3">
          <Badge className="rounded-lg border-primary-foreground/25 bg-card/10 text-primary-foreground" variant="outline">
            Giảng viên Review
          </Badge>
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {statsByRound.map((item) => (
          <Card key={item.round.round_id} className="rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-bold text-foreground">{item.round.round_name}</div>
              <StatusBadge status={item.round.status} size="sm" />
            </div>

            <div className="mt-3 text-3xl font-bold text-foreground">{item.registeredCount}</div>
            <div className="mt-1 text-xs text-muted-foreground">slot đã đăng ký</div>

            <div className="mt-3 text-xs text-muted-foreground">
              Min yêu cầu: <b>{item.minSlots}</b> slot
            </div>
            <div className="text-xs text-muted-foreground">
              Tối đa: <b>{item.maxSlots}</b> slot
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
              <div className={cn('h-2 transition-all duration-200', getProgressClass(item.registeredCount, item.minSlots))} />
            </div>

            <div className={cn('mt-3 text-sm font-semibold', item.statusClass)}>{item.statusLabel}</div>

            {item.registeredCount < item.minSlots ? (
              <button
                type="button"
                className="mt-2 text-sm font-semibold text-primary transition-all duration-150 hover:text-primary"
                onClick={() => navigate('/reviewer/register')}
              >
                Đăng ký thêm →
              </button>
            ) : null}
          </Card>
        ))}
      </section>

      {warnings.length > 0 ? (
        <section className="space-y-3">
          {warnings.map((w) => (
            <Card
              key={w.round.round_id}
              className="rounded-xl border border-amber-600/25 bg-amber-600/10 p-4 shadow-sm"
            >
              <div className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                ⚠️ Round {w.round.round_number}: Bạn cần đăng ký thêm {w.missing} slot trước{' '}
                {safeFormat(w.round.registration_close_at, 'dd/MM/yyyy')}
              </div>
            </Card>
          ))}
        </section>
      ) : null}

      <Card className="rounded-xl p-5 shadow-sm">
        <h2 className="font-sora text-lg font-bold text-foreground">Slot đã đăng ký</h2>

        <div className="mt-4 space-y-3">
          {groupedRegistrations.map(({ round, rows }) => (
            <details key={round.round_id} open className="rounded-lg border border-border bg-card">
              <summary className="cursor-pointer list-none rounded-lg px-4 py-3 text-sm font-semibold text-foreground">
                {round.round_name} ({rows.length} slot)
              </summary>
              <div className="overflow-x-auto px-2 pb-3">
                {rows.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-muted-foreground">Chưa có slot đã đăng ký.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Round</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Giờ</TableHead>
                        <TableHead>Phòng</TableHead>
                        <TableHead>Nhóm tham gia</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.reg.reviewer_registration_id}>
                          <TableCell>{round.round_name}</TableCell>
                          <TableCell>{safeFormat(row.slot.start_time, 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            {safeFormat(row.slot.start_time, 'HH:mm')} - {safeFormat(row.slot.end_time, 'HH:mm')}
                          </TableCell>
                          <TableCell>{row.slot.room}</TableCell>
                          <TableCell>{row.groupNames.length > 0 ? row.groupNames.join(', ') : '—'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={cancelMutation.isPending}
                              onClick={() =>
                                cancelMutation.mutate({
                                  reviewer_registration_id: row.reg.reviewer_registration_id,
                                })
                              }
                            >
                              {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                              Hủy đăng ký
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </details>
          ))}
        </div>
      </Card>
    </div>
  )
}

