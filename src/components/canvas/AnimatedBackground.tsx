'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@xyflow/react';

interface AnimatedBackgroundProps {
  isDark: boolean;
  gap?: number;
  dotSize?: number;
  isDragging?: boolean;
  dragPosition?: { x: number; y: number } | null;
}

export default function AnimatedBackground({
  isDark,
  gap = 24,
  dotSize = 1.5,
  isDragging = false,
  dragPosition = null
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const transform = useStore((state) => state.transform);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    const { width, height } = canvas;
    const [tx, ty, zoom] = transform;
    const scaledGap = gap * zoom;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const offsetX = ((tx % scaledGap) + scaledGap) % scaledGap;
      const offsetY = ((ty % scaledGap) + scaledGap) % scaledGap;

      const baseColor = isDark ? 'rgba(80, 80, 95, 0.9)' : 'rgba(170, 170, 185, 0.9)';
      const activeColor = isDark ? 'rgba(120, 120, 150, 1)' : 'rgba(130, 130, 160, 1)';
      const time = Date.now();

      for (let px = offsetX - scaledGap; px < width + scaledGap; px += scaledGap) {
        for (let py = offsetY - scaledGap; py < height + scaledGap; py += scaledGap) {
          let size = dotSize * Math.max(0.8, zoom);
          let x = px;
          let y = py;
          let color = baseColor;

          if (isDragging && dragPosition) {
            const dx = px - dragPosition.x;
            const dy = py - dragPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 200;

            if (distance < maxDist) {
              const t = 1 - distance / maxDist;
              const wave = Math.sin(time * 0.006 + distance * 0.03) * t * 4;
              const angle = Math.atan2(dy, dx);

              x += Math.cos(angle) * wave;
              y += Math.sin(angle) * wave;
              size += t * 2 * (0.5 + 0.5 * Math.sin(time * 0.008));
              color = activeColor;
            }
          }

          ctx.beginPath();
          ctx.arc(x, y, Math.max(0.5, size), 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      }

      if (isDragging && dragPosition) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    const handleResize = () => {
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        draw();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [transform, gap, dotSize, isDark, isDragging, dragPosition]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
}
