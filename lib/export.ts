import { pointsToSvgPath } from '@/lib/geometry';
import type { Stroke, TextNote } from '@/types/board';

type Bounds = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};

type ExportData = {
  roomId: string;
  strokes: Stroke[];
  notes: TextNote[];
};

const DEFAULT_NOTE_WIDTH = 256;
const DEFAULT_NOTE_HEIGHT = 170;
const MIN_EXPORT_SIZE = 600;

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function formatNow() {
  return new Date().toISOString().replaceAll(':', '-');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function getBounds(strokes: Stroke[], notes: TextNote[]): Bounds {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const stroke of strokes) {
    for (const point of stroke.points) {
      minX = Math.min(minX, point.x - stroke.width * 0.5);
      minY = Math.min(minY, point.y - stroke.width * 0.5);
      maxX = Math.max(maxX, point.x + stroke.width * 0.5);
      maxY = Math.max(maxY, point.y + stroke.width * 0.5);
    }
  }

  for (const note of notes) {
    minX = Math.min(minX, note.x);
    minY = Math.min(minY, note.y);
    maxX = Math.max(maxX, note.x + DEFAULT_NOTE_WIDTH);
    maxY = Math.max(maxY, note.y + DEFAULT_NOTE_HEIGHT);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
    return { minX: 0, minY: 0, width: MIN_EXPORT_SIZE, height: MIN_EXPORT_SIZE };
  }

  const padding = 48;
  const width = Math.max(MIN_EXPORT_SIZE, maxX - minX + padding * 2);
  const height = Math.max(MIN_EXPORT_SIZE, maxY - minY + padding * 2);
  return {
    minX: minX - padding,
    minY: minY - padding,
    width,
    height
  };
}

function buildSvg(data: ExportData) {
  const bounds = getBounds(data.strokes, data.notes);

  const strokesMarkup = data.strokes
    .map((stroke) => {
      const path = pointsToSvgPath(stroke.points);
      if (!path) return '';
      return `<path d="${escapeXml(path)}" fill="none" stroke="${stroke.color}" stroke-width="${stroke.width}" stroke-linecap="round" stroke-linejoin="round" />`;
    })
    .join('');

  const notesMarkup = data.notes
    .map((note) => {
      const lines = note.content.split('\n').slice(0, 9);
      const textLines = lines
        .map((line, index) => {
          const y = note.y + 58 + index * 18;
          return `<text x="${note.x + 14}" y="${y}" font-size="14" font-family="Arial, sans-serif" fill="#181614">${escapeXml(line || ' ')}</text>`;
        })
        .join('');

      return `
        <g>
          <rect x="${note.x}" y="${note.y}" rx="14" ry="14" width="${DEFAULT_NOTE_WIDTH}" height="${DEFAULT_NOTE_HEIGHT}" fill="#fff8df" stroke="rgba(24,22,20,0.15)" />
          <rect x="${note.x}" y="${note.y}" rx="14" ry="14" width="${DEFAULT_NOTE_WIDTH}" height="34" fill="rgba(24,22,20,0.04)" />
          <text x="${note.x + 14}" y="${note.y + 22}" font-size="10" letter-spacing="2" font-family="Arial, sans-serif" fill="rgba(24,22,20,0.6)">SHARED NOTE</text>
          ${textLines}
        </g>
      `;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}">
    <rect x="${bounds.minX}" y="${bounds.minY}" width="${bounds.width}" height="${bounds.height}" fill="#f7f1e8" />
    ${strokesMarkup}
    ${notesMarkup}
  </svg>`;
}

async function svgToCanvas(svg: string, width: number, height: number) {
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    image.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Failed to render SVG image'));
      image.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas context not available');
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to generate image blob'));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
}

export async function exportBoardAsSvg(data: ExportData) {
  const svg = buildSvg(data);
  const filename = `${data.roomId}-${formatNow()}.svg`;
  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), filename);
}

export async function exportBoardAsPng(data: ExportData) {
  const svg = buildSvg(data);
  const bounds = getBounds(data.strokes, data.notes);
  const canvas = await svgToCanvas(svg, bounds.width, bounds.height);
  const blob = await canvasToBlob(canvas, 'image/png');
  const filename = `${data.roomId}-${formatNow()}.png`;
  downloadBlob(blob, filename);
}

export async function exportBoardAsPdf(data: ExportData) {
  const svg = buildSvg(data);
  const bounds = getBounds(data.strokes, data.notes);
  const canvas = await svgToCanvas(svg, bounds.width, bounds.height);
  const pngDataUrl = canvas.toDataURL('image/png');

  const { jsPDF } = await import('jspdf');
  const orientation = bounds.width >= bounds.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: [bounds.width, bounds.height]
  });

  pdf.addImage(pngDataUrl, 'PNG', 0, 0, bounds.width, bounds.height);
  pdf.save(`${data.roomId}-${formatNow()}.pdf`);
}

export async function exportBoardAsJson(data: ExportData) {
  const payload = {
    roomId: data.roomId,
    exportedAt: new Date().toISOString(),
    strokes: data.strokes,
    notes: data.notes
  };

  const filename = `${data.roomId}-${formatNow()}.json`;
  downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), filename);
}
