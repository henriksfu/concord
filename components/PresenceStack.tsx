import type { PresenceUser } from '@/types/board';

export function PresenceStack({ participants }: { participants: PresenceUser[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {participants.map((participant) => (
        <div
          key={participant.id}
          className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-3 py-1 text-xs text-ink/75 backdrop-blur"
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: participant.color }}
            aria-hidden
          />
          {participant.name}
        </div>
      ))}
    </div>
  );
}
