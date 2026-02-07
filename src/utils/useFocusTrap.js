import { useEffect } from 'react'

/**
 * useFocusTrap
 * - Traps Tab/Shift+Tab within a container while active.
 * - Restores focus to the previously focused element on deactivation.
 *
 * Safe guards:
 * - No-op if containerRef.current is null.
 * - All DOM access is inside effects.
 */
const getFocusable = (root) => {
  if (!root) return []
  const selectors = [
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ]
  const nodes = Array.from(root.querySelectorAll(selectors.join(',')))
  return nodes.filter((el) => {
    // Exclude hidden / inert elements
    const style = window.getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') return false
    if (el.hasAttribute('aria-hidden')) return false
    // offsetParent null catches display:none, but not fixed elements; keep computedStyle check above
    return true
  })
}

export default function useFocusTrap(containerRef, isActive) {
  useEffect(() => {
    if (!isActive) return

    const container = containerRef?.current
    if (!container) return

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null

    // Focus something inside on next tick (after DOM paints)
    const raf = window.requestAnimationFrame(() => {
      const focusables = getFocusable(container)
      const target = focusables[0] || container
      if (target instanceof HTMLElement) {
        // Prevent scroll jumps
        try { target.focus({ preventScroll: true }) } catch { target.focus() }
      }
    })

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return
      const focusables = getFocusable(container)
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement

      if (e.shiftKey) {
        if (active === first || active === container) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    container.addEventListener('keydown', onKeyDown)

    return () => {
      window.cancelAnimationFrame(raf)
      container.removeEventListener('keydown', onKeyDown)
      if (previouslyFocused) {
        try { previouslyFocused.focus({ preventScroll: true }) } catch { previouslyFocused.focus() }
      }
    }
  }, [containerRef, isActive])
}
