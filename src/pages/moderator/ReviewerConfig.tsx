/**
 * Trang cấu hình min/max slot của GV Review cho từng round.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, PencilLine } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRounds } from '@/hooks/useRounds'
import { useActiveSemester } from '@/hooks/useActiveSemester'
import { useAllUsers } from '@/hooks/useAllUsers'
import { getReviewerConfig, getSlotsForRound, updateReviewerConfig } from '@/lib/api'
import { cn } from '@/lib/utils'

const configSchema = z
  .object({
    min_slots: z.coerce.number().min(1, 'Min slots phải >= 1'),
    max_slots: z.coerce.number().min(1, 'Max slots phải >= 1'),
  })
  .superRefine((values, ctx) => {
    if (values.max_slots < values.min_slots) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['max_slots'],
        message: 'Max slots phải lớn hơn hoặc bằng Min slots',
      })
    }
  })

type ConfigValues = z.infer<typeof configSchema>

function countReviewerRegistrationsForRound(slots: Awaited<ReturnType<typeof getSlotsForRound>>, reviewerId: number): number {
  return slots.filter((slot) => slot.registered_reviewers.some((r) => r.user_id === reviewerId)).length
}

export function ReviewerConfig() {
  const qc = useQueryClient()
  const activeSemesterQuery = useActiveSemester()
  const semesterId = activeSemesterQuery.data?.semester_id ?? 0
  const roundsQuery = useRounds(semesterId)
  const rounds = roundsQuery.data ?? []
  const allUsersQuery = useAllUsers('GV_REVIEW')
  const reviewers = allUsersQuery.data ?? []
  const [editingRoundId, setEditingRoundId] = React.useState<number | null>(null)
  const [expandedRoundIds, setExpandedRoundIds] = React.useState<number[]>([])

  const configsQuery = useQuery({
    queryKey: ['reviewer-configs', rounds.map((r) => r.round_id).join('-')],
    enabled: rounds.length > 0,
    queryFn: async () => {
      const configEntries = await Promise.all(
        rounds.map(async (round) => {
          const config = await getReviewerConfig(round.round_id)
          return [round.round_id, config] as const
        }),
      )
      return new Map(configEntries)
    },
  })

  const slotsByRoundQuery = useQuery({
    queryKey: ['reviewer-config-slots-by-round', rounds.map((r) => r.round_id).join('-')],
    enabled: rounds.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        rounds.map(async (round) => {
          const slots = await getSlotsForRound(round.round_id)
          return [round.round_id, slots] as const
        }),
      )
      return new Map(entries)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (vars: { round_id: number; min_slots: number; max_slots: number }) =>
      updateReviewerConfig(vars.round_id, vars.min_slots, vars.max_slots),
    onSuccess: () => {
      toast.success('Cập nhật cấu hình thành công')
      void qc.invalidateQueries({ queryKey: ['reviewer-config'] })
      void qc.invalidateQueries({ queryKey: ['reviewer-configs'] })
      void qc.invalidateQueries({ queryKey: ['reviewer-config-slots-by-round'] })
    },
  })

  const form = useForm<ConfigValues>({
    resolver: zodResolver(configSchema),
    defaultValues: { min_slots: 1, max_slots: 3 },
  })

  const lastUpdated = React.useMemo(() => {
    const map = configsQuery.data
    if (!map || map.size === 0) return '---'
    const latest = [...map.values()]
      .map((config) => config.updated_at)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
    return new Date(latest).toLocaleString('vi-VN')
  }, [configsQuery.data])

  const overviewRows = React.useMemo(() => {
    const configMap = configsQuery.data
    const slotsMap = slotsByRoundQuery.data
    if (!configMap || !slotsMap) return []
    return reviewers.map((reviewer) => {
      const perRound = rounds.map((round) => {
        const slots = slotsMap.get(round.round_id) ?? []
        const current = countReviewerRegistrationsForRound(slots, reviewer.user_id)
        const min = configMap.get(round.round_id)?.min_slots ?? 0
        return { roundId: round.round_id, current, min }
      })
      return { reviewer, perRound }
    })
  }, [configsQuery.data, slotsByRoundQuery.data, reviewers, rounds])

  const onEditRound = (roundId: number) => {
    const current = configsQuery.data?.get(roundId)
    if (!current) return
    form.reset({ min_slots: current.min_slots, max_slots: current.max_slots })
    setEditingRoundId(roundId)
  }

  const onSubmitEdit = form.handleSubmit(async (values) => {
    if (!editingRoundId) return
    await updateMutation.mutateAsync({
      round_id: editingRoundId,
      min_slots: values.min_slots,
      max_slots: values.max_slots,
    })
    setEditingRoundId(null)
  })

  const toggleExpand = (roundId: number) => {
    setExpandedRoundIds((prev) =>
      prev.includes(roundId) ? prev.filter((id) => id !== roundId) : [...prev, roundId],
    )
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-sora text-xl font-bold text-foreground">Cấu hình GV Review</h1>
          <div className="text-sm text-muted-foreground">Cập nhật gần nhất: {lastUpdated}</div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {rounds.map((round) => {
          const config = configsQuery.data?.get(round.round_id)
          const slots = slotsByRoundQuery.data?.get(round.round_id) ?? []
          const expanded = expandedRoundIds.includes(round.round_id)
          const isEditing = editingRoundId === round.round_id
          const minValue = isEditing ? form.watch('min_slots') : (config?.min_slots ?? 0)

          return (
            <Card key={round.round_id} className="rounded-xl p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="font-sora text-base font-semibold text-foreground">
                  Cấu hình {round.round_name}
                </h2>
                <StatusBadge status={round.status} size="sm" />
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{config?.min_slots ?? '-'}</div>
                  <div className="text-xs text-muted-foreground">slot tối thiểu</div>
                </div>
                <div className="rounded-lg border border-secondary/30 bg-secondary/30 p-3 text-center">
                  <div className="text-2xl font-bold text-secondary-foreground">{config?.max_slots ?? '-'}</div>
                  <div className="text-xs text-muted-foreground">slot tối đa</div>
                </div>
              </div>

              {isEditing ? (
                <form className="space-y-3 rounded-lg border p-3" onSubmit={onSubmitEdit}>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Min slots</label>
                    <Input type="number" min={1} {...form.register('min_slots')} />
                    {form.formState.errors.min_slots ? (
                      <p className="text-xs text-destructive">{form.formState.errors.min_slots.message}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Max slots</label>
                    <Input type="number" min={1} {...form.register('max_slots')} />
                    {form.formState.errors.max_slots ? (
                      <p className="text-xs text-destructive">{form.formState.errors.max_slots.message}</p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingRoundId(null)}>
                      Hủy
                    </Button>
                  </div>
                </form>
              ) : (
                <Button type="button" size="sm" variant="outline" onClick={() => onEditRound(round.round_id)}>
                  <PencilLine className="h-4 w-4" />
                  Chỉnh sửa
                </Button>
              )}

              <div className="mt-4 rounded-lg border border-border bg-black/[0.02] p-3">
                <button
                  type="button"
                  onClick={() => toggleExpand(round.round_id)}
                  className="flex w-full items-center justify-between text-left text-sm font-medium text-foreground"
                >
                  GV Review bị ảnh hưởng
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expanded ? (
                  <div className="mt-3 space-y-2 text-sm">
                    {reviewers.map((reviewer) => {
                      const current = countReviewerRegistrationsForRound(slots, reviewer.user_id)
                      const impacted = current < minValue
                      return (
                        <div
                          key={`${round.round_id}-${reviewer.user_id}`}
                          className={cn(
                            'flex items-center justify-between rounded-md px-2 py-1',
                            impacted ? 'bg-destructive/10 text-destructive' : 'bg-secondary/30 text-secondary-foreground',
                          )}
                        >
                          <span>{reviewer.full_name}</span>
                          <span>{current} slot</span>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="rounded-xl p-5 shadow-sm">
        <h2 className="mb-4 font-sora text-lg font-semibold text-foreground">GV Review Overview</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Giảng viên</TableHead>
              <TableHead>Round 1</TableHead>
              <TableHead>Round 2</TableHead>
              <TableHead>Round 3</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {overviewRows.map((row) => (
              <TableRow key={row.reviewer.user_id}>
                <TableCell className="font-medium">{row.reviewer.full_name}</TableCell>
                {row.perRound.map((cell) => {
                  const ok = cell.current >= cell.min
                  return (
                    <TableCell key={`${row.reviewer.user_id}-${cell.roundId}`}>
                      <Badge
                        variant="outline"
                        className={cn(
                          ok
                            ? 'border-green-600/30 bg-green-600/10 text-green-600 dark:text-green-400'
                            : 'border-destructive/30 bg-destructive/10 text-destructive',
                        )}
                      >
                        {cell.current}/{cell.min} slot
                      </Badge>
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

