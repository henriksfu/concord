import type { SVGProps } from 'react';

function Icon(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props} />;
}

export function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 20.5 7.5 20 19 8.5 15.5 5 4 16.5 4 20.5Z" />
      <path d="m13.5 7 3.5 3.5" />
    </Icon>
  );
}

export function TypeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 6h14" />
      <path d="M12 6v12" />
      <path d="M8 18h8" />
    </Icon>
  );
}

export function EraserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4.5 14.5 11 8l7.5 7.5-3 3H8l-3.5-4Z" />
      <path d="M13 18.5h6.5" />
    </Icon>
  );
}

export function HandIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M8 11V5.5a1.5 1.5 0 1 1 3 0V10" />
      <path d="M11 10V4.5a1.5 1.5 0 1 1 3 0V10" />
      <path d="M14 10V6.5a1.5 1.5 0 1 1 3 0V13" />
      <path d="M8 10V7a1.5 1.5 0 1 0-3 0v6.5c0 3.6 2.9 6.5 6.5 6.5H14a6 6 0 0 0 6-6v-2.5a1.5 1.5 0 1 0-3 0V13" />
    </Icon>
  );
}

export function UndoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M9 8 5 12l4 4" />
      <path d="M5 12h8a5 5 0 0 1 0 10h-3" />
    </Icon>
  );
}

export function RedoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m15 8 4 4-4 4" />
      <path d="M19 12h-8a5 5 0 1 0 0 10h3" />
    </Icon>
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 12h10l1-12" />
      <path d="M9 7V4h6v3" />
    </Icon>
  );
}

export function ZoomInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="M21 21l-4.3-4.3" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </Icon>
  );
}

export function ZoomOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="M21 21l-4.3-4.3" />
      <path d="M8 11h6" />
    </Icon>
  );
}
