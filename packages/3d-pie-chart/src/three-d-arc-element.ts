import { ArcElement, type ArcProps } from 'chart.js';
import {
  backFacingSegments,
  calculateOffsetArcGeometry,
  frontFacingSegments,
  pointInProjectedArc,
  projectPoint,
  shadeHexColor,
} from './geometry.js';

export interface ThreeDArcProps extends ArcProps {
  depth: number;
  sideShade: number;
  verticalScale: number;
}

export type RadialSide = 'start' | 'end';

export class ThreeDArcElement extends ArcElement {
  static override id = 'threeDArc';

  depth = 0;
  sideShade = 0.28;
  verticalScale = 0.68;

  constructor(configuration?: Partial<ThreeDArcProps>) {
    super(configuration);
    if (configuration) Object.assign(this, configuration);
  }

  override inRange(
    chartX: number,
    chartY: number,
    useFinalPosition: boolean,
  ): boolean {
    const properties = this.getProps(
      ['x', 'y', 'startAngle', 'endAngle', 'circumference', 'innerRadius', 'outerRadius'],
      useFinalPosition,
    );
    const center = this.#offsetCenter(
      properties.x ?? 0,
      properties.y ?? 0,
      ((properties.startAngle ?? 0) + (properties.endAngle ?? 0)) / 2,
    );
    const geometry = this.#displayGeometry(
      properties.startAngle ?? 0,
      properties.endAngle ?? 0,
      properties.circumference ?? 0,
      properties.innerRadius ?? 0,
      properties.outerRadius ?? 0,
    );
    return pointInProjectedArc(chartX, chartY, {
      ...geometry,
      verticalScale: this.verticalScale,
      centerX: center.x,
      centerY: center.y,
    });
  }

  override getCenterPoint(useFinalPosition: boolean): { x: number; y: number } {
    const properties = this.getProps(
      ['x', 'y', 'startAngle', 'endAngle', 'circumference', 'innerRadius', 'outerRadius'],
      useFinalPosition,
    );
    const geometry = this.#displayGeometry(
      properties.startAngle ?? 0,
      properties.endAngle ?? 0,
      properties.circumference ?? 0,
      properties.innerRadius ?? 0,
      properties.outerRadius ?? 0,
    );
    const angle = (geometry.startAngle + geometry.endAngle) / 2;
    const radius = (geometry.innerRadius + geometry.outerRadius) / 2;
    const center = this.#offsetCenter(properties.x ?? 0, properties.y ?? 0, angle);
    return projectPoint(
      center.x,
      center.y,
      radius,
      angle,
      this.verticalScale,
    );
  }

  override tooltipPosition(useFinalPosition: boolean): { x: number; y: number } {
    return this.getCenterPoint(useFinalPosition);
  }

  drawOuterSide(ctx: CanvasRenderingContext2D): void {
    this.drawBackOuterSide(ctx);
    this.drawFrontOuterSide(ctx);
  }

  drawBackOuterSide(ctx: CanvasRenderingContext2D): void {
    const geometry = this.#displayGeometry();
    this.#drawOuterSegments(
      ctx,
      backFacingSegments(geometry.startAngle, geometry.endAngle),
      geometry.outerRadius,
    );
  }

  drawFrontOuterSide(ctx: CanvasRenderingContext2D): void {
    const geometry = this.#displayGeometry();
    this.#drawOuterSegments(
      ctx,
      frontFacingSegments(geometry.startAngle, geometry.endAngle),
      geometry.outerRadius,
    );
  }

  #drawOuterSegments(
    ctx: CanvasRenderingContext2D,
    segments: readonly { readonly startAngle: number; readonly endAngle: number }[],
    outerRadius: number,
  ): void {
    if (this.circumference <= 0 || this.outerRadius <= 0 || this.depth <= 0) {
      return;
    }

    const backgroundColor = this.options.backgroundColor;
    ctx.save();
    ctx.fillStyle = typeof backgroundColor === 'string'
      ? shadeHexColor(backgroundColor, this.sideShade)
      : backgroundColor;

    for (const segment of segments) {
      this.#drawOuterWall(
        ctx,
        segment.startAngle,
        segment.endAngle,
        outerRadius,
      );
    }
    ctx.restore();
  }

  drawRadialSides(ctx: CanvasRenderingContext2D): void {
    this.drawRadialSide(ctx, 'start');
    this.drawRadialSide(ctx, 'end');
  }

  drawRadialSide(ctx: CanvasRenderingContext2D, side: RadialSide): void {
    if (
      this.circumference <= 0 ||
      this.outerRadius <= 0 ||
      this.depth <= 0
    ) {
      return;
    }

    const backgroundColor = this.options.backgroundColor;
    const geometry = this.#displayGeometry();
    const angle = side === 'start' ? geometry.startAngle : geometry.endAngle;
    ctx.save();
    ctx.fillStyle = typeof backgroundColor === 'string'
      ? shadeHexColor(backgroundColor, this.sideShade)
      : backgroundColor;
    this.#drawRadialWall(
      ctx,
      angle,
      geometry.innerRadius,
      geometry.outerRadius,
    );
    ctx.restore();
  }

  getRadialSideDepth(side: RadialSide): number {
    const geometry = this.#displayGeometry();
    const angle = side === 'start' ? geometry.startAngle : geometry.endAngle;
    const center = this.#offsetCenter(this.x, this.y);
    const middleRadius = (geometry.innerRadius + geometry.outerRadius) / 2;
    return center.y
      + Math.sin(angle) * middleRadius * this.verticalScale
      + this.depth / 2;
  }

  drawTop(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(1, this.verticalScale);
    ctx.translate(-this.x, -this.y);
    super.draw(ctx);
    ctx.restore();
  }

  override draw(ctx: CanvasRenderingContext2D): void {
    this.drawTop(ctx);
  }

  #drawOuterWall(
    ctx: CanvasRenderingContext2D,
    startAngle: number,
    endAngle: number,
    outerRadius: number,
  ): void {
    const center = this.#offsetCenter(this.x, this.y);
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.scale(1, this.verticalScale);
    ctx.translate(-center.x, -center.y);
    ctx.beginPath();
    ctx.arc(center.x, center.y, outerRadius, startAngle, endAngle);
    ctx.lineTo(
      center.x + Math.cos(endAngle) * outerRadius,
      center.y + Math.sin(endAngle) * outerRadius + this.depth / this.verticalScale,
    );
    ctx.arc(
      center.x,
      center.y + this.depth / this.verticalScale,
      outerRadius,
      endAngle,
      startAngle,
      true,
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  #drawRadialWall(
    ctx: CanvasRenderingContext2D,
    angle: number,
    innerRadius: number,
    outerRadius: number,
  ): void {
    const center = this.#offsetCenter(this.x, this.y);
    const innerTop = projectPoint(
      center.x,
      center.y,
      innerRadius,
      angle,
      this.verticalScale,
    );
    const outerTop = projectPoint(
      center.x,
      center.y,
      outerRadius,
      angle,
      this.verticalScale,
    );
    ctx.beginPath();
    ctx.moveTo(innerTop.x, innerTop.y);
    ctx.lineTo(outerTop.x, outerTop.y);
    ctx.lineTo(outerTop.x, outerTop.y + this.depth);
    ctx.lineTo(innerTop.x, innerTop.y + this.depth);
    ctx.closePath();
    ctx.fill();
  }

  #offsetCenter(
    x: number,
    y: number,
    angle = (this.startAngle + this.endAngle) / 2,
  ): { readonly x: number; readonly y: number } {
    const offset = (this.options.offset || 0) / 4;
    return {
      x: x + Math.cos(angle) * offset,
      y: y + Math.sin(angle) * offset * this.verticalScale,
    };
  }

  #displayGeometry(
    startAngle = this.startAngle,
    endAngle = this.endAngle,
    circumference = this.circumference,
    innerRadius = this.innerRadius,
    outerRadius = this.outerRadius,
  ) {
    return calculateOffsetArcGeometry(
      startAngle,
      endAngle,
      circumference,
      innerRadius,
      outerRadius,
      this.options.offset || 0,
      this.options.spacing || 0,
      this.pixelMargin,
    );
  }
}
