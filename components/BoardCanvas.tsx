'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SharedNote } from '@/components/SharedNote';
import { BOARD_SIZE } from '@/lib/constants';
import { findNearestStroke, pointsToSvgPath } from '@/lib/geometry';
import { cn } from '@/lib/utils';
import type {
  EraserMode,
  PresenceUser,
  Stroke,
  StrokePoint,
  TextNote,
  Tool,
  ViewportState
} from '@/types/board';

type BoardCanvasProps = {
  tool: Tool;
  eraserMode: EraserMode;
  color: string;
  width: number;
  viewport: ViewportState;
  strokes: Stroke[];
  notes: TextNote[];
  participants: PresenceUser[];
  localUserId: string;
  onPan: (dx: number, dy: number) => void;
  onZoom: (delta: number, center?: { x: number; y: number }) => void;
  onBeginStroke: (point: StrokePoint) => void;
  onExtendStroke: (point: StrokePoint) => void;
  onEndStroke: () => void;
  onEraseStroke: (strokeId: string, point: StrokePoint, mode: EraserMode, radius: number) => void;
  onAddNote: (point: StrokePoint) => void;
  onMoveNote: (id: string, x: number, y: number) => void;
  onUpdateNote: (id: string, value: string) => void;
  onDeleteNote: (id: string) => void;
  onCursorMove: (cursor: { x: number; y: number; pointerDown: boolean } | null) => void;
};

export function BoardCanvas({
  tool,
  eraserMode,
  color,
  width,
  viewport,
  strokes,
  notes,
  participants,
  localUserId,
  onPan,
  onZoom,
  onBeginStroke,
  onExtendStroke,
  onEndStroke,
  onEraseStroke,
  onAddNote,
  onMoveNote,
  onUpdateNote,
  onDeleteNote,
  onCursorMove
}: BoardCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  type GestureState = {
    mode: 'draw' | 'pan' | 'erase';
    x: number;
    y: number;
    worldPoint?: StrokePoint;
  };
  
  const gestureRef = useRef<GestureState | null>(null);
  const eraserRadius = Math.max(width * 1.5, 6);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  const worldPointFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) return { x: 0, y: 0 };
      return {
        x: (clientX - bounds.left - viewport.x) / viewport.scale,
        y: (clientY - bounds.top - viewport.y) / viewport.scale
      };
    },
    [viewport.x, viewport.y, viewport.scale]
  );

  const screenPointFromWorld = (point: StrokePoint) => ({
    x: point.x * viewport.scale + viewport.x,
    y: point.y * viewport.scale + viewport.y
  });

  const samplePath = useCallback(
    (from: StrokePoint, to: StrokePoint) => {
      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      const steps = Math.max(1, Math.ceil(distance / Math.max(eraserRadius * 0.6, 1)));
      const samples: StrokePoint[] = [];

      for (let index = 0; index <= steps; index += 1) {
        const ratio = index / steps;
        samples.push({
          x: from.x + (to.x - from.x) * ratio,
          y: from.y + (to.y - from.y) * ratio
        });
      }

      return samples;
    },
    [eraserRadius]
  );

  const remoteCursors = useMemo(
    () => participants.filter((participant) => participant.id !== localUserId && participant.cursor),
    [localUserId, participants]
  );

  useEffect(() => {
    if (activeNoteId && !notes.some((note) => note.id === activeNoteId)) {
      setActiveNoteId(null);
    }
  }, [activeNoteId, notes]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!activeNoteId) return;
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;

      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        target?.isContentEditable;

      if (isTypingTarget) return;

      event.preventDefault();
      onDeleteNote(activeNoteId);
      setActiveNoteId(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeNoteId, onDeleteNote]);

  useEffect(() => {
    const handleWindowPointerMove = (event: PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture) return;

      const worldPoint = worldPointFromClient(event.clientX, event.clientY);

      if (gesture.mode === 'pan') {
        onPan(event.clientX - gesture.x, event.clientY - gesture.y);
        gestureRef.current = { ...gesture, x: event.clientX, y: event.clientY };
        return;
      }

      if (gesture.mode === 'draw') {
        onExtendStroke(worldPoint);
      }

      if (gesture.mode === 'erase') {
        const previousWorldPoint = gesture.worldPoint ?? worldPoint;
        const samples = samplePath(previousWorldPoint, worldPoint);

        for (const sample of samples) {
          const match = findNearestStroke(sample, strokes, eraserRadius);
          if (match) {
            onEraseStroke(match.stroke.id, sample, eraserMode, eraserRadius);
          }
        }

        gestureRef.current = { ...gesture, worldPoint };
      }

      onCursorMove({ ...worldPoint, pointerDown: true });
    };

    const handleWindowPointerUp = () => {
      if (gestureRef.current?.mode === 'draw') {
        onEndStroke();
      }

      gestureRef.current = null;
      onCursorMove(null);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [eraserMode, eraserRadius, onCursorMove, onEndStroke, onEraseStroke, onExtendStroke, onPan, samplePath, strokes, worldPointFromClient]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setActiveNoteId(null);
    }

    const worldPoint = worldPointFromClient(event.clientX, event.clientY);

    if (tool === 'text') {
      onAddNote(worldPoint);
      return;
    }

    if (tool === 'pan') {
      gestureRef.current = { mode: 'pan', x: event.clientX, y: event.clientY };
      return;
    }

    if (tool === 'eraser') {
      gestureRef.current = { mode: 'erase', x: event.clientX, y: event.clientY, worldPoint };
      const match = findNearestStroke(worldPoint, strokes, eraserRadius);
      if (match) {
        onEraseStroke(match.stroke.id, worldPoint, eraserMode, eraserRadius);
      }
      onCursorMove({ ...worldPoint, pointerDown: true });
      return;
    }

    gestureRef.current = { mode: 'draw', x: event.clientX, y: event.clientY };
    onBeginStroke(worldPoint);
    onCursorMove({ ...worldPoint, pointerDown: true });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const worldPoint = worldPointFromClient(event.clientX, event.clientY);
    onCursorMove({ ...worldPoint, pointerDown: Boolean(gestureRef.current) });
  };

  const handlePointerUp = () => {
    if (gestureRef.current?.mode === 'draw') {
      onEndStroke();
    }

    gestureRef.current = null;
    onCursorMove(null);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    onZoom(event.deltaY > 0 ? -0.08 : 0.08, {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    });
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative h-[calc(100vh-14rem)] min-h-[620px] touch-none overflow-hidden rounded-[30px] border border-white/70 bg-[#f7f1e8] shadow-panel',
        tool === 'pan' && 'cursor-grab active:cursor-grabbing',
        tool === 'draw' && 'cursor-crosshair',
        tool === 'eraser' && 'cursor-cell',
        tool === 'text' && 'cursor-copy'
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => onCursorMove(null)}
      onWheel={handleWheel}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(24,22,20,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(24,22,20,0.05)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: BOARD_SIZE,
          height: BOARD_SIZE,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`
        }}
      >
        <svg width={BOARD_SIZE} height={BOARD_SIZE} className="absolute inset-0 overflow-visible">
          {strokes.map((stroke) => (
            <path
              key={stroke.id}
              d={pointsToSvgPath(stroke.points)}
              fill="none"
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>

        {notes.map((note) => (
          <SharedNote
            key={note.id}
            note={note}
            scale={viewport.scale}
            isActive={activeNoteId === note.id}
            onFocus={setActiveNoteId}
            onMove={onMoveNote}
            onChange={onUpdateNote}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0">
        {remoteCursors.map((participant) => {
          if (!participant.cursor) return null;
          const screen = screenPointFromWorld(participant.cursor);

          return (
            <div
              key={participant.id}
              className="absolute"
              style={{ left: screen.x, top: screen.y, transform: 'translate(-2px, -2px)' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 2L14 8.5L9 10L8 15L3 2Z" fill={participant.color} stroke="white" />
              </svg>
              <div
                className="mt-1 rounded-full px-2 py-1 text-[10px] font-semibold text-white shadow"
                style={{ backgroundColor: participant.color }}
              >
                {participant.name}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-ink/10 bg-white/75 px-4 py-2 text-xs uppercase tracking-[0.25em] text-ink/55 backdrop-blur">
        {tool}
        {tool === 'eraser' ? `:${eraserMode}` : ''} · {color} · {width}px
      </div>
    </div>
  );
}
