'use client';

import { useState } from 'react';

import { BOARD_HALF } from '@/lib/constants';
import { clamp } from '@/lib/utils';
import type { ViewportState } from '@/types/board';

const INITIAL_SCALE = 0.8;

export function useBoardViewport() {
  const [viewport, setViewport] = useState<ViewportState>({
    x: -BOARD_HALF * INITIAL_SCALE + 460,
    y: -BOARD_HALF * INITIAL_SCALE + 320,
    scale: INITIAL_SCALE
  });

  const zoom = (delta: number, center?: { x: number; y: number }) => {
    setViewport((current) => {
      const nextScale = clamp(current.scale + delta, 0.45, 1.8);
      if (!center) {
        return { ...current, scale: nextScale };
      }

      const worldX = (center.x - current.x) / current.scale;
      const worldY = (center.y - current.y) / current.scale;

      return {
        x: center.x - worldX * nextScale,
        y: center.y - worldY * nextScale,
        scale: nextScale
      };
    });
  };

  const panBy = (dx: number, dy: number) => {
    setViewport((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
  };

  const reset = () => {
    setViewport({
      x: -BOARD_HALF * INITIAL_SCALE + 460,
      y: -BOARD_HALF * INITIAL_SCALE + 320,
      scale: INITIAL_SCALE
    });
  };

  return { viewport, setViewport, zoom, panBy, reset };
}
