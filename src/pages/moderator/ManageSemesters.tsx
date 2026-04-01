/**
 * Trang moderator quản lý học kỳ (CRUD).
 */
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Calendar, Edit3, Plus, Trash2 } from 'lucide-react'

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
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSemesters, useCreateSemester, useUpdateSemester, useDeleteSemester } from '@/hooks/useSemesters'
import type { Semester } from '@/types'

const semesterSchema = z
  .object({
    semester_name: z.string().min(1, 'Vui lòng nhập tên học kỳ'),
    start_date: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
    end_date: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
    is_active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.start_date).getTime()
    const end = new Date(data.end_date).getTime()
    if (!(end > start)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_date'],
        message: 'Ngày kết thúc phải sau ngày bắt đầu',
      })
    }
  })

type SemesterFormValues = z.infer<typeof semesterSchema>

export function ManageSemesters() {
  const semestersQuery = useSemesters()
  const semesters = semestersQuery.data ?? []

  const createMutation = useCreateSemester()
  const updateMutation = useUpdateSemester()
  const deleteMutation = useDeleteSemester()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Semester | null>(null)

  const form = useForm<SemesterFormValues>({
    resolver: zodResolver(semesterSchema),
    defaultValues: {
      semester_name: '',
      start_date: '',
      end_date: '',
      is_active: false,
    },
  })

  const sortedSemesters = useMemo(
    () => [...semesters].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()),
    [semesters],
  )

  const resetCreateForm = () => {
    form.reset({
      semester_name: '',
      start_date: '',
      end_date: '',
      is_active: false,
    })
  }

  const openCreateModal = () => {
    setEditingSemester(null)
    resetCreateForm()
    setModalOpen(true)
  }

  const openEditModal = (semester: Semester) => {
    setEditingSemester(semester)
    form.reset({
      semester_name: semester.semester_name,
      start_date: semester.start_date,
      end_date: semester.end_date,
      is_active: semester.is_active,
    })
    setModalOpen(true)
  }

  const submitForm = form.handleSubmit(async (values) => {
    if (editingSemester) {
      await updateMutation.mutateAsync({
        semester_id: editingSemester.semester_id,
        data: values,
      })
    } else {
      await createMutation.mutateAsync(values)
    }
    setModalOpen(false)
    setEditingSemester(null)
  })

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteMutation.mutateAsync({ semester_id: deleteTarget.semester_id })
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-sora text-xl font-bold text-foreground">Quản lý Học kỳ</h1>
          <Button type="button" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Tạo Học kỳ
          </Button>
        </div>
      </Card>

      <Card className="rounded-xl p-5 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên học kỳ</TableHead>
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSemesters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {semestersQuery.isPending ? 'Đang tải...' : 'Chưa có học kỳ nào'}
                </TableCell>
              </TableRow>
            ) : (
              sortedSemesters.map((semester) => (
                <TableRow key={semester.semester_id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {semester.semester_name}
                    </div>
                  </TableCell>
                  <TableCell>{semester.start_date}</TableCell>
                  <TableCell>{semester.end_date}</TableCell>
                  <TableCell>
                    {semester.is_active ? (
                      <Badge className="bg-green-600/10 text-green-600 dark:text-green-400">Đang hoạt động</Badge>
                    ) : (
                      <Badge variant="secondary">Không hoạt động</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(semester)}>
                        <Edit3 className="h-4 w-4" />
                        Sửa
                      </Button>
                      {!semester.is_active ? (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(semester)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Xóa
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={modalOpen} onOpenChange={(open) => (open ? setModalOpen(true) : setModalOpen(false))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSemester ? 'Chỉnh sửa Học kỳ' : 'Tạo Học kỳ mới'}</DialogTitle>
            <DialogDescription>Điền đầy đủ thông tin học kỳ.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitForm}>
            <div className="space-y-2">
              <Label>Tên học kỳ</Label>
              <Input {...form.register('semester_name')} placeholder="Ví dụ: Fall 2025" />
              {form.formState.errors.semester_name ? (
                <p className="text-xs text-destructive">{form.formState.errors.semester_name.message}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày bắt đầu</Label>
                <DatePicker
                  value={form.watch('start_date')}
                  onChange={(v) => form.setValue('start_date', v, { shouldValidate: true })}
                />
                {form.formState.errors.start_date ? (
                  <p className="text-xs text-destructive">{form.formState.errors.start_date.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Ngày kết thúc</Label>
                <DatePicker
                  value={form.watch('end_date')}
                  onChange={(v) => form.setValue('end_date', v, { shouldValidate: true })}
                />
                {form.formState.errors.end_date ? (
                  <p className="text-xs text-destructive">{form.formState.errors.end_date.message}</p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                className="h-4 w-4 rounded border-input"
                checked={form.watch('is_active')}
                onChange={(e) => form.setValue('is_active', e.target.checked)}
              />
              <Label htmlFor="is_active">Đang hoạt động</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xóa học kỳ"
        description={`Bạn có chắc muốn xóa "${deleteTarget?.semester_name ?? ''}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        confirmVariant="destructive"
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
