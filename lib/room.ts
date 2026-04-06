import { ROOM_ID_PATTERN } from '@/lib/constants';

const adjectives = ['amber', 'paper', 'copper', 'spruce', 'marble', 'signal', 'bright', 'atlas'];
const nouns = ['studio', 'canvas', 'draft', 'room', 'board', 'den', 'table', 'loft'];
export type RoomWorkspace = 'whiteboard' | 'code';

export function isValidRoomId(value: string) {
  return ROOM_ID_PATTERN.test(value);
}

export function sanitizeRoomId(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
}

export function inferWorkspaceFromRoomId(roomId: string): RoomWorkspace {
  if (roomId.startsWith('code-')) {
    return 'code';
  }

  if (roomId.startsWith('whiteboard-')) {
    return 'whiteboard';
  }

  return 'whiteboard';
}

export function generateRoomId(workspace: RoomWorkspace = 'whiteboard') {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const suffix = Math.random().toString(36).slice(2, 6);
  const prefix = workspace === 'code' ? 'code' : 'whiteboard';
  return `${prefix}-${adjective}-${noun}-${suffix}`;
}
