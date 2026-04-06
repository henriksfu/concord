export type Tool = 'draw' | 'text' | 'eraser' | 'pan';
export type EraserMode = 'partial' | 'whole';

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'offline';

export type StrokePoint = {
  x: number;
  y: number;
};

export type Stroke = {
  id: string;
  color: string;
  width: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  points: StrokePoint[];
};

export type TextNote = {
  id: string;
  x: number;
  y: number;
  content: string;
  createdBy: string;
  updatedAt: number;
};

export type UserIdentity = {
  id: string;
  name: string;
  color: string;
};

export type CursorState = {
  x: number;
  y: number;
  pointerDown: boolean;
} | null;

export type PresenceUser = UserIdentity & {
  cursor: CursorState;
};

export type ViewportState = {
  x: number;
  y: number;
  scale: number;
};
