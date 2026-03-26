/**
 * Trang giảng viên review đăng ký slot theo round với kiểm tra xung đột và giới hạn.
 */
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Info, RefreshCw } from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { SlotCard } from '@/components/shared/SlotCard'
import { SlotCardSkeleton } from '@/components/shared/LoadingSkeletons'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useRounds } from '@/hooks/useRounds'
import { useCancelReviewerRegistration, useRegisterReviewerSlot } from '@/hooks/useReviewer'
import { useSlotsForRound } from '@/hooks/useSlots'
import { mockDb } from '@/lib/mock'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

function formatDateTime(value: string, pattern: string): string {
  const d = parseISO(value)
  if (!isValid(d)) return value
  return format(d, pattern)
}

export function ReviewerSlotRegistration() {
  const { currentUser } = useAuthStore()
  const roundsQuery = useRounds(1)
  const rounds = roundsQuery.data ?? []

  const firstOpenRoundId = useMemo(() => rounds.find((r) => r.status === 'OPEN')?.round_id ?? 0, [rounds])
  const [selectedRoundId, setSelectedRoundId] = useState(0)
  useEffect(() => {
    if (selectedRoundId > 0) return
    if (firstOpenRoundId > 0) setSelectedRoundId(firstOpenRoundId)
    else if (rounds.length > 0) setSelectedRoundId(rounds[0].round_id)
  }, [firstOpenRoundId, rounds, selectedRoundId])

  const slotsQuery = useSlotsForRound(selectedRoundId)
  const slots = slotsQuery.data ?? []

  const registerMutation = useRegisterReviewerSlot()
  const cancelMutation = useCancelReviewerRegistration()

  const config = useMemo(() => mockDb.configs.find((c) => c.round_id === selectedRoundId) ?? null, [selectedRoundId])

  const reviewerRegistrationsInRound = useMemo(() => {
    if (!currentUser) return []
    return mockDb.reviewerRegistrations.filter((r) => {
      if (r.reviewer_id !== currentUser.user_id || r.status !== 'REGISTERED') return false
      const slot = mockDb.slots.find((s) => s.slot_id === r.slot_id)
      return slot ? slot.round_id === selectedRoundId : false
    })
  }, [currentUser, selectedRoundId, registerMutation.isSuccess, cancelMutation.isSuccess])

  const maxSlots = config?.max_slots ?? 0
  const isAtMax = maxSlots > 0 && reviewerRegistrationsInRound.length >= maxSlots

  const [registerDialog, setRegisterDialog] = useState<{ slot_id: number } | null>(null)
  const [cancelDialog, setCancelDialog] = useState<{ reviewer_registration_id: number } | null>(null)

  const registerLoadingSlotId = registerMutation.isPending ? registerDialog?.slot_id ?? null : null

  const onRegisterClick = (slot_id: number) => {
    if (!currentUser) return
    const slot = slots.find((s) => s.slot_id === slot_id)
    if (!slot) return

    const conflictGroup = slot.registered_groups.find((g) => g.gvhd_id === currentUser.user_id)
    if (conflictGroup) {
      toast.error(`Bạn là GVHD của nhóm ${conflictGroup.group_name} trong slot này — không thể đăng ký`)
      return
    }

    if (isAtMax) {
      toast.error('Bạn đã đạt số slot tối đa cho Round này')
      return
    }

    const existed = reviewerRegistrationsInRound.find((r) => r.slot_id === slot_id)
    if (existed) {
      toast.error('Bạn đã đăng ký slot này rồi')
      return
    }

    setRegisterDialog({ slot_id })
  }

  const onConfirmRegister = async () => {
    if (!currentUser || !registerDialog) return
    try {
      await registerMutation.mutateAsync({
        reviewer_id: currentUser.user_id,
        slot_id: registerDialog.slot_id,
      })
      setRegisterDialog(null)
      void slotsQuery.refetch()
    } catch {
      // toast lỗi xử lý trong hook
    }
  }

  const onConfirmCancel = async () => {
    if (!cancelDialog) return
    try {
      await cancelMutation.mutateAsync({
        reviewer_registration_id: cancelDialog.reviewer_registration_id,
      })
      setCancelDialog(null)
      void slotsQuery.refetch()
    } catch {
      // toast lỗi xử lý trong hook
    }
  }

  if (!currentUser) return null

  return (
    <div className="space-y-5">
      <Card className="rounded-xl p-5 shadow-sm">
        <h1 className="font-sora text-xl font-bold text-slate-900">Đăng ký slot phản biện</h1>
        <p className="mt-1 text-sm text-slate-600">Chọn round và đăng ký slot phù hợp với lịch của bạn.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {rounds.map((round) => {
            const isActive = round.round_id === selectedRoundId
            const isUpcoming = round.status === 'UPCOMING'
            const isCompleted = round.status === 'COMPLETED'
            const isOpen = round.status === 'OPEN'

            return (
              <button
                key={round.round_id}
                type="button"
                title={isUpcoming ? 'Chưa mở đăng ký' : undefined}
                disabled={isUpcoming}
                onClick={() => setSelectedRoundId(round.round_id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-150',
                  isActive && isOpen
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : isUpcoming
                      ? 'cursor-not-allowed border-black/10 bg-black/5 text-slate-500'
                      : 'border-black/10 bg-white text-slate-700 hover:bg-black/5',
                )}
              >
                Round {round.round_number}
                {isCompleted ? <CheckCircle2 className="h-4 w-4 text-[#16A34A]" /> : null}
              </button>
            )
          })}
        </div>
      </Card>

      {isAtMax ? (
        <Card className="rounded-xl border border-[#DC2626]/25 bg-[#DC2626]/10 p-4 shadow-sm">
          <div className="text-sm font-semibold text-[#991B1B]">
            ⛔ Bạn đã đạt giới hạn tối đa {maxSlots} slot cho Round này.
          </div>
        </Card>
      ) : null}

      <section>
        {slotsQuery.isPending ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <SlotCardSkeleton key={idx} />
            ))}
          </div>
        ) : slotsQuery.isError ? (
          <Card className="rounded-xl p-6 shadow-sm">
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-slate-700">Không thể tải danh sách slot. Vui lòng thử lại.</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void slotsQuery.refetch()}
                className="rounded-lg"
              >
                <RefreshCw className="h-4 w-4" />
                Thử lại
              </Button>
            </div>
          </Card>
        ) : (slotsQuery.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Info}
            title="Chưa có slot nào"
            description="Hiện chưa có slot cho round này. Vui lòng quay lại sau."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {slots.map((slot, index) => {
              const myRegistration = reviewerRegistrationsInRound.find((r) => r.slot_id === slot.slot_id) ?? null
              const isRegistered = Boolean(myRegistration)
              const conflictGroup = slot.registered_groups.find((g) => g.gvhd_id === currentUser.user_id) ?? null
              const isConflict = Boolean(conflictGroup)
              const disableBecauseMax = isAtMax && !isRegistered
              const mode = disableBecauseMax ? 'readonly' : 'reviewer'

              return (
                <motion.div
                  key={slot.slot_id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05, ease: 'easeOut' }}
                >
                  <SlotCard
                    slot={slot}
                    mode={mode}
                    isRegistered={isRegistered}
                    isConflict={isConflict}
                    conflictGroupName={conflictGroup?.group_name}
                    isLoading={registerLoadingSlotId === slot.slot_id || cancelMutation.isPending}
                    onRegister={() => onRegisterClick(slot.slot_id)}
                    onCancel={() => {
                      if (myRegistration) {
                        setCancelDialog({
                          reviewer_registration_id: myRegistration.reviewer_registration_id,
                        })
                      }
                    }}
                  />
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={Boolean(registerDialog)}
        onClose={() => setRegisterDialog(null)}
        onConfirm={() => void onConfirmRegister()}
        title="Xác nhận đăng ký slot"
        description={
          registerDialog
            ? (() => {
                const slot = slots.find((s) => s.slot_id === registerDialog.slot_id)
                if (!slot) return 'Bạn có chắc chắn muốn đăng ký slot này?'
                const time = `${formatDateTime(slot.start_time, 'HH:mm')} - ${formatDateTime(slot.end_time, 'HH:mm')}`
                return `Xác nhận đăng ký slot ${time} phòng ${slot.room}?`
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
  )
}

