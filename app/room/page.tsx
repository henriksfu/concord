import { redirect } from 'next/navigation';

import { generateRoomId, isValidRoomId, sanitizeRoomId } from '@/lib/room';

export default function JoinRedirectPage({
  searchParams
}: {
  searchParams: { roomId?: string; workspace?: string };
}) {
  const candidate = sanitizeRoomId(searchParams.roomId ?? '');
  const fallbackWorkspace = searchParams.workspace === 'code' ? 'code' : 'whiteboard';
  redirect(`/room/${isValidRoomId(candidate) ? candidate : generateRoomId(fallbackWorkspace)}`);
}
