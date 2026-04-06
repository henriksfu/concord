import type { Stroke, StrokePoint } from '@/types/board';

export function getDistance(a: StrokePoint, b: StrokePoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function interpolatePoint(a: StrokePoint, b: StrokePoint, t: number): StrokePoint {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t
  };
}

function almostSamePoint(a: StrokePoint, b: StrokePoint, epsilon = 0.5) {
  return Math.abs(a.x - b.x) <= epsilon && Math.abs(a.y - b.y) <= epsilon;
}

function distanceToSegment(point: StrokePoint, start: StrokePoint, end: StrokePoint) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return getDistance(point, start);
  }

  const t = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy))
  );

  return getDistance(point, interpolatePoint(start, end, t));
}

export function getStrokeDistance(target: StrokePoint, points: StrokePoint[]) {
  if (points.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  if (points.length === 1) {
    return getDistance(target, points[0]);
  }

  let minDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < points.length - 1; index += 1) {
    minDistance = Math.min(minDistance, distanceToSegment(target, points[index], points[index + 1]));
  }

  return minDistance;
}

function getCircleIntersectionParams(
  center: StrokePoint,
  radius: number,
  start: StrokePoint,
  end: StrokePoint
) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const fx = start.x - center.x;
  const fy = start.y - center.y;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;
  const discriminant = b * b - 4 * a * c;

  if (a === 0 || discriminant < 0) {
    return [];
  }

  const root = Math.sqrt(discriminant);
  const t1 = (-b - root) / (2 * a);
  const t2 = (-b + root) / (2 * a);

  return [t1, t2]
    .filter((value) => value > 0 && value < 1)
    .sort((left, right) => left - right)
    .filter((value, index, values) => index === 0 || Math.abs(value - values[index - 1]) > 0.0001);
}

export function pointsToSvgPath(points: StrokePoint[]) {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const point = points[0];
    return `M ${point.x} ${point.y} l 0.01 0.01`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;
    path += ` Q ${current.x} ${current.y} ${midX} ${midY}`;
  }

  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;
  return path;
}

export function pointNearStroke(target: StrokePoint, points: StrokePoint[], radius: number) {
  return getStrokeDistance(target, points) <= radius;
}

export function findNearestStroke(target: StrokePoint, strokes: Stroke[], hitRadius: number) {
  let match: { stroke: Stroke; distance: number } | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const stroke of strokes) {
    const distance = getStrokeDistance(target, stroke.points);

    if (distance <= hitRadius && distance < bestDistance) {
      bestDistance = distance;
      match = { stroke, distance };
    }
  }

  return match;
}

export function splitStrokeByEraser(target: StrokePoint, points: StrokePoint[], radius: number) {
  if (points.length === 0) {
    return [];
  }

  if (points.length === 1) {
    return getDistance(target, points[0]) <= radius ? [] : [points];
  }

  const segments: StrokePoint[][] = [];
  let current: StrokePoint[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const breakpoints = [0, ...getCircleIntersectionParams(target, radius, start, end), 1];

    for (let rangeIndex = 0; rangeIndex < breakpoints.length - 1; rangeIndex += 1) {
      const from = breakpoints[rangeIndex];
      const to = breakpoints[rangeIndex + 1];
      const midpoint = interpolatePoint(start, end, (from + to) / 2);
      const keep = getDistance(midpoint, target) > radius;

      if (!keep) {
        if (current.length > 1) {
          segments.push(current);
        }
        current = [];
        continue;
      }

      const rangeStart = interpolatePoint(start, end, from);
      const rangeEnd = interpolatePoint(start, end, to);

      if (current.length === 0) {
        current = [rangeStart];
      } else if (!almostSamePoint(current[current.length - 1], rangeStart)) {
        if (current.length > 1) {
          segments.push(current);
        }
        current = [rangeStart];
      }

      if (!almostSamePoint(current[current.length - 1], rangeEnd)) {
        current.push(rangeEnd);
      }
    }
  }

  if (current.length > 1) {
    segments.push(current);
  }

  return segments;
}
