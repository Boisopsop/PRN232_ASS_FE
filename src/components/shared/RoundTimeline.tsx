/**
 * Timeline ngang thể hiện trạng thái 3 vòng phản biện.
 */
import type { ReviewRound } from '@/types'
import { useMemo, useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RoundTimeline({ rounds }: { rounds: ReviewRound[] }) {
  const ordered = useMemo(() => {
    const copy = [...rounds]
    copy.sort((a, b) => a.round_number - b.round_number)
    return copy.slice(0, 3)
  }, [rounds])

  const initialActive = useMemo(() => {
    const open = ordered.find((r) => r.status === 'OPEN')
    return open?.round_id ?? ordered[0]?.round_id ?? 0
  }, [ordered])

  const [activeRoundId, setActiveRoundId] = useState<number>(initialActive)

  return (
    <div className="w-full">
      <div className="flex items-center gap-3">
        {ordered.map((round, idx) => {
          const isActive = round.round_id === activeRoundId
          const normalized = round.status.trim().toUpperCase()
          const canClick = normalized === 'OPEN'
          const prev = ordered[idx - 1]
          const prevNormalized = prev?.status.trim().toUpperCase()
          const lineColor =
            prevNormalized === 'COMPLETED'
              ? 'bg-[#16A34A]'
              : prevNormalized === 'OPEN'
                ? 'bg-[#2563EB]'
                : 'bg-black/10'

          return (
            <div key={round.round_id} className="flex flex-1 flex-col items-center">
              <button
                type="button"
                onClick={() => (canClick ? setActiveRoundId(round.round_id) : null)}
                className="group flex flex-col items-center gap-2"
                aria-label={`Chọn vòng ${round.round_number}`}
              >
                {normalized === 'COMPLETED' ? (
                  <CheckCircle2 className={cn('h-7 w-7', isActive ? 'text-[#16A34A]' : 'text-[#16A34A]/70')} />
                ) : normalized === 'OPEN' ? (
                  <div className="relative flex h-9 w-9 items-center justify-center">
                    <Circle className={cn('h-9 w-9 text-[#2563EB]/35')} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className={cn(
                          'h-2.5 w-2.5 rounded-full bg-[#2563EB] animate-pulse',
                          isActive ? 'opacity-100' : 'opacity-80',
                        )}
                      />
                    </div>
                  </div>
                ) : (
                  <Circle className={cn('h-9 w-9 text-slate-300', isActive ? 'text-slate-400' : '')} />
                )}
                <div className={cn('text-xs font-semibold', isActive ? 'text-slate-900' : 'text-slate-500')}>
                  V{round.round_number}
                </div>
              </button>

              {idx < ordered.length - 1 ? (
                <div className="mt-1 h-[2px] w-full bg-black/10">
                  <div className={cn('h-full', lineColor)} />
                </div>
              ) : null}
              <div className={cn('mt-1 text-[11px] text-center', isActive ? 'text-slate-700' : 'text-slate-500')}>
                {round.round_name}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

