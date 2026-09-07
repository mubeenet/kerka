import type { ThreeDPieDatum, ThreeDPieGeometry } from './types.js';

const TAU = Math.PI * 2;

export interface AngleSegment {
  readonly startAngle: number;
  readonly endAngle: number;
}

export interface OffsetArcGeometry extends AngleSegment {
  readonly innerRadius: number;
  readonly outerRadius: number;
}

export function calculateOffsetArcGeometry(
  startAngle: number,
  endAngle: number,
  circumference: number,
  innerRadius: number,
  outerRadius: number,
  offset: number,
  spacing: number,
  pixelMargin = 0,
): OffsetArcGeometry {
  const translation = offset / 4;
  const radiusOffset = translation * (
    1 - Math.sin(Math.min(Math.PI, circumference || 0))
  );
  const spacingRadius = spacing / 2;
  const displayedOuterRadius = Math.max(
    outerRadius + spacingRadius + radiusOffset - pixelMargin,
    0,
  );
  const displayedInnerRadius = innerRadius > 0
    ? innerRadius + spacingRadius + radiusOffset + pixelMargin
    : 0;
  const sweep = endAngle - startAngle;
  let spacingOffset = 0;
  if (spacingRadius && displayedOuterRadius > 0) {
    const unspacedInnerRadius = innerRadius > 0 ? innerRadius - spacingRadius : 0;
    const unspacedOuterRadius = displayedOuterRadius - spacingRadius;
    const averageRadius = (unspacedInnerRadius + unspacedOuterRadius) / 2;
    const adjustedSweep = averageRadius
      ? sweep * averageRadius / (averageRadius + spacingRadius)
      : sweep;
    spacingOffset = (sweep - adjustedSweep) / 2;
  }
  const adjustedSweep = displayedOuterRadius > 0
    ? Math.max(0.001, sweep * displayedOuterRadius - radiusOffset / Math.PI)
      / displayedOuterRadius
    : sweep;
  const angleOffset = (sweep - adjustedSweep) / 2;

  return {
    startAngle: startAngle + angleOffset + spacingOffset,
    endAngle: endAngle - angleOffset - spacingOffset,
    innerRadius: displayedInnerRadius,
    outerRadius: displayedOuterRadius,
  };
}

export function normalizeAngle(angle: number): number {
  return ((angle % TAU) + TAU) % TAU;
}

export function reverseArcAngles(
  startAngle: number,
  endAngle: number,
  rotationDegrees: number,
): AngleSegment {
  const axis = ((rotationDegrees - 90) * Math.PI) / 180;
  return {
    startAngle: axis * 2 - endAngle,
    endAngle: axis * 2 - startAngle,
  };
}

export function angleIsWithin(
  angle: number,
  startAngle: number,
  endAngle: number,
): boolean {
  const sweep = endAngle - startAngle;
  if (Math.abs(sweep) >= TAU) return true;

  const normalizedSweep = normalizeAngle(sweep);
  const relativeAngle = normalizeAngle(angle - startAngle);
  return relativeAngle <= normalizedSweep;
}

export function isFrontFacingAngle(angle: number): boolean {
  return Math.sin(angle) >= 0;
}

export function frontFacingSegments(
  startAngle: number,
  endAngle: number,
): readonly AngleSegment[] {
  if (endAngle <= startAngle) return [];

  const segments: AngleSegment[] = [];
  const firstCycle = Math.floor(startAngle / TAU) - 1;
  const lastCycle = Math.ceil(endAngle / TAU) + 1;
  for (let cycle = firstCycle; cycle <= lastCycle; cycle += 1) {
    const frontStart = cycle * TAU;
    const frontEnd = frontStart + Math.PI;
    const visibleStart = Math.max(startAngle, frontStart);
    const visibleEnd = Math.min(endAngle, frontEnd);
    if (visibleEnd > visibleStart) {
      segments.push({ startAngle: visibleStart, endAngle: visibleEnd });
    }
  }
  return segments;
}

export function backFacingSegments(
  startAngle: number,
  endAngle: number,
): readonly AngleSegment[] {
  if (endAngle <= startAngle) return [];

  const segments: AngleSegment[] = [];
  const firstCycle = Math.floor(startAngle / TAU) - 1;
  const lastCycle = Math.ceil(endAngle / TAU) + 1;
  for (let cycle = firstCycle; cycle <= lastCycle; cycle += 1) {
    const backStart = cycle * TAU + Math.PI;
    const backEnd = (cycle + 1) * TAU;
    const visibleStart = Math.max(startAngle, backStart);
    const visibleEnd = Math.min(endAngle, backEnd);
    if (visibleEnd > visibleStart) {
      segments.push({ startAngle: visibleStart, endAngle: visibleEnd });
    }
  }
  return segments;
}

export function shadeHexColor(color: string, shade: number): string {
  const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (!match) return color;

  const factor = 1 - Math.min(1, Math.max(0, shade));
  const channels = match.slice(1).map((channel) =>
    Math.round(Number.parseInt(channel, 16) * factor)
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${channels.join('')}`;
}

export function projectPoint(
  centerX: number,
  centerY: number,
  radius: number,
  angle: number,
  verticalScale: number,
): { readonly x: number; readonly y: number } {
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius * verticalScale,
  };
}

export function pointInProjectedArc(
  x: number,
  y: number,
  geometry: ThreeDPieGeometry,
): boolean {
  if (geometry.verticalScale <= 0) return false;

  const dx = x - geometry.centerX;
  const dy = (y - geometry.centerY) / geometry.verticalScale;
  const distance = Math.hypot(dx, dy);
  if (distance < geometry.innerRadius || distance > geometry.outerRadius) {
    return false;
  }

  return angleIsWithin(
    Math.atan2(dy, dx),
    geometry.startAngle,
    geometry.endAngle,
  );
}

export function calculatePercentages(
  data: readonly ThreeDPieDatum[],
): readonly number[] {
  const total = data.reduce((sum, datum) => sum + datum.value, 0);
  if (total <= 0) return data.map(() => 0);
  return data.map(({ value }) => (value / total) * 100);
}

export function validateThreeDPieData(
  data: readonly ThreeDPieDatum[],
): readonly ThreeDPieDatum[] {
  const normalized = data.map(({ label, value, color }) => ({
    label: String(label),
    value: Number(value),
    color: String(color),
  }));

  if (normalized.some(({ value }) => !Number.isFinite(value) || value < 0)) {
    throw new TypeError('3D pie values must be finite, non-negative numbers.');
  }

  return Object.freeze(normalized.map((datum) => Object.freeze(datum)));
}
