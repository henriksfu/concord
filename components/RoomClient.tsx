'use client';

import { useMemo, useState } from 'react';

import { BoardCanvas } from '@/components/BoardCanvas';
import { CodeCollabPanel } from '@/components/CodeCollabPanel';
import { LiveCollabPanel } from '@/components/LiveCollabPanel';
import { Toolbar } from '@/components/Toolbar';
import { useBoardViewport } from '@/hooks/useBoardViewport';
import { useCollaborativeRoom } from '@/hooks/useCollaborativeRoom';
import { useRealtimeCollab } from '@/hooks/useRealtimeCollab';
import { exportBoardAsJson, exportBoardAsPdf, exportBoardAsPng, exportBoardAsSvg } from '@/lib/export';
import { DEFAULT_STROKE_COLOR, DEFAULT_STROKE_WIDTH } from '@/lib/constants';
import { getStoredIdentity } from '@/lib/identity';
import { isValidRoomId } from '@/lib/room';
import type { EraserMode, Tool } from '@/types/board';

export function RoomClient({
  roomId,
  workspace
}: {
  roomId: string;
  workspace: 'whiteboard' | 'code';
}) {
  const identity = useMemo(() => getStoredIdentity(), []);
  const [tool, setTool] = useState<Tool>('draw');
  const [eraserMode, setEraserMode] = useState<EraserMode>('partial');
  const [color, setColor] = useState(DEFAULT_STROKE_COLOR);
  const [width, setWidth] = useState(DEFAULT_STROKE_WIDTH);
  const { viewport, panBy, zoom, reset } = useBoardViewport();
  const room = useCollaborativeRoom(roomId, identity);
  const liveCollab = useRealtimeCollab(roomId, identity);

  if (!isValidRoomId(roomId)) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="rounded-[28px] border border-ink/10 bg-white/80 p-10 shadow-panel">
          <p className="text-sm uppercase tracking-[0.3em] text-ink/45">Invalid room id</p>
          <h1 className="mt-3 font-display text-4xl text-ink">This room link is malformed.</h1>
          <p className="mt-4 text-base text-ink/70">
            Use lowercase letters, numbers, and dashes only. Generate a clean room from the home page.
          </p>
          <a
            href="/"
            className="mt-8 inline-flex rounded-full bg-ink px-5 py-3 text-sm text-parchment transition hover:bg-ink/90"
          >
            Back to launcher
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        {workspace === 'whiteboard' ? (
          <>
            <Toolbar
              tool={tool}
              eraserMode={eraserMode}
              color={color}
              width={width}
              roomId={roomId}
              participants={room.participants}
              connection={room.connection}
              canUndo={room.canUndo}
              canRedo={room.canRedo}
              onToolChange={setTool}
              onEraserModeChange={setEraserMode}
              onColorChange={setColor}
              onWidthChange={setWidth}
              onUndo={room.undo}
              onRedo={room.redo}
              onClear={() => {
                if (window.confirm('Clear all strokes and notes for everyone in this room?')) {
                  room.clearBoard();
                }
              }}
              onZoomIn={() => zoom(0.1)}
              onZoomOut={() => zoom(-0.1)}
              onResetView={reset}
              onExportPng={() => exportBoardAsPng({ roomId, strokes: room.strokes, notes: room.notes })}
              onExportSvg={() => exportBoardAsSvg({ roomId, strokes: room.strokes, notes: room.notes })}
              onExportPdf={() => exportBoardAsPdf({ roomId, strokes: room.strokes, notes: room.notes })}
              onExportJson={() => exportBoardAsJson({ roomId, strokes: room.strokes, notes: room.notes })}
            />

            <BoardCanvas
              tool={tool}
              eraserMode={eraserMode}
              color={color}
              width={width}
              viewport={viewport}
              strokes={room.strokes}
              notes={room.notes}
              participants={room.participants}
              localUserId={identity.id}
              onPan={panBy}
              onZoom={zoom}
              onBeginStroke={(point) => room.beginStroke(point, color, width)}
              onExtendStroke={room.pushStrokePoint}
              onEndStroke={room.finishStroke}
              onEraseStroke={(strokeId, point, mode, radius) =>
                room.eraseStrokeAtPoint(strokeId, point, mode, radius)
              }
              onAddNote={(point) => {
                const noteId = room.addNote(point);
                if (noteId) {
                  setTool('pan');
                }
              }}
              onMoveNote={room.moveNote}
              onUpdateNote={room.updateNoteContent}
              onDeleteNote={room.deleteNote}
              onCursorMove={room.updateCursor}
            />
          </>
        ) : (
          <CodeCollabPanel
            roomId={roomId}
            participants={room.participants}
            connection={room.connection}
            content={room.codeContent}
            language={room.codeLanguage}
            theme={room.codeTheme}
            onContentChange={room.updateCodeContent}
            onLanguageChange={room.setCodeLanguage}
            onThemeChange={room.setCodeTheme}
          />
        )}
      </div>
      <LiveCollabPanel
        connected={liveCollab.connected}
        onlineUsers={liveCollab.onlineUsers}
        messages={room.chatMessages}
        remoteStreams={liveCollab.remoteStreams}
        localStream={liveCollab.localStream}
        micEnabled={liveCollab.micEnabled}
        cameraEnabled={liveCollab.cameraEnabled}
        panelOpen={liveCollab.panelOpen}
        panelTab={liveCollab.panelTab}
        onPanelOpenChange={liveCollab.setPanelOpen}
        onPanelTabChange={liveCollab.setPanelTab}
        onSendChat={room.sendChatMessage}
        onStartCall={liveCollab.startCall}
        onStopCall={liveCollab.stopCall}
        onToggleMic={liveCollab.toggleMic}
        onToggleCamera={liveCollab.toggleCamera}
      />
    </main>
  );
}
