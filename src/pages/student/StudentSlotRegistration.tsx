/**
 * Trang sinh viên đăng ký slot phản biện theo vòng.
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
import { useCancelGroupRegistration, useRegisterGroupSlot, useSlotsForRound } from '@/hooks/useSlots'
import { mockDb, mockGroupMembers, mockGroups } from '@/lib/mock'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

function formatDateTime(value: string, pattern: string): string {
  const d = parseISO(value)
  if (!isValid(d)) return value
  return format(d, pattern)
}

export function StudentSlotRegistration() {
  const { currentUser } = useAuthStore()
  const roundsQuery = useRounds(1)
  const rounds = roundsQuery.data ?? []

  const firstOpenRoundId = useMemo(() => rounds.find((r) => r.status === 'OPEN')?.round_id ?? 0, [rounds])
  const [selectedRoundId, setSelectedRoundId] = useState(0)

  useEffect(() => {
    if (selectedRoundId > 0) return
    if (firstOpenRoundId > 0) {
      setSelectedRoundId(firstOpenRoundId)
      return
    }
    if (rounds.length > 0) setSelectedRoundId(rounds[0].round_id)
  }, [firstOpenRoundId, rounds, selectedRoundId])

  const slotsQuery = useSlotsForRound(selectedRoundId)
  const registerMutation = useRegisterGroupSlot()
  const cancelMutation = useCancelGroupRegistration()

  const group = useMemo(() => {
    if (!currentUser) return null
    const member = mockGroupMembers.find((m) => m.student_id === currentUser.user_id)
    if (!member) return null
    return mockGroups.find((g) => g.group_id === member.group_id) ?? null
  }, [currentUser])

  const activeRound = useMemo(() => rounds.find((r) => r.round_id === selectedRoundId) ?? null, [rounds, selectedRoundId])

  const groupRegistrationInRound = useMemo(() => {
    if (!group || !activeRound) return null
    const regs = mockDb.groupRegistrations.filter(
      (r) => r.group_id === group.group_id && r.status === 'REGISTERED',
    )
    return (
      regs.find((r) => {
        const slot = mockDb.slots.find((s) => s.slot_id === r.slot_id)
        return slot ? slot.round_id === activeRound.round_id : false
      }) ?? null
    )
  }, [group, activeRound, registerMutation.isSuccess, cancelMutation.isSuccess])

  const registeredSlotSummary = useMemo(() => {
    if (!groupRegistrationInRound) return null
    const slot = mockDb.slots.find((s) => s.slot_id === groupRegistrationInRound.slot_id)
    if (!slot) return null
    return {
      date: formatDateTime(slot.start_time, 'dd/MM/yyyy'),
      time: `${formatDateTime(slot.start_time, 'HH:mm')} - ${formatDateTime(slot.end_time, 'HH:mm')}`,
      room: slot.room,
    }
  }, [groupRegistrationInRound])

  const [registerDialog, setRegisterDialog] = useState<{ slot_id: number } | null>(null)
  const [cancelDialog, setCancelDialog] = useState<{ registration_id: number } | null>(null)

  const registerLoadingSlotId = registerMutation.isPending ? registerDialog?.slot_id ?? null : null

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
      void slotsQuery.refetch()
    } catch {
      // toast lỗi do hook xử lý
    }
  }

  const onConfirmCancel = async () => {
    if (!cancelDialog) return
    try {
      await cancelMutation.mutateAsync({ registration_id: cancelDialog.registration_id })
      setCancelDialog(null)
      void slotsQuery.refetch()
    } catch {
      // toast lỗi do hook xử lý
    }
  }

  if (!group) {
    return (
      <Card className="rounded-xl p-6 shadow-sm">
        <h1 className="font-sora text-xl font-bold text-foreground">Đăng ký phản biện</h1>
        <p className="mt-2 text-sm text-muted-foreground">Bạn chưa được gán vào nhóm để thực hiện đăng ký slot.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-xl p-5 shadow-sm">
        <h1 className="font-sora text-xl font-bold text-foreground">Đăng ký slot phản biện</h1>
        <p className="mt-1 text-sm text-muted-foreground">Chọn round và slot phù hợp cho nhóm của bạn.</p>

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
                    ? 'border-primary bg-primary text-white'
                    : isUpcoming
                      ? 'cursor-not-allowed border-border bg-black/5 text-muted-foreground'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted',
                )}
              >
                Round {round.round_number}
                {isCompleted ? <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" /> : null}
              </button>
            )
          })}
        </div>
      </Card>

      {activeRound && groupRegistrationInRound && registeredSlotSummary ? (
        <Card className="rounded-xl border border-green-600/30 bg-green-600/10 p-4 shadow-sm">
          <div className="text-sm font-semibold text-green-600 dark:text-green-400">
            ✅ Nhóm bạn đã đăng ký slot cho {activeRound.round_name}
          </div>
          <div className="mt-2 text-sm text-green-600 dark:text-green-400">
            {registeredSlotSummary.date} · {registeredSlotSummary.time} · {registeredSlotSummary.room}
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
              <p className="text-sm text-muted-foreground">Không thể tải danh sách slot. Vui lòng thử lại.</p>
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
            {slotsQuery.data?.map((slot, index) => {
              const registration = mockDb.groupRegistrations.find(
                (r) => r.group_id === group.group_id && r.slot_id === slot.slot_id && r.status === 'REGISTERED',
              )
              const isRegistered = Boolean(registration)
              const alreadyHasRoundRegistration = Boolean(groupRegistrationInRound)
              const readonlyBecauseHasOtherRegistration =
                alreadyHasRoundRegistration && !isRegistered

              return (
                <motion.div
                  key={slot.slot_id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05, ease: 'easeOut' }}
                >
                  <SlotCard
                    slot={slot}
                    mode={readonlyBecauseHasOtherRegistration ? 'readonly' : 'student'}
                    isRegistered={isRegistered}
                    isLoading={registerLoadingSlotId === slot.slot_id || cancelMutation.isPending}
                    onRegister={() => setRegisterDialog({ slot_id: slot.slot_id })}
                    onCancel={() => {
                      if (registration) setCancelDialog({ registration_id: registration.registration_id })
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
                const slot = slotsQuery.data?.find((s) => s.slot_id === registerDialog.slot_id)
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

