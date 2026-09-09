import { Chart } from 'chart.js';
import { describe, expect, it, vi } from 'vitest';
import { registerThreeDPieChartComponents } from './chart-js-registration.js';
import { ThreeDArcElement } from './three-d-arc-element.js';
import { threeDPieLabelsPlugin } from './three-d-pie-labels-plugin.js';
import {
  resolveReversedAngles,
  ThreeDPieController,
} from './three-d-pie-controller.js';

function createContext(): CanvasRenderingContext2D {
  return {
    arc: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

function createArc(): ThreeDArcElement {
  const arc = new ThreeDArcElement({
    x: 100,
    y: 100,
    startAngle: 0,
    endAngle: Math.PI,
    circumference: Math.PI,
    innerRadius: 0,
    outerRadius: 50,
    depth: 20,
    sideShade: 0.25,
    verticalScale: 0.5,
  });
  arc.options = {
    backgroundColor: '#336699',
    borderAlign: 'center',
    borderColor: '#ffffff',
    borderDash: [],
    borderDashOffset: 0,
    borderJoinStyle: 'bevel',
    borderRadius: 0,
    borderWidth: 0,
    circular: true,
    offset: 0,
    selfJoin: false,
    spacing: 0,
  };
  return arc;
}

describe('ThreeDArcElement', () => {
  it('uses elliptical hit testing and tooltip coordinates', () => {
    const arc = createArc();
    expect(arc.inRange(100, 120, false)).toBe(true);
    expect(arc.inRange(100, 70, false)).toBe(false);
    expect(arc.tooltipPosition(false)).toEqual({ x: 100, y: 112.5 });
  });

  it('includes the persistent slice offset in interaction geometry', () => {
    const arc = createArc();
    arc.options = { ...arc.options, offset: 40 };
    expect(arc.tooltipPosition(false)).toEqual({ x: 100, y: 120 });
    expect(arc.inRange(100, 130, false)).toBe(true);
    const context = createContext();
    arc.drawOuterSide(context);
    expect(context.arc).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      60,
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('draws side walls separately from its top face', () => {
    const arc = createArc();
    const context = createContext();
    const top = vi.spyOn(arc, 'drawTop').mockImplementation(() => {});

    arc.drawOuterSide(context);
    expect(context.fill).toHaveBeenCalled();
    expect(context.fillStyle).toBe('#264d73');

    arc.drawRadialSides(context);
    expect(context.moveTo).toHaveBeenCalledTimes(2);

    arc.draw(context);
    expect(top).toHaveBeenCalledOnce();
  });

  it('draws both radial cross-sections regardless of camera-facing half', () => {
    const arc = createArc();
    arc.startAngle = Math.PI * 1.5;
    arc.endAngle = Math.PI * 2.5;
    arc.circumference = Math.PI;
    const context = createContext();

    arc.drawRadialSides(context);

    expect(context.moveTo).toHaveBeenCalledTimes(2);
  });

  it('calculates depth independently for each radial boundary', () => {
    const arc = createArc();
    arc.startAngle = -Math.PI / 2;
    arc.endAngle = Math.PI / 2;
    arc.circumference = Math.PI;

    expect(arc.getRadialSideDepth('start'))
      .toBeLessThan(arc.getRadialSideDepth('end'));
  });
});

describe('ThreeDPieController', () => {
  it('does not override Chart.js angles unless reversal is enabled', () => {
    expect(resolveReversedAngles(false, 1, 2, 120)).toBeUndefined();
    expect(resolveReversedAngles(true, -Math.PI / 2, 0, 0)).toEqual({
      startAngle: -Math.PI,
      endAngle: -Math.PI / 2,
    });
  });

  it('registers a distinct Chart.js controller and element', () => {
    registerThreeDPieChartComponents();
    expect(Chart.registry.getController('threeDPie')).toBe(ThreeDPieController);
    expect(Chart.registry.getElement('threeDArc')).toBe(ThreeDArcElement);
    expect(() => Chart.registry.getPlugin(threeDPieLabelsPlugin.id)).toThrow();
  });

  it('layers front arcs over cross-sections over newly exposed back sides', () => {
    const calls: string[] = [];
    const first = {
      startAngle: 0,
      endAngle: Math.PI / 2,
      drawBackOuterSide: () => calls.push('first-back'),
      drawFrontOuterSide: () => calls.push('first-front'),
      drawTop: () => calls.push('first-top'),
      drawRadialSide: (_context: unknown, side: string) => calls.push(`first-${side}`),
      getRadialSideDepth: (side: string) => side === 'start' ? 30 : 0,
    };
    const second = {
      startAngle: Math.PI / 2,
      endAngle: Math.PI,
      drawBackOuterSide: () => calls.push('second-back'),
      drawFrontOuterSide: () => calls.push('second-front'),
      drawTop: () => calls.push('second-top'),
      drawRadialSide: (_context: unknown, side: string) => calls.push(`second-${side}`),
      getRadialSideDepth: (side: string) => side === 'start' ? 10 : 20,
    };

    ThreeDPieController.prototype.draw.call({
      chart: { ctx: createContext() },
      _cachedMeta: { data: [first, second] },
    });

    expect(calls).toEqual([
      'first-back',
      'second-back',
      'first-end',
      'second-start',
      'second-end',
      'first-start',
      'first-front',
      'second-front',
      'first-top',
      'second-top',
    ]);
  });
});
