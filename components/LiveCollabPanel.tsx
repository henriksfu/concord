'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

type ChatMessage = {
  id: string;
  text: string;
  timestamp: number;
  user: {
    id: string;
    name: string;
    color: string;
  };
};

type RemoteStreamEntry = {
  user: {
    id: string;
    name: string;
    color: string;
  };
  stream: MediaStream;
};

type LiveCollabPanelProps = {
  connected: boolean;
  onlineUsers: Array<{ id: string; name: string; color: string }>;
  messages: ChatMessage[];
  remoteStreams: RemoteStreamEntry[];
  localStream: MediaStream | null;
  micEnabled: boolean;
  cameraEnabled: boolean;
  panelOpen: boolean;
  panelTab: 'chat' | 'call';
  onPanelOpenChange: (open: boolean) => void;
  onPanelTabChange: (tab: 'chat' | 'call') => void;
  onSendChat: (text: string) => void;
  onStartCall: () => Promise<void>;
  onStopCall: () => void;
  onToggleMic: () => void;
  onToggleCamera: () => void;
};

function StreamTile({
  label,
  stream,
  muted,
  color,
  enableAudio = false
}: {
  label: string;
  stream: MediaStream | null;
  muted: boolean;
  color?: string;
  enableAudio?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return;
    element.srcObject = stream;
    element.play().catch(() => {
      // Autoplay can fail until user interaction.
    });
  }, [stream]);

  useEffect(() => {
    const element = audioRef.current;
    if (!element || !enableAudio) return;
    element.srcObject = stream;
    element.play().catch(() => {
      // Browser can still block autoplay for audio-only until explicit interaction.
    });
  }, [enableAudio, stream]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink/10 bg-ink/90">
      {stream ? (
        <video ref={videoRef} autoPlay playsInline muted className="h-36 w-full object-cover" />
      ) : (
        <div className="flex h-36 items-center justify-center text-sm text-white/75">No stream</div>
      )}
      {enableAudio && <audio ref={audioRef} autoPlay muted={muted} />}
      <div className="absolute bottom-2 left-2 rounded-full px-2 py-1 text-xs font-semibold text-white" style={{ backgroundColor: color ?? '#181614' }}>
        {label}
      </div>
    </div>
  );
}

export function LiveCollabPanel({
  connected,
  onlineUsers,
  messages,
  remoteStreams,
  localStream,
  micEnabled,
  cameraEnabled,
  panelOpen,
  panelTab,
  onPanelOpenChange,
  onPanelTabChange,
  onSendChat,
  onStartCall,
  onStopCall,
  onToggleMic,
  onToggleCamera
}: LiveCollabPanelProps) {
  const [draftMessage, setDraftMessage] = useState('');

  return (
    <aside className="fixed bottom-5 right-5 z-[70] w-[370px]">
      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white/95 shadow-panel backdrop-blur">
        <button
          type="button"
          onClick={() => onPanelOpenChange(!panelOpen)}
          className="flex w-full items-center justify-between border-b border-ink/10 px-4 py-3"
        >
          <span className="font-semibold text-ink">Live Collaboration</span>
          <span
            className={cn(
              'rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em]',
              connected ? 'bg-forest/15 text-forest' : 'bg-ember/15 text-ember'
            )}
          >
            {connected ? 'Online' : 'Offline'}
          </span>
        </button>

        {panelOpen && (
          <div className="p-3">
            <div className="mb-3 rounded-xl border border-ink/10 bg-parchment/40 p-2">
              <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-ink/45">Online Now</p>
              <div className="flex flex-wrap gap-2">
                {onlineUsers.length === 0 ? (
                  <span className="text-sm text-ink/55">No other users online</span>
                ) : (
                  onlineUsers.map((member) => (
                    <span
                      key={member.id}
                      className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white px-2 py-1 text-xs text-ink/80"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: member.color }} />
                      {member.name}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="mb-3 inline-flex rounded-full border border-ink/10 bg-mist p-1">
              <button
                type="button"
                onClick={() => onPanelTabChange('chat')}
                className={cn(
                  'rounded-full px-3 py-1 text-sm',
                  panelTab === 'chat' ? 'bg-ink text-parchment' : 'text-ink/70'
                )}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => onPanelTabChange('call')}
                className={cn(
                  'rounded-full px-3 py-1 text-sm',
                  panelTab === 'call' ? 'bg-ink text-parchment' : 'text-ink/70'
                )}
              >
                Audio / Video
              </button>
            </div>

            {panelTab === 'chat' ? (
              <div className="space-y-3">
                <div className="h-64 overflow-y-auto rounded-xl border border-ink/10 bg-parchment/40 p-3">
                  {messages.length === 0 ? (
                    <p className="text-sm text-ink/45">No messages yet.</p>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="mb-2">
                        <p className="text-xs font-semibold" style={{ color: message.user.color }}>
                          {message.user.name}
                        </p>
                        <p className="text-sm text-ink/85">{message.text}</p>
                      </div>
                    ))
                  )}
                </div>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    onSendChat(draftMessage);
                    setDraftMessage('');
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    placeholder="Send a message..."
                    className="min-w-0 flex-1 rounded-full border border-ink/10 px-4 py-2 text-sm outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-parchment"
                  >
                    Send
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <StreamTile label="You" stream={localStream} muted color="#181614" />
                  {remoteStreams.map((entry) => (
                    <StreamTile
                      key={entry.user.id}
                      label={entry.user.name}
                      stream={entry.stream}
                      muted={false}
                      color={entry.user.color}
                      enableAudio
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void onStartCall();
                    }}
                    className="rounded-full border border-ink/10 bg-white px-3 py-2 text-sm text-ink"
                  >
                    Start
                  </button>
                  <button
                    type="button"
                    onClick={onStopCall}
                    className="rounded-full border border-ink/10 bg-white px-3 py-2 text-sm text-ink"
                  >
                    Stop
                  </button>
                  <button
                    type="button"
                    onClick={onToggleMic}
                    className="rounded-full border border-ink/10 bg-white px-3 py-2 text-sm text-ink"
                  >
                    Mic: {micEnabled ? 'On' : 'Off'}
                  </button>
                  <button
                    type="button"
                    onClick={onToggleCamera}
                    className="rounded-full border border-ink/10 bg-white px-3 py-2 text-sm text-ink"
                  >
                    Cam: {cameraEnabled ? 'On' : 'Off'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
