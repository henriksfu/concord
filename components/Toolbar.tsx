'use client';

import { ConnectionBadge } from '@/components/ConnectionBadge';
import {
  EraserIcon,
  HandIcon,
  PencilIcon,
  RedoIcon,
  TrashIcon,
  TypeIcon,
  UndoIcon,
  ZoomInIcon,
  ZoomOutIcon
} from '@/components/icons';
import { PresenceStack } from '@/components/PresenceStack';
import { STROKE_COLORS, STROKE_WIDTHS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ConnectionState, EraserMode, PresenceUser, Tool } from '@/types/board';

type ToolbarProps = {
  tool: Tool;
  eraserMode: EraserMode;
  color: string;
  width: number;
  roomId: string;
  participants: PresenceUser[];
  connection: ConnectionState;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: Tool) => void;
  onEraserModeChange: (mode: EraserMode) => void;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportPdf: () => void;
  onExportJson: () => void;
};

const toolButtons: Array<{ id: Tool; label: string; icon: typeof PencilIcon }> = [
  { id: 'draw', label: 'Pencil', icon: PencilIcon },
  { id: 'text', label: 'Text', icon: TypeIcon },
  { id: 'eraser', label: 'Eraser', icon: EraserIcon },
  { id: 'pan', label: 'Pan', icon: HandIcon }
];

export function Toolbar({
  tool,
  eraserMode,
  color,
  width,
  roomId,
  participants,
  connection,
  canUndo,
  canRedo,
  onToolChange,
  onEraserModeChange,
  onColorChange,
  onWidthChange,
  onUndo,
  onRedo,
  onClear,
  onZoomIn,
  onZoomOut,
  onResetView,
  onExportPng,
  onExportSvg,
  onExportPdf,
  onExportJson
}: ToolbarProps) {
  return (
    <div className="relative z-20 flex w-full flex-col gap-4 rounded-[28px] border border-white/70 bg-parchment/80 p-4 shadow-panel backdrop-blur-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-ink/45">Room</p>
            <p className="font-display text-lg text-ink">{roomId}</p>
          </div>
          <ConnectionBadge status={connection} />
        </div>
        <PresenceStack participants={participants} />
      </div>

      <div className="flex flex-col gap-4 border-t border-ink/10 pt-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {toolButtons.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onToolChange(id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition',
                tool === id
                  ? 'border-ink bg-ink text-parchment'
                  : 'border-ink/10 bg-white/70 text-ink/75 hover:border-ink/25 hover:bg-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}

          {tool === 'eraser' && (
            <div className="ml-2 flex items-center gap-1 rounded-full border border-ink/10 bg-white/70 p-1">
              {[
                { id: 'partial', label: 'Partial' },
                { id: 'whole', label: 'Whole' }
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onEraserModeChange(option.id as EraserMode)}
                  className={cn(
                    'rounded-full px-3 py-2 text-xs transition',
                    eraserMode === option.id
                      ? 'bg-ink text-parchment'
                      : 'text-ink/70 hover:bg-white hover:text-ink'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 p-2">
            {STROKE_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Select ${swatch} color`}
                onClick={() => onColorChange(swatch)}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition',
                  color === swatch ? 'scale-110 border-ink' : 'border-white hover:scale-105'
                )}
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-2 py-2">
            {STROKE_WIDTHS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onWidthChange(value)}
                className={cn(
                  'inline-flex h-8 w-8 items-center justify-center rounded-full border transition',
                  width === value
                    ? 'border-ink bg-ink text-white'
                    : 'border-transparent bg-mist text-ink hover:border-ink/15'
                )}
              >
                <span
                  className="rounded-full bg-current"
                  style={{ width: Math.min(value + 2, 16), height: Math.min(value + 2, 16) }}
                />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-white/70 text-ink transition hover:border-ink/20 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Undo"
            >
              <UndoIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-white/70 text-ink transition hover:border-ink/20 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Redo"
            >
              <RedoIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onZoomOut}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-white/70 text-ink transition hover:border-ink/20 hover:bg-white"
              aria-label="Zoom out"
            >
              <ZoomOutIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onZoomIn}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-white/70 text-ink transition hover:border-ink/20 hover:bg-white"
              aria-label="Zoom in"
            >
              <ZoomInIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onResetView}
              className="rounded-full border border-ink/10 bg-white/70 px-3 py-2 text-sm text-ink transition hover:border-ink/20 hover:bg-white"
            >
              Reset view
            </button>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-2 rounded-full border border-red-600/15 bg-red-600/10 px-4 py-2 text-sm text-red-700 transition hover:border-red-600/30 hover:bg-red-600/15"
            >
              <TrashIcon className="h-4 w-4" />
              Clear
            </button>
            <details className="relative">
              <summary className="list-none cursor-pointer rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm text-ink transition hover:border-ink/20 hover:bg-white">
                Export
              </summary>
              <div className="absolute right-0 z-40 mt-2 w-48 rounded-2xl border border-ink/10 bg-white/95 p-2 shadow-panel backdrop-blur">
                <button
                  type="button"
                  onClick={onExportPng}
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm text-ink/85 transition hover:bg-mist"
                >
                  Download PNG
                </button>
                <button
                  type="button"
                  onClick={onExportSvg}
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm text-ink/85 transition hover:bg-mist"
                >
                  Download SVG
                </button>
                <button
                  type="button"
                  onClick={onExportPdf}
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm text-ink/85 transition hover:bg-mist"
                >
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={onExportJson}
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm text-ink/85 transition hover:bg-mist"
                >
                  Download JSON
                </button>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
