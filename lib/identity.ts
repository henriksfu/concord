import type { UserIdentity } from '@/types/board';

const STORAGE_KEY = 'collab-whiteboard-user';
const colors = ['#bf5b39', '#1f5c4f', '#255b8f', '#874c62', '#855d22', '#0f766e'];

function buildIdentity(): UserIdentity {
  const suffix = Math.floor(Math.random() * 900 + 100);
  const color = colors[Math.floor(Math.random() * colors.length)];

  return {
    id: crypto.randomUUID(),
    name: `User ${suffix}`,
    color
  };
}

export function getStoredIdentity(): UserIdentity {
  if (typeof window === 'undefined') {
    return {
      id: 'server-user',
      name: 'User',
      color: colors[0]
    };
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) {
    try {
      return JSON.parse(existing) as UserIdentity;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  const identity = buildIdentity();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  return identity;
}
