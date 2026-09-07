export interface ThreeDPieDatum {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}

export interface ThreeDPieOptions {
  readonly depth?: number;
  readonly hoverOffset?: number;
  readonly offset?: number;
  readonly reversed?: boolean;
  readonly rotation?: number;
  readonly sideShade?: number;
  readonly verticalScale?: number;
}

export interface ThreeDPieSliceDetail extends ThreeDPieDatum {
  readonly index: number;
  readonly percentage: number;
}

export interface ThreeDPieGeometry {
  readonly centerX: number;
  readonly centerY: number;
  readonly innerRadius: number;
  readonly outerRadius: number;
  readonly verticalScale: number;
  readonly startAngle: number;
  readonly endAngle: number;
}

export const DEFAULT_THREE_D_PIE_OPTIONS = Object.freeze({
  depth: 32,
  hoverOffset: 8,
  offset: 0,
  reversed: false,
  rotation: -90,
  sideShade: 0.28,
  verticalScale: 0.68,
});
