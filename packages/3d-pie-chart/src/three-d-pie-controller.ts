import { DoughnutController, type UpdateMode } from 'chart.js';
import { reverseArcAngles } from './geometry.js';
import type { RadialSide, ThreeDArcElement } from './three-d-arc-element.js';

interface ThreeDPieResolvedOptions {
  depth: number;
  reversed: boolean;
  rotation: number;
  sideShade: number;
  verticalScale: number;
}

export function resolveReversedAngles(
  reversed: boolean,
  startAngle: number,
  endAngle: number,
  rotation: number,
): ReturnType<typeof reverseArcAngles> | undefined {
  return reversed
    ? reverseArcAngles(startAngle, endAngle, rotation)
    : undefined;
}

export class ThreeDPieController extends DoughnutController {
  static override id = 'threeDPie';

  static override defaults = {
    ...DoughnutController.defaults,
    cutout: 0,
    dataElementType: 'threeDArc',
    depth: 32,
    reversed: false,
    sideShade: 0.28,
    verticalScale: 0.68,
  };

  override update(mode: UpdateMode): void {
    super.update(mode);

    const { chartArea } = this.chart;
    const options = (this as unknown as { options: ThreeDPieResolvedOptions }).options;
    const verticalScale = Math.min(1, Math.max(0.1, options.verticalScale));
    const depth = Math.max(0, options.depth);
    const availableHeight = Math.max(0, chartArea.height - depth);
    const maximumRadius = Math.min(
      chartArea.width / 2,
      availableHeight / (2 * verticalScale),
    );
    const radiusScale = this.outerRadius > 0
      ? Math.min(1, maximumRadius / this.outerRadius)
      : 1;
    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = chartArea.top + availableHeight / 2;
    const arcs = this._cachedMeta.data as ThreeDArcElement[];

    for (let index = 0; index < arcs.length; index += 1) {
      const arc = arcs[index];
      if (!arc) continue;
      const properties: Record<string, number> = {
        x: centerX,
        y: centerY,
        innerRadius: arc.innerRadius * radiusScale,
        outerRadius: arc.outerRadius * radiusScale,
        depth,
        sideShade: Math.min(1, Math.max(0, options.sideShade)),
        verticalScale,
      };
      if (options.reversed) {
        const finalAngles = arc.getProps(['startAngle', 'endAngle'], true);
        const angles = resolveReversedAngles(
          true,
          finalAngles.startAngle ?? 0,
          finalAngles.endAngle ?? 0,
          options.rotation,
        );
        if (angles) {
          properties.startAngle = angles.startAngle;
          properties.endAngle = angles.endAngle;
        }
      }
      this.updateElement(arc, index, properties, mode);
    }
  }

  override draw(): void {
    const ctx = this.chart.ctx;
    const arcs = this._cachedMeta.data as ThreeDArcElement[];
    const depthOrdered = [...arcs].sort((left, right) => {
      const leftAngle = (left.startAngle + left.endAngle) / 2;
      const rightAngle = (right.startAngle + right.endAngle) / 2;
      return Math.sin(leftAngle) - Math.sin(rightAngle);
    });
    const radialSides = arcs.flatMap((arc) => (
      (['start', 'end'] as const).map((side: RadialSide) => ({ arc, side }))
    )).sort((left, right) => (
      left.arc.getRadialSideDepth(left.side)
      - right.arc.getRadialSideDepth(right.side)
    ));

    for (const arc of depthOrdered) arc.drawBackOuterSide(ctx);
    for (const { arc, side } of radialSides) arc.drawRadialSide(ctx, side);
    for (const arc of depthOrdered) arc.drawFrontOuterSide(ctx);
    for (const arc of arcs) arc.drawTop(ctx);
  }
}
