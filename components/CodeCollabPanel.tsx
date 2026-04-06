'use client';

import { useMemo, useRef } from 'react';

import { ConnectionBadge } from '@/components/ConnectionBadge';
import { PresenceStack } from '@/components/PresenceStack';
import { cn } from '@/lib/utils';
import type { ConnectionState, PresenceUser } from '@/types/board';

type CodeCollabPanelProps = {
  roomId: string;
  participants: PresenceUser[];
  connection: ConnectionState;
  content: string;
  language: string;
  theme: 'light' | 'dark';
  onContentChange: (value: string) => void;
  onLanguageChange: (language: string) => void;
  onThemeChange: (theme: 'light' | 'dark') => void;
};

const LANGUAGE_OPTIONS = [
  { label: 'TypeScript', value: 'typescript', ext: 'ts' },
  { label: 'JavaScript', value: 'javascript', ext: 'js' },
  { label: 'Python', value: 'python', ext: 'py' },
  { label: 'C++', value: 'cpp', ext: 'cpp' },
  { label: 'C', value: 'c', ext: 'c' },
  { label: 'Java', value: 'java', ext: 'java' },
  { label: 'Go', value: 'go', ext: 'go' },
  { label: 'Rust', value: 'rust', ext: 'rs' },
  { label: 'C#', value: 'csharp', ext: 'cs' },
  { label: 'JSON', value: 'json', ext: 'json' },
  { label: 'Markdown', value: 'markdown', ext: 'md' },
  { label: 'HTML', value: 'html', ext: 'html' },
  { label: 'CSS', value: 'css', ext: 'css' },
  { label: 'SQL', value: 'sql', ext: 'sql' },
  { label: 'Shell', value: 'shell', ext: 'sh' }
];

export function CodeCollabPanel({
  roomId,
  participants,
  connection,
  content,
  language,
  theme,
  onContentChange,
  onLanguageChange,
  onThemeChange
}: CodeCollabPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lineNumbers = useMemo(() => {
    const count = Math.max(1, content.split('\n').length);
    return Array.from({ length: count }, (_, index) => index + 1);
  }, [content]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
  };

  const handleDownload = () => {
    const option = LANGUAGE_OPTIONS.find((entry) => entry.value === language) ?? LANGUAGE_OPTIONS[0];
    const filename = `${roomId}-code.${option.ext}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="flex h-[calc(100vh-10rem)] min-h-[620px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-parchment/80 shadow-panel backdrop-blur-xl">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 px-4 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-ink/45">Code Room</p>
            <p className="font-display text-lg text-ink">{roomId}</p>
          </div>
          <ConnectionBadge status={connection} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
            className="rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm text-ink outline-none"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={theme}
            onChange={(event) => onThemeChange(event.target.value === 'light' ? 'light' : 'dark')}
            className="rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm text-ink outline-none"
          >
            <option value="dark">Dark Theme</option>
            <option value="light">Light Theme</option>
          </select>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm text-ink transition hover:border-ink/20 hover:bg-white"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm text-ink transition hover:border-ink/20 hover:bg-white"
          >
            Download
          </button>
        </div>
      </header>

      <div className="border-b border-ink/10 px-4 py-3">
        <PresenceStack participants={participants} />
      </div>

      <div
        className={cn(
          'relative flex flex-1 overflow-hidden',
          theme === 'dark' ? 'bg-[#171b22]' : 'bg-[#f8f8f6]'
        )}
      >
        <div
          className={cn(
            'w-16 shrink-0 overflow-hidden border-r px-3 py-4 text-right font-mono text-xs leading-6',
            theme === 'dark' ? 'border-white/10 text-white/40' : 'border-ink/10 text-ink/40'
          )}
        >
          {lineNumbers.map((lineNumber) => (
            <div key={lineNumber}>{lineNumber}</div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          spellCheck={false}
          onChange={(event) => onContentChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Tab') return;
            event.preventDefault();
            const target = event.currentTarget;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const nextValue = `${content.slice(0, start)}  ${content.slice(end)}`;
            onContentChange(nextValue);
            requestAnimationFrame(() => {
              target.selectionStart = start + 2;
              target.selectionEnd = start + 2;
            });
          }}
          className={cn(
            'h-full w-full resize-none overflow-auto bg-transparent p-4 font-mono text-sm leading-6 outline-none',
            theme === 'dark' ? 'text-white' : 'text-ink'
          )}
          placeholder="// Collaborative code editor"
        />
      </div>
    </section>
  );
}
