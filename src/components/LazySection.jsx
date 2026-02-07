import { useEffect, useRef, useState } from 'react'

/**
 * LazySection
 * - Mounts children only when the section becomes visible (IntersectionObserver)
 * - Keeps a reserved minHeight to avoid layout shift
 */
export default function LazySection({ minHeight = 200, rootMargin = '200px', className = '', children }) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isVisible) return
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setIsVisible(true)
          obs.disconnect()
        }
      },
      { root: null, rootMargin, threshold: 0.01 }
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [isVisible, rootMargin])

  return (
    <section ref={ref} className={className} style={{ minHeight }}>
      {isVisible ? children : null}
    </section>
  )
}
