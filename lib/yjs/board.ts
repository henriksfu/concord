import * as Y from 'yjs';

import type { Stroke, StrokePoint, TextNote } from '@/types/board';

export const STROKES_KEY = 'strokes';
export const NOTES_KEY = 'notes';

export function getStrokesMap(doc: Y.Doc) {
  return doc.getMap<Y.Map<unknown>>(STROKES_KEY);
}

export function getNotesMap(doc: Y.Doc) {
  return doc.getMap<Y.Map<unknown>>(NOTES_KEY);
}

export function createStrokeType(stroke: Omit<Stroke, 'points'> & { points?: StrokePoint[] }) {
  const yStroke = new Y.Map<unknown>();
  yStroke.set('id', stroke.id);
  yStroke.set('color', stroke.color);
  yStroke.set('width', stroke.width);
  yStroke.set('createdBy', stroke.createdBy);
  yStroke.set('createdAt', stroke.createdAt);
  yStroke.set('updatedAt', stroke.updatedAt);
  const points = new Y.Array<StrokePoint>();
  if (stroke.points?.length) {
    points.push(stroke.points);
  }
  yStroke.set('points', points);
  return yStroke;
}

export function createNoteType(note: Omit<TextNote, 'content'> & { content?: string }) {
  const yNote = new Y.Map<unknown>();
  yNote.set('id', note.id);
  yNote.set('x', note.x);
  yNote.set('y', note.y);
  yNote.set('createdBy', note.createdBy);
  yNote.set('updatedAt', note.updatedAt);
  const text = new Y.Text(note.content ?? '');
  yNote.set('content', text);
  return yNote;
}

export function parseStroke(type: Y.Map<unknown>): Stroke {
  const points = getStrokePoints(type)?.toArray() ?? [];
  return {
    id: String(type.get('id') ?? ''),
    color: String(type.get('color') ?? '#181614'),
    width: Number(type.get('width') ?? 4),
    createdBy: String(type.get('createdBy') ?? 'unknown'),
    createdAt: Number(type.get('createdAt') ?? Date.now()),
    updatedAt: Number(type.get('updatedAt') ?? Date.now()),
    points
  };
}

export function getStrokePoints(type: Y.Map<unknown>) {
  const existing = type.get('points') as Y.Array<StrokePoint> | undefined;
  if (existing) {
    return existing;
  }

  const points = new Y.Array<StrokePoint>();
  type.set('points', points);
  return points;
}

export function parseNote(type: Y.Map<unknown>): TextNote {
  const text = type.get('content') as Y.Text | undefined;
  return {
    id: String(type.get('id') ?? ''),
    x: Number(type.get('x') ?? 0),
    y: Number(type.get('y') ?? 0),
    content: text?.toString() ?? '',
    createdBy: String(type.get('createdBy') ?? 'unknown'),
    updatedAt: Number(type.get('updatedAt') ?? Date.now())
  };
}

export function getNoteText(type: Y.Map<unknown>) {
  return type.get('content') as Y.Text | undefined;
}

export function syncYText(previous: string, next: string, yText: Y.Text, origin: object) {
  if (previous === next) return;

  let start = 0;
  while (
    start < previous.length &&
    start < next.length &&
    previous.charCodeAt(start) === next.charCodeAt(start)
  ) {
    start += 1;
  }

  let prevEnd = previous.length;
  let nextEnd = next.length;

  while (
    prevEnd > start &&
    nextEnd > start &&
    previous.charCodeAt(prevEnd - 1) === next.charCodeAt(nextEnd - 1)
  ) {
    prevEnd -= 1;
    nextEnd -= 1;
  }

  yText.doc?.transact(() => {
    if (prevEnd > start) {
      yText.delete(start, prevEnd - start);
    }

    if (nextEnd > start) {
      yText.insert(start, next.slice(start, nextEnd));
    }
  }, origin);
}
