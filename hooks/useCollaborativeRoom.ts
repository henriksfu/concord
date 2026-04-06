'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

import {
  createNoteType,
  createStrokeType,
  getNotesMap,
  getNoteText,
  getStrokePoints,
  getStrokesMap,
  parseNote,
  parseStroke,
  syncYText
} from '@/lib/yjs/board';
import { splitStrokeByEraser } from '@/lib/geometry';
import { generateId } from '@/lib/utils';
import type {
  ConnectionState,
  CursorState,
  PresenceUser,
  Stroke,
  StrokePoint,
  TextNote,
  UserIdentity
} from '@/types/board';

type RoomChatMessage = {
  id: string;
  text: string;
  timestamp: number;
  user: {
    id: string;
    name: string;
    color: string;
  };
};

type MutableStroke = {
  id: string;
  type: Y.Map<unknown>;
  pending: StrokePoint[];
};

type RoomState = {
  doc: Y.Doc | null;
  strokes: Stroke[];
  notes: TextNote[];
  noteTypes: Map<string, Y.Map<unknown>>;
  chatMessages: RoomChatMessage[];
  codeContent: string;
  codeLanguage: string;
  codeTheme: 'light' | 'dark';
  participants: PresenceUser[];
  connection: ConnectionState;
  canUndo: boolean;
  canRedo: boolean;
};

export function useCollaborativeRoom(roomId: string, user: UserIdentity) {
  const originRef = useRef({ scope: 'local-user' });
  const providerRef = useRef<WebsocketProvider | null>(null);
  const undoManagerRef = useRef<Y.UndoManager | null>(null);
  const draftStrokeRef = useRef<MutableStroke | null>(null);
  const [roomState, setRoomState] = useState<RoomState>({
    doc: null,
    strokes: [],
    notes: [],
    noteTypes: new Map(),
    chatMessages: [],
    codeContent: '',
    codeLanguage: 'typescript',
    codeTheme: 'dark',
    participants: [],
    connection: 'connecting',
    canUndo: false,
    canRedo: false
  });

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const doc = new Y.Doc();
    const provider = new WebsocketProvider(`${protocol}://${window.location.host}/yjs`, roomId, doc, {
      connect: true
    });
    const strokesMap = getStrokesMap(doc);
    const notesMap = getNotesMap(doc);
    const chatMessages = doc.getArray<Y.Map<unknown>>('chat-messages');
    const codeText = doc.getText('code-content');
    const codeMeta = doc.getMap<string>('code-meta');
    if (!codeMeta.get('language')) {
      codeMeta.set('language', 'typescript');
    }
    if (!codeMeta.get('theme')) {
      codeMeta.set('theme', 'dark');
    }

    const undoManager = new Y.UndoManager([strokesMap, notesMap, codeText, codeMeta], {
      trackedOrigins: new Set([originRef.current])
    });

    providerRef.current = provider;
    undoManagerRef.current = undoManager;

    const syncState = () => {
      const noteTypes = new Map<string, Y.Map<unknown>>();
      const strokes = Array.from(strokesMap.values()).map(parseStroke).sort((a, b) => a.createdAt - b.createdAt);
      const notes = Array.from(notesMap.values())
        .map((noteType) => {
          const note = parseNote(noteType);
          noteTypes.set(note.id, noteType);
          return note;
        })
        .sort((a, b) => a.updatedAt - b.updatedAt);

      setRoomState((current) => ({
        ...current,
        doc,
        strokes,
        notes,
        noteTypes,
        chatMessages: chatMessages.toArray().map((entry) => ({
          id: String(entry.get('id') ?? ''),
          text: String(entry.get('text') ?? ''),
          timestamp: Number(entry.get('timestamp') ?? Date.now()),
          user: {
            id: String(entry.get('userId') ?? ''),
            name: String(entry.get('userName') ?? 'User'),
            color: String(entry.get('userColor') ?? '#181614')
          }
        })),
        codeContent: codeText.toString(),
        codeLanguage: codeMeta.get('language') ?? 'typescript',
        codeTheme: codeMeta.get('theme') === 'light' ? 'light' : 'dark',
        canUndo: undoManager.undoStack.length > 0,
        canRedo: undoManager.redoStack.length > 0
      }));
    };

    const syncAwareness = () => {
      const states = Array.from(provider.awareness.getStates().values());
      const participants = states
        .map((value) => {
          const userState = value.user as UserIdentity | undefined;
          if (!userState) return null;
          return {
            ...userState,
            cursor: (value.cursor as CursorState | undefined) ?? null
          };
        })
        .filter(Boolean) as PresenceUser[];

      setRoomState((current) => ({ ...current, participants }));
    };

    const syncStatus = ({ status }: { status: 'connected' | 'disconnected' }) => {
      setRoomState((current) => ({
        ...current,
        connection:
          status === 'connected'
            ? 'connected'
            : navigator.onLine
              ? 'reconnecting'
              : 'offline'
      }));
    };

    provider.awareness.setLocalStateField('user', user);
    provider.awareness.setLocalStateField('cursor', null);
    provider.awareness.on('change', syncAwareness);
    provider.on('status', syncStatus);
    provider.on('sync', syncState);
    strokesMap.observeDeep(syncState);
    notesMap.observeDeep(syncState);
    chatMessages.observe(syncState);
    codeText.observe(syncState);
    codeMeta.observe(syncState);
    undoManager.on('stack-item-added', syncState);
    undoManager.on('stack-item-popped', syncState);

    const handleOnline = () => {
      setRoomState((current) => ({ ...current, connection: 'reconnecting' }));
      provider.connect();
    };
    const handleOffline = () => {
      setRoomState((current) => ({ ...current, connection: 'offline' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    syncState();
    syncAwareness();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      provider.awareness.setLocalStateField('cursor', null);
      provider.awareness.off('change', syncAwareness);
      provider.off('status', syncStatus);
      provider.off('sync', syncState);
      strokesMap.unobserveDeep(syncState);
      notesMap.unobserveDeep(syncState);
      chatMessages.unobserve(syncState);
      codeText.unobserve(syncState);
      codeMeta.unobserve(syncState);
      undoManager.off('stack-item-added', syncState);
      undoManager.off('stack-item-popped', syncState);
      draftStrokeRef.current = null;
      undoManager.destroy();
      provider.destroy();
      doc.destroy();
      providerRef.current = null;
      undoManagerRef.current = null;
    };
  }, [roomId, user]);

  const updateCursor = useCallback((cursor: CursorState) => {
    providerRef.current?.awareness.setLocalStateField('cursor', cursor);
  }, []);

  const beginStroke = useCallback(
    (point: StrokePoint, color: string, width: number) => {
      const doc = roomState.doc;
      if (!doc) return;

      const id = generateId('stroke');
      const strokeType = createStrokeType({
        id,
        color,
        width,
        createdBy: user.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        points: [point]
      });

      doc.transact(() => {
        getStrokesMap(doc).set(id, strokeType);
      }, originRef.current);

      draftStrokeRef.current = { id, type: strokeType, pending: [] };
    },
    [roomState.doc, user.id]
  );

  const pushStrokePoint = useCallback((point: StrokePoint) => {
    const draft = draftStrokeRef.current;
    if (!draft) return;
    draft.pending.push(point);

    if (draft.pending.length < 2) return;

    const pending = [...draft.pending];
    draft.pending = [];
    draft.type.doc?.transact(() => {
      getStrokePoints(draft.type).push(pending);
      draft.type.set('updatedAt', Date.now());
    }, originRef.current);
  }, []);

  const finishStroke = useCallback(() => {
    const draft = draftStrokeRef.current;
    if (!draft) return;

    if (draft.pending.length > 0) {
      const pending = [...draft.pending];
      draft.pending = [];
      draft.type.doc?.transact(() => {
        getStrokePoints(draft.type).push(pending);
        draft.type.set('updatedAt', Date.now());
      }, originRef.current);
    }

    draftStrokeRef.current = null;
  }, []);

  const removeStroke = useCallback(
    (strokeId: string) => {
      const doc = roomState.doc;
      if (!doc) return;

      doc.transact(() => {
        getStrokesMap(doc).delete(strokeId);
      }, originRef.current);
    },
    [roomState.doc]
  );

  const eraseStrokeAtPoint = useCallback(
    (strokeId: string, point: StrokePoint, mode: 'partial' | 'whole', radius: number) => {
      const doc = roomState.doc;
      if (!doc) return;

      const strokeType = getStrokesMap(doc).get(strokeId);
      if (!strokeType) return;

      if (mode === 'whole') {
        doc.transact(() => {
          getStrokesMap(doc).delete(strokeId);
        }, originRef.current);
        return;
      }

      const stroke = parseStroke(strokeType);
      const segments = splitStrokeByEraser(point, stroke.points, radius);

      if (segments.length === 1 && segments[0].length === stroke.points.length) {
        return;
      }

      doc.transact(() => {
        const strokesMap = getStrokesMap(doc);
        strokesMap.delete(strokeId);

        segments.forEach((segment) => {
          const nextStroke = createStrokeType({
            id: generateId('stroke'),
            color: stroke.color,
            width: stroke.width,
            createdBy: stroke.createdBy,
            createdAt: stroke.createdAt,
            updatedAt: Date.now(),
            points: segment
          });
          strokesMap.set(String(nextStroke.get('id')), nextStroke);
        });
      }, originRef.current);
    },
    [roomState.doc]
  );

  const addNote = useCallback(
    (position: StrokePoint) => {
      const doc = roomState.doc;
      if (!doc) return null;

      const id = generateId('note');
      const noteType = createNoteType({
        id,
        x: position.x,
        y: position.y,
        createdBy: user.id,
        updatedAt: Date.now(),
        content: 'New note'
      });

      doc.transact(() => {
        getNotesMap(doc).set(id, noteType);
      }, originRef.current);

      return id;
    },
    [roomState.doc, user.id]
  );

  const moveNote = useCallback(
    (noteId: string, x: number, y: number) => {
      const noteType = roomState.noteTypes.get(noteId);
      if (!noteType) return;

      noteType.doc?.transact(() => {
        noteType.set('x', x);
        noteType.set('y', y);
        noteType.set('updatedAt', Date.now());
      }, originRef.current);
    },
    [roomState.noteTypes]
  );

  const updateNoteContent = useCallback(
    (noteId: string, nextValue: string) => {
      const noteType = roomState.noteTypes.get(noteId);
      if (!noteType) return;

      const yText = getNoteText(noteType);
      if (!yText) return;
      const previous = yText.toString();
      syncYText(previous, nextValue, yText, originRef.current);
      noteType.doc?.transact(() => {
        noteType.set('updatedAt', Date.now());
      }, originRef.current);
    },
    [roomState.noteTypes]
  );

  const updateCodeContent = useCallback(
    (nextValue: string) => {
      const doc = roomState.doc;
      if (!doc) return;

      const codeText = doc.getText('code-content');
      const previous = codeText.toString();
      syncYText(previous, nextValue, codeText, originRef.current);
    },
    [roomState.doc]
  );

  const setCodeLanguage = useCallback(
    (language: string) => {
      const doc = roomState.doc;
      if (!doc) return;

      doc.transact(() => {
        doc.getMap<string>('code-meta').set('language', language);
      }, originRef.current);
    },
    [roomState.doc]
  );

  const setCodeTheme = useCallback(
    (theme: 'light' | 'dark') => {
      const doc = roomState.doc;
      if (!doc) return;

      doc.transact(() => {
        doc.getMap<string>('code-meta').set('theme', theme);
      }, originRef.current);
    },
    [roomState.doc]
  );

  const sendChatMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const doc = roomState.doc;
      if (!doc) return;

      const chatMessages = doc.getArray<Y.Map<unknown>>('chat-messages');
      const entry = new Y.Map<unknown>();
      entry.set('id', `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      entry.set('text', trimmed);
      entry.set('timestamp', Date.now());
      entry.set('userId', user.id);
      entry.set('userName', user.name);
      entry.set('userColor', user.color);

      doc.transact(() => {
        chatMessages.push([entry]);
        if (chatMessages.length > 200) {
          chatMessages.delete(0, chatMessages.length - 200);
        }
      }, originRef.current);
    },
    [roomState.doc, user.color, user.id, user.name]
  );

  const deleteNote = useCallback(
    (noteId: string) => {
      const doc = roomState.doc;
      if (!doc) return;

      doc.transact(() => {
        getNotesMap(doc).delete(noteId);
      }, originRef.current);
    },
    [roomState.doc]
  );

  const clearBoard = useCallback(() => {
    const doc = roomState.doc;
    if (!doc) return;
    doc.transact(() => {
      getStrokesMap(doc).clear();
      getNotesMap(doc).clear();
    }, originRef.current);
  }, [roomState.doc]);

  const undo = useCallback(() => {
    undoManagerRef.current?.undo();
  }, []);

  const redo = useCallback(() => {
    undoManagerRef.current?.redo();
  }, []);

  return useMemo(
    () => ({
      ...roomState,
      updateCursor,
      beginStroke,
      pushStrokePoint,
      finishStroke,
      removeStroke,
      eraseStrokeAtPoint,
      addNote,
      moveNote,
      updateNoteContent,
      updateCodeContent,
      setCodeLanguage,
      setCodeTheme,
      sendChatMessage,
      deleteNote,
      clearBoard,
      undo,
      redo
    }),
    [
      roomState,
      updateCursor,
      beginStroke,
      pushStrokePoint,
      finishStroke,
      removeStroke,
      eraseStrokeAtPoint,
      addNote,
      moveNote,
      updateNoteContent,
      updateCodeContent,
      setCodeLanguage,
      setCodeTheme,
      sendChatMessage,
      deleteNote,
      clearBoard,
      undo,
      redo
    ]
  );
}
