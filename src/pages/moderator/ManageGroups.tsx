/**
 * Trang moderator quản lý nhóm sinh viên (CRUD + thành viên).
 */
import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ChevronDown, ChevronUp, Edit3, Plus, Trash2, UserPlus, UserMinus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useActiveSemester } from '@/hooks/useActiveSemester'
import { useAllUsers } from '@/hooks/useAllUsers'
import {
  useGroups,
  useGroupMembers,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useAddGroupMember,
  useRemoveGroupMember,
} from '@/hooks/useGroups'
import type { Group } from '@/types'

const groupSchema = z.object({
  group_name: z.string().min(1, 'Vui lòng nhập tên nhóm'),
  project_title: z.string().min(1, 'Vui lòng nhập tên đề tài'),
  gvhd_id: z.coerce.number().min(1, 'Vui lòng chọn GVHD'),
})
type GroupFormValues = z.infer<typeof groupSchema>

function GroupMembersSection({ groupId }: { groupId: number }) {
  const membersQuery = useGroupMembers(groupId)
  const members = membersQuery.data ?? []
  const studentsQuery = useAllUsers('STUDENT')
  const students = studentsQuery.data ?? []
  const addMemberMutation = useAddGroupMember()
  const removeMemberMutation = useRemoveGroupMember()
  const [addStudentId, setAddStudentId] = React.useState<number | null>(null)

  const existingStudentIds = new Set(members.map((m) => m.student_id))
  const availableStudents = students.filter((s) => !existingStudentIds.has(s.user_id))

  const handleAdd = async () => {
    if (!addStudentId) return
    await addMemberMutation.mutateAsync({ groupId, studentId: addStudentId })
    setAddStudentId(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1">
          <Select
            value={addStudentId ? String(addStudentId) : undefined}
            onValueChange={(v) => setAddStudentId(Number(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn sinh viên" />
            </SelectTrigger>
            <SelectContent>
              {availableStudents.map((s) => (
                <SelectItem key={s.user_id} value={String(s.user_id)}>
                  {s.full_name} - {s.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!addStudentId || addMemberMutation.isPending}
          onClick={() => void handleAdd()}
        >
          <UserPlus className="h-4 w-4" />
          Thêm
        </Button>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có thành viên</p>
      ) : (
        <div className="space-y-1">
          {members.map((member) => (
            <div
              key={member.member_id}
              className="flex items-center justify-between rounded-md bg-secondary/30 px-3 py-2 text-sm"
            >
              <span>{member.student?.full_name ?? `Student #${member.student_id}`}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void removeMemberMutation.mutateAsync({ memberId: member.member_id })}
                disabled={removeMemberMutation.isPending}
              >
                <UserMinus className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ManageGroups() {
  const activeSemesterQuery = useActiveSemester()
  const semesterId = activeSemesterQuery.data?.semester_id ?? 0
  const groupsQuery = useGroups(semesterId || undefined)
  const groups = groupsQuery.data ?? []
  const gvhdQuery = useAllUsers('GVHD')
  const gvhdList = gvhdQuery.data ?? []

  const createMutation = useCreateGroup()
  const updateMutation = useUpdateGroup()
  const deleteMutation = useDeleteGroup()

  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingGroup, setEditingGroup] = React.useState<Group | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Group | null>(null)
  const [expandedGroupIds, setExpandedGroupIds] = React.useState<number[]>([])

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      group_name: '',
      project_title: '',
      gvhd_id: 0,
    },
  })

  const openCreateModal = () => {
    setEditingGroup(null)
    form.reset({ group_name: '', project_title: '', gvhd_id: 0 })
    setModalOpen(true)
  }

  const openEditModal = (group: Group) => {
    setEditingGroup(group)
    form.reset({
      group_name: group.group_name,
      project_title: group.project_title,
      gvhd_id: group.gvhd_id,
    })
    setModalOpen(true)
  }

  const submitForm = form.handleSubmit(async (values) => {
    if (editingGroup) {
      await updateMutation.mutateAsync({
        group_id: editingGroup.group_id,
        data: values,
      })
    } else {
      await createMutation.mutateAsync({
        ...values,
        semester_id: semesterId,
      })
    }
    setModalOpen(false)
    setEditingGroup(null)
  })

  const confirmDelete = async () => {
    if (!deleteTarget) return
    await deleteMutation.mutateAsync({ group_id: deleteTarget.group_id })
    setDeleteTarget(null)
  }

  const toggleExpand = (groupId: number) => {
    setExpandedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    )
  }

  const getGvhdName = (gvhdId: number) =>
    gvhdList.find((u) => u.user_id === gvhdId)?.full_name ?? `GV #${gvhdId}`

  return (
    <div className="space-y-5">
      <Card className="rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-sora text-xl font-bold text-foreground">Quản lý Nhóm</h1>
            {activeSemesterQuery.data ? (
              <p className="text-sm text-muted-foreground">
                Học kỳ: {activeSemesterQuery.data.semester_name}
              </p>
            ) : null}
          </div>
          <Button type="button" onClick={openCreateModal} disabled={semesterId === 0}>
            <Plus className="h-4 w-4" />
            Tạo Nhóm
          </Button>
        </div>
      </Card>

      <Card className="rounded-xl p-5 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên nhóm</TableHead>
              <TableHead>Đề tài</TableHead>
              <TableHead>GVHD</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  {groupsQuery.isPending ? 'Đang tải...' : 'Chưa có nhóm nào'}
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => {
                const expanded = expandedGroupIds.includes(group.group_id)
                return (
                  <React.Fragment key={group.group_id}>
                    <TableRow>
                      <TableCell className="font-medium">{group.group_name}</TableCell>
                      <TableCell>{group.project_title}</TableCell>
                      <TableCell>{getGvhdName(group.gvhd_id)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(group.group_id)}
                          >
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            Thành viên
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(group)}
                          >
                            <Edit3 className="h-4 w-4" />
                            Sửa
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTarget(group)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Xóa
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expanded ? (
                      <TableRow>
                        <TableCell colSpan={4} className="bg-secondary/10 p-4">
                          <GroupMembersSection groupId={group.group_id} />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={modalOpen} onOpenChange={(open) => (open ? setModalOpen(true) : setModalOpen(false))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Chỉnh sửa Nhóm' : 'Tạo Nhóm mới'}</DialogTitle>
            <DialogDescription>Điền đầy đủ thông tin nhóm.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitForm}>
            <div className="space-y-2">
              <Label>Tên nhóm</Label>
              <Input {...form.register('group_name')} placeholder="Ví dụ: Nhóm 1" />
              {form.formState.errors.group_name ? (
                <p className="text-xs text-destructive">{form.formState.errors.group_name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Tên đề tài</Label>
              <Input {...form.register('project_title')} placeholder="Tên đề tài capstone" />
              {form.formState.errors.project_title ? (
                <p className="text-xs text-destructive">{form.formState.errors.project_title.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>GVHD</Label>
              <Select
                value={form.watch('gvhd_id') ? String(form.watch('gvhd_id')) : undefined}
                onValueChange={(v) => form.setValue('gvhd_id', Number(v), { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn GVHD" />
                </SelectTrigger>
                <SelectContent>
                  {gvhdList.map((gv) => (
                    <SelectItem key={gv.user_id} value={String(gv.user_id)}>
                      {gv.full_name} - {gv.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.gvhd_id ? (
                <p className="text-xs text-destructive">{form.formState.errors.gvhd_id.message}</p>
              ) : null}
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
        title="Xóa nhóm"
        description={`Bạn có chắc muốn xóa "${deleteTarget?.group_name ?? ''}"? Tất cả thành viên sẽ bị xóa theo.`}
        confirmLabel="Xóa"
        confirmVariant="destructive"
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
