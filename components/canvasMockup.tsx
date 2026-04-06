import React, { type CSSProperties } from 'react';
import Image from 'next/image';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Collaborator {
    avatarUrl: string;
    name: string;
}

export interface LiveCursor {
    label: string;
    color: string; // hex, e.g. '#4a7c59'
    top: string;
    left?: string;
    right?: string;
    animationStyle?: 'drift1' | 'drift2';
}

export interface ArchNode {
    label: string;
    variant: 'client' | 'api' | 'db' | 'cache';
}

export interface ArchRow {
    from: ArchNode;
    to: ArchNode;
    connectorLabel: string;
    marginLeft?: string;
}

export interface StatusTag {
    label: string;
    variant: 'green' | 'amber' | 'blue';
}

export interface ArchCardData {
    title: string;
    subtitle: string;
    rows: ArchRow[];
    tags: StatusTag[];
}

export interface StickyNoteData {
    sprintLabel: string;
    title: string;
    tagLabel: string;
}

export interface CommentBubbleData {
    author: string;
    text: string;
    top: string;
    left: string;
}

export interface MiniChartData {
    title: string;
    bars: number[]; // heights as percentages (0–100)
    highlightIndex?: number;
    value: string;
    trend: string;
}

export interface PhotoCardData {
    src: string;
    caption: string;
}

export interface CanvasMockupHeroProps {
    /** Collaborators shown in the avatar stack */
    collaborators?: Collaborator[];
    /** Extra count shown as "+N" after the avatar stack */
    extraCollaborators?: number;
    /** Number of live users shown in the green badge */
    onlineCount?: number;
    /** Sticky note content */
    stickyNote?: StickyNoteData;
    /** Comment bubble floating on the canvas */
    comment?: CommentBubbleData;
    /** Architecture card data */
    archCard?: ArchCardData;
    /** Photo / moodboard card */
    photoCard?: PhotoCardData;
    /** Mini bar chart */
    miniChart?: MiniChartData;
    /** Live cursors */
    cursors?: LiveCursor[];
    /** Called when the Share button is clicked */
    onShare?: () => void;
    /** Optional extra className on the outermost wrapper */
    className?: string;
}

// ─── Default data ─────────────────────────────────────────────────────────────

const DEFAULT_COLLABORATORS: Collaborator[] = [
    { avatarUrl: 'https://i.pravatar.cc/60?img=1', name: 'User 1' },
    { avatarUrl: 'https://i.pravatar.cc/60?img=5', name: 'User 2' },
    { avatarUrl: 'https://i.pravatar.cc/60?img=9', name: 'User 3' },
];

const DEFAULT_STICKY: StickyNoteData = {
    sprintLabel: 'Design sprint · Q3',
    title: 'Refine\nuser flow',
    tagLabel: 'In progress',
};

const DEFAULT_COMMENT: CommentBubbleData = {
    author: 'Elena ·',
    text: 'Should we add a skip step here?',
    top: '13%',
    left: '44%',
};

const DEFAULT_ARCH_CARD: ArchCardData = {
    title: 'Architecture v2',
    subtitle: 'Edited just now',
    rows: [
        { from: { label: 'Client', variant: 'client' }, to: { label: 'API Gateway', variant: 'api' }, connectorLabel: 'REST' },
        { from: { label: 'PostgreSQL', variant: 'db' }, to: { label: 'Redis', variant: 'cache' }, connectorLabel: 'ORM', marginLeft: '20%' },
    ],
    tags: [
        { label: '3 open issues', variant: 'amber' },
        { label: 'v2.4.1', variant: 'blue' },
    ],
};

const DEFAULT_PHOTO: PhotoCardData = {
    src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400',
    caption: 'Moodboard ref',
};

const DEFAULT_CHART: MiniChartData = {
    title: 'WEEKLY SESSIONS',
    bars: [55, 75, 90, 60, 45],
    highlightIndex: 2,
    value: '2,847',
    trend: '↑ 18% vs last week',
};

const DEFAULT_CURSORS: LiveCursor[] = [
    { label: 'David is sketching...', color: '#4a7c59', top: '46%', right: '28%', animationStyle: 'drift1' },
    { label: 'Elena', color: '#c0603e', top: '24%', left: '48%', animationStyle: 'drift2' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const nodeStyles: Record<ArchNode['variant'], CSSProperties> = {
    client: { background: '#e1f5ee', color: '#085041', border: '1px solid rgba(29,158,117,0.25)' },
    api: { background: '#faeeda', color: '#633806', border: '1px solid rgba(186,117,23,0.25)' },
    db: { background: '#e6f1fb', color: '#0c447c', border: '1px solid rgba(55,138,221,0.25)' },
    cache: { background: '#fbeaf0', color: '#4b1528', border: '1px solid rgba(212,83,126,0.25)' },
};

const tagStyles: Record<StatusTag['variant'], CSSProperties> = {
    green: { background: '#e1f5ee', color: '#085041' },
    amber: { background: '#faeeda', color: '#633806' },
    blue: { background: '#e6f1fb', color: '#0c447c' },
};

const ArchNodeChip: React.FC<{ node: ArchNode }> = ({ node }) => (
    <div style={{
        padding: '6px 12px',
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
        cursor: 'pointer',
        transition: 'transform 0.15s',
        ...nodeStyles[node.variant],
    }}>
        {node.label}
    </div>
);

const ConnectorLine: React.FC<{ label: string }> = ({ label }) => (
    <>
        <div style={{
            flex: 1,
            height: 1,
            background: 'repeating-linear-gradient(to right, rgba(136,135,128,0.4) 0, rgba(136,135,128,0.4) 4px, transparent 4px, transparent 8px)',
            position: 'relative',
        }}>
            <div style={{
                position: 'absolute', right: 0, top: -3,
                width: 0, height: 0,
                borderTop: '3.5px solid transparent',
                borderBottom: '3.5px solid transparent',
                borderLeft: '5px solid rgba(136,135,128,0.5)',
            }} />
        </div>
        <span style={{ fontSize: 9, color: '#888780', fontWeight: 500, whiteSpace: 'nowrap', background: 'white', padding: '0 4px', letterSpacing: '0.03em' }}>
            {label}
        </span>
        <div style={{
            flex: 1,
            height: 1,
            background: 'repeating-linear-gradient(to right, rgba(136,135,128,0.4) 0, rgba(136,135,128,0.4) 4px, transparent 4px, transparent 8px)',
            position: 'relative',
        }}>
            <div style={{
                position: 'absolute', right: 0, top: -3,
                width: 0, height: 0,
                borderTop: '3.5px solid transparent',
                borderBottom: '3.5px solid transparent',
                borderLeft: '5px solid rgba(136,135,128,0.5)',
            }} />
        </div>
    </>
);

const CursorIcon: React.FC<{ color: string }> = ({ color }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
        <path d="M4 2.25l16.16 11.08-6.84 2.15 4.3 7.6-3.4 1.93-4.33-7.66-6.05 4.9V2.25z" />
    </svg>
);

// ─── Keyframe injection (once per mount) ─────────────────────────────────────

const STYLE_ID = 'canvas-mockup-hero-keyframes';

function injectKeyframes(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap');
    @keyframes cmh-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }
    @keyframes cmh-drift1 { 0%{transform:translate(0,0)} 25%{transform:translate(8px,-6px)} 50%{transform:translate(-4px,10px)} 75%{transform:translate(12px,4px)} 100%{transform:translate(0,0)} }
    @keyframes cmh-drift2 { 0%{transform:translate(0,0)} 30%{transform:translate(-10px,8px)} 60%{transform:translate(6px,-12px)} 80%{transform:translate(-5px,5px)} 100%{transform:translate(0,0)} }
  `;
    document.head.appendChild(style);
}

// ─── Main component ───────────────────────────────────────────────────────────

const CanvasMockupHero: React.FC<CanvasMockupHeroProps> = ({
    collaborators = DEFAULT_COLLABORATORS,
    extraCollaborators = 2,
    onlineCount = 5,
    stickyNote = DEFAULT_STICKY,
    comment = DEFAULT_COMMENT,
    archCard = DEFAULT_ARCH_CARD,
    photoCard = DEFAULT_PHOTO,
    miniChart = DEFAULT_CHART,
    cursors = DEFAULT_CURSORS,
    onShare,
    className,
}) => {
    React.useEffect(() => { injectKeyframes(); }, []);

    return (
        <div className={className} style={{ width: '100%', fontFamily: "'DM Sans', sans-serif" }}>
            {/* ── Canvas frame ── */}
            <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '21 / 9',
                borderRadius: 28,
                background: '#f7f6f2',
                border: '1.5px solid rgba(180,178,169,0.35)',
                overflow: 'hidden',
                boxShadow: '0 2px 0 0 rgba(255,255,255,0.9) inset, 0 40px 80px -20px rgba(60,55,45,0.13), 0 8px 24px -8px rgba(60,55,45,0.08)',
            }}>

                {/* Grid background */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'linear-gradient(rgba(165,158,140,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(165,158,140,0.18) 1px, transparent 1px)',
                    backgroundSize: '36px 36px',
                }} />
                {/* Dot accent */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.5,
                    backgroundImage: 'radial-gradient(circle, rgba(165,158,140,0.22) 1px, transparent 1px)',
                    backgroundSize: '36px 36px',
                    backgroundPosition: '18px 18px',
                }} />

                {/* SVG connector arrows */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }} overflow="visible">
                    <defs>
                        <marker id="cmh-arr1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <path d="M0,0 L6,3 L0,6" fill="none" stroke="#4a7c59" strokeWidth="1.2" strokeLinecap="round" />
                        </marker>
                        <marker id="cmh-arr2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                            <path d="M0,0 L6,3 L0,6" fill="none" stroke="#c0603e" strokeWidth="1.2" strokeLinecap="round" />
                        </marker>
                    </defs>
                    <path d="M 38% 40% Q 52% 28%, 65% 45%" fill="none" stroke="#4a7c59" strokeWidth="2.5" strokeLinecap="round" markerEnd="url(#cmh-arr1)" opacity="0.55" />
                    <path d="M 62% 58% Q 72% 48%, 78% 35%" fill="none" stroke="#c0603e" strokeWidth="2" strokeLinecap="round" markerEnd="url(#cmh-arr2)" opacity="0.45" />
                </svg>

                {/* ── Toolbar ── */}
                <div style={{
                    position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
                    width: 52, background: '#fff', borderRadius: 20,
                    border: '1px solid rgba(180,178,169,0.3)',
                    padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    boxShadow: '0 4px 20px rgba(60,55,45,0.1), 0 1px 0 rgba(255,255,255,0.8) inset',
                    zIndex: 30,
                }}>
                    {[
                        'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
                        'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
                        'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
                        'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
                    ].map((d, i) => (
                        <button key={i} style={{
                            width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                            background: i === 0 ? '#4a7c59' : 'transparent',
                            boxShadow: i === 0 ? '0 2px 8px rgba(74,124,89,0.35)' : 'none',
                        }}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={i === 0 ? 'white' : '#888780'} strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d={d} />
                            </svg>
                        </button>
                    ))}
                    <div style={{ width: 28, height: 1, background: 'rgba(180,178,169,0.3)', margin: '4px 0' }} />
                    {['#f59e0b', '#22d3ee', '#ec4899'].map((c) => (
                        <div key={c} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: '2px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', cursor: 'pointer' }} />
                    ))}
                </div>

                {/* ── Collab bar ── */}
                <div style={{ position: 'absolute', top: 18, right: 18, display: 'flex', alignItems: 'center', gap: 10, zIndex: 30 }}>
                    {/* Live badge */}
                    <div style={{ background: '#e8f5e0', color: '#3b6d11', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '0.01em' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#639922', animation: 'cmh-pulse 1.8s ease-in-out infinite' }} />
                        {onlineCount} online
                    </div>
                    {/* Avatars pill */}
                    <div style={{ background: 'white', borderRadius: 40, padding: '5px 10px 5px 6px', border: '1px solid rgba(180,178,169,0.3)', display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 2px 8px rgba(60,55,45,0.08)' }}>
                        <div style={{ display: 'flex' }}>
                            {collaborators.map((c, i) => (
                                <Image
                                    key={i}
                                    src={c.avatarUrl}
                                    alt={c.name}
                                    width={30}
                                    height={30}
                                    unoptimized
                                    style={{ borderRadius: '50%', border: '2px solid white', marginLeft: i === 0 ? 0 : -8, objectFit: 'cover' }}
                                />
                            ))}
                            {extraCollaborators > 0 && (
                                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f1efe8', border: '2px solid white', marginLeft: -8, fontSize: 10, fontWeight: 600, color: '#5f5e5a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    +{extraCollaborators}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Share button */}
                    <button onClick={onShare} style={{ background: '#2c2c2a', color: 'white', fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', letterSpacing: '0.02em', boxShadow: '0 2px 8px rgba(44,44,42,0.25)' }}>
                        Share
                    </button>
                </div>

                {/* ── Sticky note ── */}
                <div style={{
                    position: 'absolute', top: '16%', left: '26%', width: 200,
                    background: '#fef9c3', borderRadius: 14, padding: '16px 18px',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.7) inset',
                    transform: 'rotate(-2.5deg)', zIndex: 15,
                    border: '1px solid rgba(214,197,100,0.4)',
                }}>
                    <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a08010', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4a017' }} />
                        {stickyNote.sprintLabel}
                    </div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#78580a', lineHeight: 1.25, marginBottom: 10, whiteSpace: 'pre-line' }}>
                        {stickyNote.title}
                    </div>
                    <div style={{ height: 2, borderRadius: 2, background: 'rgba(120,88,10,0.12)', marginBottom: 6 }} />
                    <div style={{ height: 2, width: '70%', borderRadius: 2, background: 'rgba(120,88,10,0.12)' }} />
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(120,88,10,0.1)', color: '#78580a', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 8, marginTop: 8 }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                        {stickyNote.tagLabel}
                    </div>
                </div>

                {/* ── Comment bubble ── */}
                <div style={{
                    position: 'absolute', top: comment.top, left: comment.left,
                    background: 'white', borderRadius: 12, borderBottomLeftRadius: 2,
                    padding: '8px 12px', fontSize: 11, color: '#2c2c2a',
                    boxShadow: '0 4px 16px rgba(60,55,45,0.12)',
                    border: '1px solid rgba(180,178,169,0.25)',
                    zIndex: 25, maxWidth: 160, lineHeight: 1.45,
                }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#4a7c59', marginBottom: 3 }}>{comment.author}</div>
                    {comment.text}
                </div>

                {/* ── Architecture card ── */}
                <div style={{
                    position: 'absolute', bottom: '8%', left: '12%', width: '36%',
                    background: 'white', borderRadius: 18,
                    border: '1px solid rgba(180,178,169,0.25)',
                    boxShadow: '0 8px 32px rgba(60,55,45,0.09), 0 1px 0 rgba(255,255,255,0.9) inset',
                    zIndex: 20, overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(180,178,169,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 9, background: '#faeeda', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ba7517" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                </svg>
                            </div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#2c2c2a' }}>{archCard.title}</div>
                                <div style={{ fontSize: 11, color: '#888780' }}>{archCard.subtitle}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ ...tagStyles.green, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>Live</span>
                            <div style={{ display: 'flex', gap: 3 }}>
                                {[0, 1, 2].map((i) => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#b4b2a9' }} />)}
                            </div>
                        </div>
                    </div>
                    {/* Body */}
                    <div style={{ padding: '14px 16px' }}>
                        {archCard.rows.map((row, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, marginLeft: row.marginLeft ?? 0 }}>
                                <ArchNodeChip node={row.from} />
                                <ConnectorLine label={row.connectorLabel} />
                                <ArchNodeChip node={row.to} />
                            </div>
                        ))}
                        <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {archCard.tags.map((tag, i) => (
                                <span key={i} style={{ ...tagStyles[tag.variant], display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600 }}>
                                    {tag.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Photo card ── */}
                <div style={{
                    position: 'absolute', top: '14%', right: '14%', width: 160, height: 160,
                    background: 'white', borderRadius: 14, padding: 5,
                    boxShadow: '0 8px 28px rgba(60,55,45,0.12), 0 1px 0 rgba(255,255,255,0.9) inset',
                    border: '1px solid rgba(180,178,169,0.2)',
                    transform: 'rotate(2.5deg)', zIndex: 15, overflow: 'hidden',
                }}>
                    <div style={{ borderRadius: 10, overflow: 'hidden', position: 'relative', width: '100%', height: '100%' }}>
                        <Image
                            src={photoCard.src}
                            alt={photoCard.caption}
                            fill
                            unoptimized
                            style={{ objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(44,44,42,0.6), transparent)', padding: '12px 8px 6px', fontSize: 10, color: 'white', fontWeight: 500 }}>
                            {photoCard.caption}
                        </div>
                    </div>
                </div>

                {/* ── Mini chart ── */}
                <div style={{
                    position: 'absolute', bottom: '14%', right: '16%', width: 140,
                    background: 'white', borderRadius: 14, padding: '12px 14px',
                    border: '1px solid rgba(180,178,169,0.25)',
                    boxShadow: '0 4px 16px rgba(60,55,45,0.07)',
                    zIndex: 12,
                }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#5f5e5a', marginBottom: 10, letterSpacing: '0.03em' }}>{miniChart.title}</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 40 }}>
                        {miniChart.bars.map((h, i) => (
                            <div key={i} style={{
                                flex: 1, borderRadius: '3px 3px 0 0', minHeight: 4,
                                height: `${h}%`,
                                background: i === (miniChart.highlightIndex ?? 2) ? '#4a7c59' : '#9fe1cb',
                                boxShadow: i === (miniChart.highlightIndex ?? 2) ? '0 -2px 6px rgba(74,124,89,0.3)' : 'none',
                            }} />
                        ))}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#2c2c2a', marginTop: 6 }}>{miniChart.value}</div>
                    <div style={{ fontSize: 9, color: '#888780' }}>{miniChart.trend}</div>
                </div>

                {/* ── Selection box ── */}
                <div style={{
                    position: 'absolute', top: '38%', left: '58%', width: '12%', height: '16%',
                    border: '1.5px dashed rgba(74,124,89,0.55)', borderRadius: 8,
                    background: 'rgba(74,124,89,0.05)', zIndex: 10,
                }}>
                    {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
                        <div key={pos} style={{
                            position: 'absolute', width: 8, height: 8, background: 'white',
                            border: '1.5px solid #4a7c59', borderRadius: 2,
                            top: pos.startsWith('t') ? -4 : undefined, bottom: pos.startsWith('b') ? -4 : undefined,
                            left: pos.endsWith('l') ? -4 : undefined, right: pos.endsWith('r') ? -4 : undefined,
                        }} />
                    ))}
                </div>

                {/* ── Live cursors ── */}
                {cursors.map((cursor, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        top: cursor.top,
                        left: cursor.left,
                        right: cursor.right,
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                        zIndex: 40, pointerEvents: 'none',
                        animation: `${cursor.animationStyle === 'drift2' ? 'cmh-drift2 9s' : 'cmh-drift1 12s'} ease-in-out infinite`,
                    }}>
                        <CursorIcon color={cursor.color} />
                        <div style={{
                            fontSize: 10, fontWeight: 600, padding: '4px 10px',
                            borderRadius: 10, borderTopLeftRadius: 2,
                            marginTop: -2, marginLeft: 14,
                            whiteSpace: 'nowrap', letterSpacing: '0.01em',
                            background: cursor.color, color: 'white',
                        }}>
                            {cursor.label}
                        </div>
                    </div>
                ))}

            </div>
        </div>
    );
};

export default CanvasMockupHero;
