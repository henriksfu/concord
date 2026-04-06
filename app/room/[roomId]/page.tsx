import { RoomClient } from '@/components/RoomClient';
import { inferWorkspaceFromRoomId } from '@/lib/room';

export default function RoomPage({
  params,
  searchParams
}: {
  params: { roomId: string };
  searchParams: { workspace?: string };
}) {
  const inferredWorkspace = inferWorkspaceFromRoomId(params.roomId);
  const workspace =
    inferredWorkspace === 'code' || inferredWorkspace === 'whiteboard'
      ? inferredWorkspace
      : searchParams.workspace === 'code'
        ? 'code'
        : 'whiteboard';
  return <RoomClient roomId={params.roomId} workspace={workspace} />;
}
