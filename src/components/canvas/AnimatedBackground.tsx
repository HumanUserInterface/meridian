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

    const parent = canvas.parentElement;
    if (!parent) return;

    // Function to update canvas size
    const updateCanvasSize = () => {
      const rect = parent.getBoundingClientRect();
      // Use device pixel ratio for crisp rendering
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      return { width: rect.width, height: rect.height };
    };

    let dimensions = updateCanvasSize();
    const [tx, ty, zoom] = transform;

    const draw = () => {
      const { width, height } = dimensions;

      // Reset transform before clearing (in case of dpr scaling)
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, width, height);

      // Fixed gap on screen - dots stay at consistent visual spacing
      // The gap is fixed, we just offset based on the pan position
      const screenGap = gap;

      // Calculate offset based on transform (accounting for zoom)
      // When panning, the dots should move with the canvas
      const offsetX = ((tx / zoom) % screenGap + screenGap) % screenGap;
      const offsetY = ((ty / zoom) % screenGap + screenGap) % screenGap;

      const baseColor = isDark ? 'rgba(80, 80, 95, 0.9)' : 'rgba(170, 170, 185, 0.9)';
      const activeColor = isDark ? 'rgba(120, 120, 150, 1)' : 'rgba(130, 130, 160, 1)';
      const time = Date.now();

      // Draw dots at fixed screen intervals
      for (let px = offsetX - screenGap; px < width + screenGap; px += screenGap) {
        for (let py = offsetY - screenGap; py < height + screenGap; py += screenGap) {
          let size = dotSize;
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

    // Use ResizeObserver to handle parent element size changes (e.g., sidebar collapse)
    const resizeObserver = new ResizeObserver(() => {
      dimensions = updateCanvasSize();
      draw();
    });

    resizeObserver.observe(parent);

    return () => {
      resizeObserver.disconnect();
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
