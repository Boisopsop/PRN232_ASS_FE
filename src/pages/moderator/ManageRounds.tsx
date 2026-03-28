/**
 * Trang moderator quản lý vòng review (CRUD + publish/close).
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Edit3, Plus, Trash2, Send, Lock } from 'lucide-react'
import { toast } from 'sonner'

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
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useCreateRound, useDeleteRound, useRounds, useUpdateRound } from '@/hooks/useRounds'
import { mockDb } from '@/lib/mock'
import type { ReviewRound, RoundStatus } from '@/types'

const roundSchema = z
  .object({
    round_number: z.coerce.number().refine((v) => [1, 2, 3].includes(v), {
      message: 'Round number không hợp lệ',
    }) as z.ZodType<1 | 2 | 3>,
    round_name: z.string().min(1, 'Vui lòng nhập tên round'),
    registration_open_at: z.string().min(1, 'Vui lòng chọn ngày mở đăng ký'),
    registration_close_at: z.string().min(1, 'Vui lòng chọn ngày đóng đăng ký'),
    review_date_from: z.string().min(1, 'Vui lòng chọn ngày bắt đầu review'),
    review_date_to: z.string().min(1, 'Vui lòng chọn ngày kết thúc review'),
    status: z.enum(['UPCOMING', 'OPEN', 'CLOSED', 'COMPLETED']),
  })
  .superRefine((data, ctx) => {
    const open = new Date(data.registration_open_at).getTime()
    const close = new Date(data.registration_close_at).getTime()
    const from = new Date(data.review_date_from).getTime()
    const to = new Date(data.review_date_to).getTime()

    if (!(close > open)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['registration_close_at'],
        message: 'Ngày đóng đăng ký phải sau ngày mở đăng ký',
      })
    }
    if (!(from > close)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['review_date_from'],
        message: 'Ngày bắt đầu review phải sau ngày đóng đăng ký',
      })
    }
    if (!(to > from)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['review_date_to'],
        message: 'Ngày kết thúc review phải sau ngày bắt đầu review',
      })
    }
  })

type RoundFormValues = z.infer<typeof roundSchema>

const statusHeaderClass: Record<RoundStatus, string> = {
  UPCOMING: 'bg-blue-100 text-blue-800',
  OPEN: 'bg-green-100 text-green-800',
  CLOSED: 'bg-slate-100 text-slate-700',
  COMPLETED: 'bg-purple-100 text-purple-800',
}

export function ManageRounds() {
  const roundsQuery = useRounds(1)
  const rounds = roundsQuery.data ?? []

  const createRoundMutation = useCreateRound()
  const updateRoundMutation = useUpdateRound()
  const deleteRoundMutation = useDeleteRound()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRound, setEditingRound] = useState<ReviewRound | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ReviewRound | null>(null)

  const form = useForm<RoundFormValues>({
    resolver: zodResolver(roundSchema),
    defaultValues: {
      round_number: 1,
      round_name: '',
      registration_open_at: '',
      registration_close_at: '',
      review_date_from: '',
      review_date_to: '',
      status: 'UPCOMING',
    },
  })

  const sortedRounds = useMemo(
    () => [...rounds].sort((a, b) => a.round_number - b.round_number),
    [rounds],
  )

  const resetCreateForm = () => {
    form.reset({
      round_number: 1,
      round_name: '',
      registration_open_at: '',
      registration_close_at: '',
      review_date_from: '',
      review_date_to: '',
      status: 'UPCOMING',
    })
  }

  const openCreateModal = () => {
    setEditingRound(null)
    resetCreateForm()
    setModalOpen(true)
  }

  const openEditModal = (round: ReviewRound) => {
    setEditingRound(round)
    form.reset({
      round_number: round.round_number,
      round_name: round.round_name,
      registration_open_at: round.registration_open_at,
      registration_close_at: round.registration_close_at,
      review_date_from: round.review_date_from,
      review_date_to: round.review_date_to,
      status: round.status,
    })
    setModalOpen(true)
  }

  const hasSlots = (round_id: number) => mockDb.slots.some((s) => s.round_id === round_id)

  const submitForm = form.handleSubmit(async (values) => {
    const payload: Omit<ReviewRound, 'round_id'> = {
      semester_id: 1,
      round_number: values.round_number,
      round_name: values.round_name,
      registration_open_at: values.registration_open_at,
      registration_close_at: values.registration_close_at,
      review_date_from: values.review_date_from,
      review_date_to: values.review_date_to,
      status: values.status,
    }

    if (editingRound) {
      await updateRoundMutation.mutateAsync({
        round_id: editingRound.round_id,
        data: payload,
      })
      toast.success('Cập nhật round thành công')
    } else {
      await createRoundMutation.mutateAsync(payload)
      toast.success('Tạo round thành công')
    }
    setModalOpen(false)
    setEditingRound(null)
  })

  const publishRound = async (round: ReviewRound) => {
    await updateRoundMutation.mutateAsync({
      round_id: round.round_id,
      data: { status: 'OPEN' },
    })
    toast.success(`Đã publish ${round.round_name}`)
  }

  const closeRound = async (round: ReviewRound) => {
    await updateRoundMutation.mutateAsync({
      round_id: round.round_id,
      data: { status: 'CLOSED' },
    })
    toast.success(`Đã khóa đăng ký ${round.round_name}`)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteRoundMutation.mutateAsync({ round_id: deleteTarget.round_id })
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-sora text-xl font-bold text-slate-900">Quản lý Review Round</h1>
          <Button type="button" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Tạo Round
          </Button>
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {sortedRounds.map((round) => {
          const canEdit = round.status !== 'COMPLETED'
          const canPublish = round.status === 'UPCOMING'
          const canClose = round.status === 'OPEN'
          const canDelete = round.status === 'UPCOMING' && !hasSlots(round.round_id)

          return (
            <Card key={round.round_id} className="rounded-xl shadow-sm">
              <div className={`rounded-t-xl px-4 py-3 text-sm font-semibold ${statusHeaderClass[round.status]}`}>
                Round {round.round_number}
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-sora text-lg font-bold text-slate-900">{round.round_name}</div>
                  <StatusBadge status={round.status} size="sm" />
                </div>

                <div className="space-y-2 text-sm text-slate-700">
                  <div>📝 Đăng ký: {round.registration_open_at} → {round.registration_close_at}</div>
                  <div>📅 Review: {round.review_date_from} → {round.review_date_to}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(round)}>
                      <Edit3 className="h-4 w-4" />
                      Chỉnh sửa
                    </Button>
                  ) : null}

                  {canPublish ? (
                    <Button type="button" size="sm" onClick={() => void publishRound(round)}>
                      <Send className="h-4 w-4" />
                      Publish
                    </Button>
                  ) : null}

                  {canClose ? (
                    <Button type="button" variant="secondary" size="sm" onClick={() => void closeRound(round)}>
                      <Lock className="h-4 w-4" />
                      Khóa đăng ký
                    </Button>
                  ) : null}

                  {canDelete ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget(round)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          )
        })}
      </section>

      <Dialog open={modalOpen} onOpenChange={(open) => (open ? setModalOpen(true) : setModalOpen(false))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRound ? 'Chỉnh sửa Round' : 'Tạo Round mới'}</DialogTitle>
            <DialogDescription>Điền đầy đủ thông tin round và kiểm tra thứ tự thời gian.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitForm}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Round number</Label>
                <Controller
                  control={form.control}
                  name="round_number"
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v) as 1 | 2 | 3)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn round" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Round 1</SelectItem>
                        <SelectItem value="2">Round 2</SelectItem>
                        <SelectItem value="3">Round 3</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.round_number ? (
                  <p className="text-xs text-[#DC2626]">{form.formState.errors.round_number.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Tên round</Label>
                <Input {...form.register('round_name')} placeholder="Ví dụ: Review 1" />
                {form.formState.errors.round_name ? (
                  <p className="text-xs text-[#DC2626]">{form.formState.errors.round_name.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Ngày mở đăng ký</Label>
                <Controller
                  control={form.control}
                  name="registration_open_at"
                  render={({ field }) => (
                    <DatePicker value={field.value} onChange={field.onChange} placeholder="Chọn ngày mở" />
                  )}
                />
                {form.formState.errors.registration_open_at ? (
                  <p className="text-xs text-[#DC2626]">
                    {form.formState.errors.registration_open_at.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Ngày đóng đăng ký</Label>
                <Controller
                  control={form.control}
                  name="registration_close_at"
                  render={({ field }) => (
                    <DatePicker value={field.value} onChange={field.onChange} placeholder="Chọn ngày đóng" />
                  )}
                />
                {form.formState.errors.registration_close_at ? (
                  <p className="text-xs text-[#DC2626]">
                    {form.formState.errors.registration_close_at.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Ngày bắt đầu review</Label>
                <Controller
                  control={form.control}
                  name="review_date_from"
                  render={({ field }) => (
                    <DatePicker value={field.value} onChange={field.onChange} placeholder="Chọn ngày bắt đầu" />
                  )}
                />
                {form.formState.errors.review_date_from ? (
                  <p className="text-xs text-[#DC2626]">{form.formState.errors.review_date_from.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Ngày kết thúc review</Label>
                <Controller
                  control={form.control}
                  name="review_date_to"
                  render={({ field }) => (
                    <DatePicker value={field.value} onChange={field.onChange} placeholder="Chọn ngày kết thúc" />
                  )}
                />
                {form.formState.errors.review_date_to ? (
                  <p className="text-xs text-[#DC2626]">{form.formState.errors.review_date_to.message}</p>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Trạng thái</Label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange(v as RoundStatus)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UPCOMING">UPCOMING</SelectItem>
                        <SelectItem value="OPEN">OPEN</SelectItem>
                        <SelectItem value="CLOSED">CLOSED</SelectItem>
                        <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.status ? (
                  <p className="text-xs text-[#DC2626]">{form.formState.errors.status.message}</p>
                ) : null}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createRoundMutation.isPending || updateRoundMutation.isPending}
              >
                {editingRound ? 'Lưu thay đổi' : 'Tạo Round'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        title="Xác nhận xóa Round"
        description={
          deleteTarget ? `Bạn có chắc chắn muốn xóa ${deleteTarget.round_name}?` : 'Bạn có chắc chắn muốn xóa?'
        }
        confirmLabel="Xóa Round"
        confirmVariant="destructive"
        isLoading={deleteRoundMutation.isPending}
      />
    </div>
  )
}

