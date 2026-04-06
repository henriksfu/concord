import { cn } from '@/lib/utils';
import type { ConnectionState } from '@/types/board';

const labels: Record<ConnectionState, string> = {
  connected: 'Connected',
  connecting: 'Connecting',
  reconnecting: 'Reconnecting',
  offline: 'Offline'
};

export function ConnectionBadge({ status }: { status: ConnectionState }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.24em]',
        status === 'connected' && 'border-forest/20 bg-forest/10 text-forest',
        status === 'connecting' && 'border-ink/15 bg-white/70 text-ink/70',
        status === 'reconnecting' && 'border-ember/25 bg-ember/10 text-ember',
        status === 'offline' && 'border-red-500/20 bg-red-500/10 text-red-700'
      )}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          status === 'connected' && 'bg-forest',
          status === 'connecting' && 'bg-ink/50',
          status === 'reconnecting' && 'bg-ember',
          status === 'offline' && 'bg-red-600'
        )}
      />
      {labels[status]}
    </div>
  );
}
