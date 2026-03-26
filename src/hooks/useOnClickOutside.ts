/**
 * Hook đóng UI khi người dùng click ra ngoài phần tử được chỉ định.
 */
import { useEffect } from 'react'
import type { RefObject } from 'react'

export function useOnClickOutside<T extends HTMLElement>({
  ref,
  handler,
  enabled = true,
}: {
  ref: RefObject<T | null>
  handler: (event: MouseEvent | TouchEvent) => void
  enabled?: boolean
}) {
  useEffect(() => {
    if (!enabled) return

    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current
      if (!el) return
      if (event.target instanceof Node && !el.contains(event.target)) handler(event)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [enabled, handler, ref])
}

