import { useEffect, useRef, useState } from 'react'

export function useIntersectionObserver(options = {}) {
    const [isInView, setIsInView] = useState(false)
    const [hasAnimated, setHasAnimated] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setIsInView(true)
                    setHasAnimated(true)
                }
            },
            {
                threshold: 0.1,
                rootMargin: '50px',
                ...options,
            }
        )

        const currentRef = ref.current
        if (currentRef) {
            observer.observe(currentRef)
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef)
            }
        }
    }, [hasAnimated, options])

    return { ref, isInView, hasAnimated }
}
