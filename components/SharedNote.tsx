'use client';

import { useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import type { TextNote } from '@/types/board';

type SharedNoteProps = {
  note: TextNote;
  scale: number;
  isActive: boolean;
  onFocus: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onChange: (id: string, value: string) => void;
};

export function SharedNote({ note, scale, isActive, onFocus, onMove, onChange }: SharedNoteProps) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<{ x: number; y: number; noteX: number; noteY: number } | null>(null);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!(event.target instanceof HTMLElement) || !event.target.dataset.dragHandle) return;
    event.stopPropagation();
    setDragging(true);
    startRef.current = {
      x: event.clientX,
      y: event.clientY,
      noteX: note.x,
      noteY: note.y
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    onFocus(note.id);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !startRef.current) return;
    const deltaX = (event.clientX - startRef.current.x) / scale;
    const deltaY = (event.clientY - startRef.current.y) / scale;
    onMove(note.id, startRef.current.noteX + deltaX, startRef.current.noteY + deltaY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    startRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      className={cn(
        'absolute w-64 rounded-[22px] border border-ink/10 bg-[#fff8df] shadow-float transition',
        isActive && 'ring-2 ring-ember/40'
      )}
      style={{ left: note.x, top: note.y }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        className="cursor-grab rounded-t-[22px] border-b border-ink/10 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-ink/45 active:cursor-grabbing"
        data-drag-handle
      >
        Shared note
      </div>
      <textarea
        value={note.content}
        onFocus={() => onFocus(note.id)}
        onChange={(event) => onChange(note.id, event.target.value)}
        className="min-h-36 w-full resize-none rounded-b-[22px] bg-transparent px-4 py-3 font-body text-sm leading-6 text-ink outline-none"
        spellCheck={false}
      />
    </div>
  );
}
