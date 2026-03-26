/**
 * Card hiển thị thông tin slot và hành động đăng ký/hủy đăng ký.
 */
import type { SlotWithDetails } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Loader2 } from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { OccupancyBar } from '@/components/shared/OccupancyBar'

function safeDate(value: string): Date | null {
  const d = parseISO(value)
  return isValid(d) ? d : null
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

export function SlotCard({
  slot,
  mode,
  isRegistered = false,
  isConflict = false,
  conflictGroupName,
  onRegister,
  onCancel,
  isLoading = false,
}: {
  slot: SlotWithDetails
  mode: 'student' | 'reviewer' | 'readonly'
  isRegistered?: boolean
  isConflict?: boolean
  conflictGroupName?: string
  onRegister?: () => void
  onCancel?: () => void
  isLoading?: boolean
}) {
  const start = safeDate(slot.start_time)
  const end = safeDate(slot.end_time)

  const dateText = start ? format(start, 'dd/MM/yyyy') : slot.start_time
  const timeText =
    start && end ? `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}` : `${slot.start_time} → ${slot.end_time}`

  const roomIsUrl = isHttpUrl(slot.room)

  const reviewerCount = slot.registered_reviewers.length
  const groupChips = slot.registered_groups

  const actionDisabledByMode = mode === 'readonly'

  const conflictLabel = 'Xung đột GVHD'

  const buttonState = (() => {
    if (actionDisabledByMode) return { disabled: true, label: 'Chỉ xem', variant: 'outline' as const, className: '' }
    if (isConflict)
      return {
        disabled: true,
        label: conflictLabel,
        variant: 'outline' as const,
        className: 'border-[#D97706]/30 bg-[#D97706]/10 text-[#D97706] disabled:opacity-100',
      }
    if (isRegistered)
      return {
        disabled: false,
        label: 'Hủy đăng ký',
        variant: 'destructive' as const,
        className: 'disabled:opacity-100',
      }
    if (slot.status === 'FULL')
      return {
        disabled: true,
        label: 'Đã đầy',
        variant: 'outline' as const,
        className: 'border-black/10 bg-black/5 text-slate-500 disabled:opacity-100',
      }
    if (slot.status === 'LOCKED')
      return {
        disabled: true,
        label: 'Đã khóa',
        variant: 'outline' as const,
        className: 'border-black/10 bg-black/5 text-slate-500 disabled:opacity-100',
      }
    return {
      disabled: false,
      label: 'Đăng ký',
      variant: 'default' as const,
      className: '',
    }
  })()

  return (
    <Card className="rounded-xl border border-black/5 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{dateText}</div>
          <div className="mt-1 text-xs text-slate-600">{timeText}</div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="truncate">{slot.room}</span>
          {roomIsUrl ? (
            <a
              href={slot.room}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md text-slate-500 transition-all duration-200 hover:text-slate-900"
              aria-label="Mở link phòng"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <OccupancyBar current={slot.current_group_count} max={slot.max_groups} />

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-lg bg-indigo-50 text-indigo-700">
            {mode === 'reviewer'
              ? `${reviewerCount}/${slot.max_reviewers} giảng viên`
              : `${reviewerCount} phản biện đã đăng ký`}
          </Badge>
        </div>

        {mode === 'reviewer' ? (
          <div className="flex flex-wrap gap-2">
            {groupChips.length === 0 ? (
              <div className="text-xs text-slate-500">Chưa có nhóm đăng ký</div>
            ) : (
              groupChips.map((g) => (
                <Badge key={g.group_id} variant="outline" className="rounded-lg bg-white">
                  {g.group_name}
                </Badge>
              ))
            )}
          </div>
        ) : null}

        {isConflict ? (
          <div className="rounded-lg border border-[#D97706]/20 bg-[#D97706]/10 p-3 text-sm text-[#B45309]">
            ⚠️ Bạn là GVHD của {conflictGroupName ?? 'nhóm'} trong slot này
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <StatusBadge status={slot.status} size="sm" />
        <Button
          type="button"
          disabled={buttonState.disabled || isLoading}
          variant={buttonState.variant}
          className={buttonState.className}
          aria-label={buttonState.label}
          onClick={() => {
            if (buttonState.disabled) return
            if (isRegistered) onCancel?.()
            else onRegister?.()
          }}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {buttonState.label}
        </Button>
      </div>
    </Card>
  )
}

