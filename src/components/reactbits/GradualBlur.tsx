'use client'

import React, { CSSProperties, useMemo } from 'react'

interface GradualBlurProps {
  position?: 'top' | 'bottom'
  strength?: number
  height?: string
  divCount?: number
  zIndex?: number
  className?: string
}

const getGradientDirection = (position: string) =>
  position === 'top' ? 'to top' : 'to bottom'

export default function GradualBlur({
  position = 'bottom',
  strength = 2,
  height = '6rem',
  divCount = 5,
  zIndex = 50,
  className = '',
}: GradualBlurProps) {
  const blurDivs = useMemo(() => {
    const divs: React.ReactNode[] = []
    const increment = 100 / divCount
    const direction = getGradientDirection(position)

    for (let i = 1; i <= divCount; i++) {
      const progress = i / divCount
      const blurValue = 0.0625 * (progress * divCount + 1) * strength

      const p1 = Math.round((increment * i - increment) * 10) / 10
      const p2 = Math.round(increment * i * 10) / 10
      const p3 = Math.round((increment * i + increment) * 10) / 10
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10

      let gradient = `transparent ${p1}%, black ${p2}%`
      if (p3 <= 100) gradient += `, black ${p3}%`
      if (p4 <= 100) gradient += `, transparent ${p4}%`

      const style: CSSProperties = {
        maskImage: `linear-gradient(${direction}, ${gradient})`,
        WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
        backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
      }

      divs.push(<div key={i} className="absolute inset-0" style={style} />)
    }

    return divs
  }, [position, strength, divCount])

  const containerStyle: CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    height,
    width: '100%',
    [position]: 0,
    left: 0,
    right: 0,
    zIndex,
  }

  return (
    <div className={`isolate ${className}`} style={containerStyle}>
      <div className="relative w-full h-full">{blurDivs}</div>
    </div>
  )
}
