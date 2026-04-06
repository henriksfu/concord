import React, { useEffect, useRef, useState, type ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Feature {
    /** Short headline — keep it under 4 words */
    title: string;
    /** One punchy sentence describing the benefit */
    desc: string;
    /** SVG icon node */
    icon: ReactNode;
    /** Accent colour used for the icon bg tint and hover shimmer */
    accent: string;
    /** Text colour on the accent background (defaults to white) */
    accentText?: string;
    /** Optional CTA label (defaults to "Explore") */
    ctaLabel?: string;
    /** Optional click handler for the CTA */
    onCtaClick?: () => void;
}

export interface FeatureGridProps {
    features?: Feature[];
    className?: string;
}

// ─── Default features ─────────────────────────────────────────────────────────

const DEFAULT_FEATURES: Feature[] = [
    {
        title: 'Instant sync',
        desc: 'Every stroke, cursor, and edit lands for your whole team in under 50ms — no lag, no conflicts, no waiting.',
        accent: '#4a7c59',
        accentText: '#ffffff',
        ctaLabel: 'See it live',
        icon: (
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
        ),
    },
    {
        title: 'Infinite canvas',
        desc: 'A borderless workspace that scales with your ambition — map systems, plan sprints, or sketch wild ideas without ever hitting a wall.',
        accent: '#c0603e',
        accentText: '#ffffff',
        ctaLabel: 'Start mapping',
        icon: (
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
        ),
    },
    {
        title: 'Smart merging',
        desc: 'Write on the same note at the same time. Our CRDT engine silently resolves every conflict so nothing is ever lost.',
        accent: '#2c2c2a',
        accentText: '#ffffff',
        ctaLabel: 'Learn how',
        icon: (
            <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
        ),
    },
];

// ─── Keyframe injection ───────────────────────────────────────────────────────

const STYLE_ID = 'feature-grid-styles';

function injectStyles(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,wght@0,400;0,500;1,400&display=swap');

    @keyframes fg-shimmer {
      0%   { transform: translateX(-100%) skewX(-12deg); }
      100% { transform: translateX(250%) skewX(-12deg); }
    }
    @keyframes fg-fadeslide {
      from { opacity: 0; transform: translateY(22px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fg-iconfloat {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-4px); }
    }

    .fg-card {
      position: relative;
      background: #ffffff;
      border-radius: 20px;
      border: 1px solid rgba(180,178,169,0.28);
      padding: 32px 28px 28px;
      overflow: hidden;
      cursor: default;
      transition: box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
      opacity: 0;
    }
    .fg-card.fg-visible {
      animation: fg-fadeslide 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
    }
    .fg-card:hover {
      box-shadow: 0 16px 48px -12px rgba(60,55,45,0.14);
      transform: translateY(-3px);
      border-color: rgba(180,178,169,0.5);
    }

    .fg-shimmer-bar {
      position: absolute;
      top: 0; left: 0;
      width: 40%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.1s;
    }
    .fg-card:hover .fg-shimmer-bar {
      opacity: 1;
      animation: fg-shimmer 0.65s cubic-bezier(0.4,0,0.6,1) forwards;
    }

    .fg-icon-wrap {
      width: 48px; height: 48px;
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 24px;
      transition: transform 0.3s ease;
    }
    .fg-card:hover .fg-icon-wrap {
      animation: fg-iconfloat 2s ease-in-out infinite;
    }

    .fg-number {
      font-family: 'DM Serif Display', serif;
      font-size: 11px;
      font-style: italic;
      letter-spacing: 0.04em;
      margin-bottom: 12px;
      opacity: 0.35;
    }

    .fg-title {
      font-family: 'DM Serif Display', serif;
      font-size: 22px;
      line-height: 1.2;
      color: #1a1916;
      margin-bottom: 12px;
      letter-spacing: -0.01em;
    }

    .fg-desc {
      font-family: 'DM Sans', sans-serif;
      font-size: 14.5px;
      line-height: 1.65;
      color: #6b6a65;
      margin-bottom: 28px;
    }

    .fg-cta {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: #1a1916;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      letter-spacing: 0.01em;
      transition: gap 0.2s ease, opacity 0.2s ease;
    }
    .fg-cta:hover {
      gap: 10px;
      opacity: 0.7;
    }
    .fg-cta-arrow {
      width: 18px; height: 18px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }
    .fg-cta:hover .fg-cta-arrow {
      transform: translateX(2px);
    }

    .fg-divider {
      position: absolute;
      bottom: 0; left: 28px; right: 28px;
      height: 2px;
      border-radius: 2px;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.35s cubic-bezier(0.22,1,0.36,1);
    }
    .fg-card:hover .fg-divider {
      transform: scaleX(1);
    }
  `;
    document.head.appendChild(s);
}

// ─── Single card ──────────────────────────────────────────────────────────────

interface CardProps {
    feature: Feature;
    index: number;
}

const FeatureCard: React.FC<CardProps> = ({ feature, index }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
            { threshold: 0.15 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const accentAlpha = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    };

    return (
        <div
            ref={ref}
            className={`fg-card${visible ? ' fg-visible' : ''}`}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Shimmer on hover */}
            <div className="fg-shimmer-bar" />

            {/* Bottom accent line */}
            <div className="fg-divider" style={{ background: feature.accent }} />

            {/* Index */}
            <div className="fg-number" style={{ color: feature.accent }}>
                0{index + 1}
            </div>

            {/* Icon */}
            <div
                className="fg-icon-wrap"
                style={{
                    background: accentAlpha(feature.accent, 0.1),
                    border: `1px solid ${accentAlpha(feature.accent, 0.18)}`,
                    color: feature.accent,
                }}
            >
                <div style={{ width: 22, height: 22 }}>{feature.icon}</div>
            </div>

            {/* Title */}
            <h3 className="fg-title">{feature.title}</h3>

            {/* Description */}
            <p className="fg-desc">{feature.desc}</p>

            {/* CTA */}
            <button
                className="fg-cta"
                onClick={feature.onCtaClick}
                style={{ color: '#1a1916' }}
            >
                {feature.ctaLabel ?? 'Explore'}
                <span
                    className="fg-cta-arrow"
                    style={{ background: accentAlpha(feature.accent, 0.12) }}
                >
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={feature.accent} strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </span>
            </button>
        </div>
    );
};

// ─── Main export ──────────────────────────────────────────────────────────────

const FeatureGrid: React.FC<FeatureGridProps> = ({
    features = DEFAULT_FEATURES,
    className,
}) => {
    useEffect(() => { injectStyles(); }, []);

    return (
        <section
            className={className}
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 20,
                width: '100%',
            }}
        >
            {features.map((f, i) => (
                <FeatureCard key={i} feature={f} index={i} />
            ))}
        </section>
    );
};

export default FeatureGrid;