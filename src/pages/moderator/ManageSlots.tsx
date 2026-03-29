/**
 * Trang moderator quản lý slot: CRUD đơn lẻ và tạo hàng loạt.
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Edit3, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import React from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useRounds } from '@/hooks/useRounds'
import { useSlotsForRound } from '@/hooks/useSlots'
import { createSlot, deleteSlot, updateSlot } from '@/lib/mock/api'
import type { Slot, SlotStatus } from '@/types'

const slotSchema = z
  .object({
    round_id: z.coerce.number().min(1),
    date: z.string().min(1, 'Vui lòng chọn ngày'),
    start_time: z.string().min(1, 'Vui lòng chọn giờ bắt đầu'),
    end_time: z.string().min(1, 'Vui lòng chọn giờ kết thúc'),
    room: z.string().min(1, 'Vui lòng nhập phòng/link'),
    max_groups: z.coerce.number().min(1).max(5),
    min_reviewers: z.coerce.number().min(1),
    max_reviewers: z.coerce.number().min(1),
    status: z.enum(['OPEN', 'FULL', 'LOCKED', 'CANCELLED']),
  })
  .superRefine((values, ctx) => {
    const start = new Date(`${values.date}T${values.start_time}:00`).getTime()
    const end = new Date(`${values.date}T${values.end_time}:00`).getTime()
    if (!(end > start)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_time'],
        message: 'Giờ kết thúc phải sau giờ bắt đầu',
      })
      return
    }
    const minutes = (end - start) / 60000
    if (minutes < 60) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_time'],
        message: 'Khoảng thời gian tối thiểu 60 phút',
      })
    }
    if (values.max_reviewers < values.min_reviewers) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['max_reviewers'],
        message: 'Số GV tối đa phải lớn hơn hoặc bằng tối thiểu',
      })
    }
  })

type SlotFormValues = z.infer<typeof slotSchema>

const bulkSchema = z.object({
  round_id: z.coerce.number().min(1),
  date_from: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
  date_to: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
  room: z.string().min(1, 'Vui lòng nhập phòng/link'),
  max_groups: z.coerce.number().min(1).max(5),
  min_reviewers: z.coerce.number().min(1),
  max_reviewers: z.coerce.number().min(1),
  ranges: z
    .array(
      z.object({
        start_time: z.string().min(1),
        end_time: z.string().min(1),
      }),
    )
    .min(1),
})

type BulkValues = z.infer<typeof bulkSchema>

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

function buildIso(date: string, hhmm: string): string {
  return `${date}T${hhmm}:00`
}

export function ManageSlots() {
  const roundsQuery = useRounds(1)
  const rounds = roundsQuery.data ?? []
  const [selectedRoundId, setSelectedRoundId] = React.useState(1)
  const slotsQuery = useSlotsForRound(selectedRoundId)
  const slots = slotsQuery.data ?? []

  const [slotModalOpen, setSlotModalOpen] = React.useState(false)
  const [bulkModalOpen, setBulkModalOpen] = React.useState(false)
  const [editingSlot, setEditingSlot] = React.useState<Slot | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Slot | null>(null)

  const slotForm = useForm<SlotFormValues>({
    resolver: zodResolver(slotSchema),
    defaultValues: {
      round_id: selectedRoundId,
      date: '',
      start_time: '',
      end_time: '',
      room: '',
      max_groups: 3,
      min_reviewers: 1,
      max_reviewers: 3,
      status: 'OPEN',
    },
  })

  const bulkForm = useForm<BulkValues>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      round_id: selectedRoundId,
      date_from: '',
      date_to: '',
      room: '',
      max_groups: 3,
      min_reviewers: 1,
      max_reviewers: 3,
      ranges: [{ start_time: '08:00', end_time: '09:30' }],
    },
  })

  const rangeFieldArray = useFieldArray({
    control: bulkForm.control,
    name: 'ranges',
  })

  const createMutation = useMutation({
    mutationFn: (data: Omit<Slot, 'slot_id' | 'current_group_count'>) => createSlot(data),
    onSuccess: () => {
      toast.success('Tạo slot thành công')
      void slotsQuery.refetch()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (vars: { slot_id: number; data: Partial<Slot> }) => updateSlot(vars.slot_id, vars.data),
    onSuccess: () => {
      toast.success('Cập nhật slot thành công')
      void slotsQuery.refetch()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (slot_id: number) => deleteSlot(slot_id),
    onSuccess: () => {
      toast.success('Đã xóa slot')
      void slotsQuery.refetch()
    },
  })

  const openCreateModal = () => {
    setEditingSlot(null)
    slotForm.reset({
      round_id: selectedRoundId,
      date: '',
      start_time: '',
      end_time: '',
      room: '',
      max_groups: 3,
      min_reviewers: 1,
      max_reviewers: 3,
      status: 'OPEN',
    })
    setSlotModalOpen(true)
  }

  const openEditModal = (slot: Slot) => {
    setEditingSlot(slot)
    slotForm.reset({
      round_id: slot.round_id,
      date: slot.start_time.slice(0, 10),
      start_time: slot.start_time.slice(11, 16),
      end_time: slot.end_time.slice(11, 16),
      room: slot.room,
      max_groups: slot.max_groups,
      min_reviewers: slot.min_reviewers,
      max_reviewers: slot.max_reviewers,
      status: slot.status,
    })
    setSlotModalOpen(true)
  }

  const submitSlot = slotForm.handleSubmit(async (values) => {
    const payload: Omit<Slot, 'slot_id' | 'current_group_count'> = {
      round_id: values.round_id,
      start_time: buildIso(values.date, values.start_time),
      end_time: buildIso(values.date, values.end_time),
      room: values.room,
      max_groups: values.max_groups,
      min_reviewers: values.min_reviewers,
      max_reviewers: values.max_reviewers,
      status: values.status as SlotStatus,
      created_by: 8,
    }

    if (editingSlot) {
      await updateMutation.mutateAsync({
        slot_id: editingSlot.slot_id,
        data: payload,
      })
    } else {
      await createMutation.mutateAsync(payload)
    }

    setSlotModalOpen(false)
    setEditingSlot(null)
  })

  const previewBulkSlots = React.useMemo(() => {
    const vals = bulkForm.getValues()
    if (!vals.date_from || !vals.date_to) return []

    const from = new Date(vals.date_from)
    const to = new Date(vals.date_to)
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return []

    const dates: string[] = []
    const cursor = new Date(from)
    while (cursor <= to) {
      const y = cursor.getFullYear()
      const m = String(cursor.getMonth() + 1).padStart(2, '0')
      const d = String(cursor.getDate()).padStart(2, '0')
      dates.push(`${y}-${m}-${d}`)
      cursor.setDate(cursor.getDate() + 1)
    }

    return dates.flatMap((date) =>
      vals.ranges.map((r) => ({
        date,
        start: r.start_time,
        end: r.end_time,
      })),
    )
  }, [bulkForm.watch()])

  const submitBulk = bulkForm.handleSubmit(async (values) => {
    const from = new Date(values.date_from)
    const to = new Date(values.date_to)
    if (to < from) {
      toast.error('Khoảng ngày không hợp lệ')
      return
    }

    const dates: string[] = []
    const cursor = new Date(from)
    while (cursor <= to) {
      const y = cursor.getFullYear()
      const m = String(cursor.getMonth() + 1).padStart(2, '0')
      const d = String(cursor.getDate()).padStart(2, '0')
      dates.push(`${y}-${m}-${d}`)
      cursor.setDate(cursor.getDate() + 1)
    }

    for (const date of dates) {
      for (const range of values.ranges) {
        await createMutation.mutateAsync({
          round_id: values.round_id,
          start_time: buildIso(date, range.start_time),
          end_time: buildIso(date, range.end_time),
          room: values.room,
          max_groups: values.max_groups,
          min_reviewers: values.min_reviewers,
          max_reviewers: values.max_reviewers,
          status: 'OPEN',
          created_by: 8,
        })
      }
    }
    setBulkModalOpen(false)
    toast.success('Tạo hàng loạt slot thành công')
  })

  React.useEffect(() => {
    slotForm.setValue('round_id', selectedRoundId)
    bulkForm.setValue('round_id', selectedRoundId)
  }, [selectedRoundId, slotForm, bulkForm])

  return (
    <div className="space-y-5">
      <Card className="rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-sora text-xl font-bold text-foreground">Quản lý Slot</h1>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={openCreateModal}>
              <Plus className="h-4 w-4" />
              Tạo Slot
            </Button>
            <Button type="button" variant="outline" onClick={() => setBulkModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Tạo hàng loạt
            </Button>
          </div>
        </div>
      </Card>

      <Card className="rounded-xl p-5 shadow-sm">
        <Tabs value={String(selectedRoundId)} onValueChange={(v) => setSelectedRoundId(Number(v))}>
          <TabsList>
            {rounds.map((r) => (
              <TabsTrigger key={r.round_id} value={String(r.round_id)}>
                Round {r.round_number}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead>Giờ bắt đầu</TableHead>
                <TableHead>Giờ kết thúc</TableHead>
                <TableHead>Phòng</TableHead>
                <TableHead>Nhóm</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slots.map((slot) => (
                <TableRow key={slot.slot_id} className="hover:bg-primary/10/40">
                  <TableCell>{slot.slot_id}</TableCell>
                  <TableCell>{slot.start_time.slice(0, 10)}</TableCell>
                  <TableCell>{slot.start_time.slice(11, 16)}</TableCell>
                  <TableCell>{slot.end_time.slice(11, 16)}</TableCell>
                  <TableCell>
                    {isUrl(slot.room) ? (
                      <a
                        href={slot.room}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:text-primary"
                      >
                        Google Meet <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      slot.room
                    )}
                  </TableCell>
                  <TableCell>{slot.current_group_count}</TableCell>
                  <TableCell>{slot.status}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon-sm" onClick={() => openEditModal(slot)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(slot)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={slotModalOpen} onOpenChange={setSlotModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSlot ? 'Chỉnh sửa Slot' : 'Tạo Slot'}</DialogTitle>
            <DialogDescription>Điền thông tin slot phản biện.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitSlot}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Round</Label>
                <Controller
                  control={slotForm.control}
                  name="round_id"
                  render={({ field }) => (
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rounds.map((r) => (
                          <SelectItem key={r.round_id} value={String(r.round_id)}>
                            Round {r.round_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Ngày</Label>
                <Controller
                  control={slotForm.control}
                  name="date"
                  render={({ field }) => (
                    <DatePicker value={field.value} onChange={field.onChange} placeholder="Chọn ngày" />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Giờ bắt đầu</Label>
                <Input type="time" {...slotForm.register('start_time')} />
              </div>
              <div className="space-y-2">
                <Label>Giờ kết thúc</Label>
                <Input type="time" {...slotForm.register('end_time')} />
                {slotForm.formState.errors.end_time ? (
                  <p className="text-xs text-destructive">{slotForm.formState.errors.end_time.message}</p>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Phòng</Label>
                <Input {...slotForm.register('room')} placeholder="B4-201 hoặc https://meet.google.com/..." />
                <p className="text-xs text-muted-foreground">Nhập tên phòng hoặc link Google Meet</p>
              </div>

              <div className="space-y-2">
                <Label>Số nhóm tối đa</Label>
                <Input type="number" min={1} max={5} {...slotForm.register('max_groups')} />
              </div>
              <div className="space-y-2">
                <Label>Số GV Review tối thiểu</Label>
                <Input type="number" min={1} {...slotForm.register('min_reviewers')} />
              </div>
              <div className="space-y-2">
                <Label>Số GV Review tối đa</Label>
                <Input type="number" min={1} {...slotForm.register('max_reviewers')} />
              </div>

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Controller
                  control={slotForm.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">OPEN</SelectItem>
                        <SelectItem value="FULL">FULL</SelectItem>
                        <SelectItem value="LOCKED">LOCKED</SelectItem>
                        <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSlotModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingSlot ? 'Lưu thay đổi' : 'Tạo Slot'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tạo hàng loạt Slot</DialogTitle>
            <DialogDescription>Chọn round, khoảng ngày và nhiều khung giờ để tạo nhanh.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitBulk}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Round</Label>
                <Controller
                  control={bulkForm.control}
                  name="round_id"
                  render={({ field }) => (
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rounds.map((r) => (
                          <SelectItem key={r.round_id} value={String(r.round_id)}>
                            Round {r.round_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Phòng</Label>
                <Input {...bulkForm.register('room')} placeholder="B4-301 hoặc link meet" />
              </div>
              <div className="space-y-2">
                <Label>Từ ngày</Label>
                <Controller
                  control={bulkForm.control}
                  name="date_from"
                  render={({ field }) => (
                    <DatePicker value={field.value} onChange={field.onChange} placeholder="Chọn ngày bắt đầu" />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Đến ngày</Label>
                <Controller
                  control={bulkForm.control}
                  name="date_to"
                  render={({ field }) => (
                    <DatePicker value={field.value} onChange={field.onChange} placeholder="Chọn ngày kết thúc" />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Số nhóm tối đa</Label>
                <Input type="number" min={1} max={5} {...bulkForm.register('max_groups')} />
              </div>
              <div className="space-y-2">
                <Label>GV min / max</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" min={1} {...bulkForm.register('min_reviewers')} />
                  <Input type="number" min={1} {...bulkForm.register('max_reviewers')} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Danh sách khung giờ</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => rangeFieldArray.append({ start_time: '08:00', end_time: '09:30' })}
                >
                  <Plus className="h-4 w-4" />
                  Thêm khung giờ
                </Button>
              </div>

              <div className="space-y-2">
                {rangeFieldArray.fields.map((field, idx) => (
                  <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <Input type="time" {...bulkForm.register(`ranges.${idx}.start_time`)} />
                    <Input type="time" {...bulkForm.register(`ranges.${idx}.end_time`)} />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => rangeFieldArray.remove(idx)}
                      disabled={rangeFieldArray.fields.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-black/[0.02] p-3">
              <div className="mb-2 text-sm font-semibold text-foreground">Preview slot sẽ tạo</div>
              {previewBulkSlots.length === 0 ? (
                <div className="text-sm text-muted-foreground">Chưa có dữ liệu preview.</div>
              ) : (
                <div className="max-h-40 space-y-1 overflow-y-auto text-sm text-muted-foreground">
                  {previewBulkSlots.map((p, idx) => (
                    <div key={`${p.date}-${p.start}-${idx}`}>
                      {p.date} · {p.start} - {p.end}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBulkModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Confirm bulk create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void deleteMutation.mutateAsync(deleteTarget.slot_id)
          setDeleteTarget(null)
        }}
        title="Xác nhận xóa slot"
        description={deleteTarget ? `Bạn muốn xóa slot #${deleteTarget.slot_id}?` : 'Bạn muốn xóa slot này?'}
        confirmLabel="Xóa"
        confirmVariant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

