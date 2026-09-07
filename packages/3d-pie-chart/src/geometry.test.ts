import { describe, expect, it } from 'vitest';
import {
  angleIsWithin,
  backFacingSegments,
  calculateOffsetArcGeometry,
  calculatePercentages,
  frontFacingSegments,
  isFrontFacingAngle,
  normalizeAngle,
  pointInProjectedArc,
  projectPoint,
  reverseArcAngles,
  shadeHexColor,
  validateThreeDPieData,
} from './geometry.js';

describe('3D pie geometry contracts', () => {
  it('normalizes positive and negative angles', () => {
    expect(normalizeAngle(Math.PI * 3)).toBeCloseTo(Math.PI);
    expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo(Math.PI * 1.5);
  });

  it('handles slices that wrap through zero', () => {
    expect(angleIsWithin(0, Math.PI * 1.5, Math.PI * 2.5)).toBe(true);
    expect(angleIsWithin(Math.PI, Math.PI * 1.5, Math.PI * 2.5)).toBe(false);
  });

  it('projects circular coordinates onto an ellipse', () => {
    expect(projectPoint(100, 50, 40, Math.PI / 2, 0.5)).toEqual({
      x: 100,
      y: 70,
    });
  });

  it('mirrors an arc around the configured rotation axis', () => {
    expect(reverseArcAngles(-Math.PI / 2, 0, 0)).toEqual({
      startAngle: -Math.PI,
      endAngle: -Math.PI / 2,
    });
  });

  it('matches Chart.js radius expansion for a persistently offset arc', () => {
    expect(calculateOffsetArcGeometry(
      0,
      Math.PI,
      Math.PI,
      0,
      50,
      40,
      0,
    )).toMatchObject({
      innerRadius: 0,
      outerRadius: 60,
    });
  });

  it('hit-tests against the projected ellipse and slice angles', () => {
    const geometry = {
      centerX: 100,
      centerY: 100,
      innerRadius: 0,
      outerRadius: 50,
      verticalScale: 0.5,
      startAngle: 0,
      endAngle: Math.PI,
    };

    expect(pointInProjectedArc(100, 120, geometry)).toBe(true);
    expect(pointInProjectedArc(100, 75, geometry)).toBe(false);
    expect(pointInProjectedArc(100, 130, geometry)).toBe(false);
  });

  it('identifies the visible front half of the extrusion', () => {
    expect(isFrontFacingAngle(Math.PI / 2)).toBe(true);
    expect(isFrontFacingAngle(Math.PI * 1.5)).toBe(false);
  });

  it('clips extrusion arcs to the visible front half', () => {
    expect(frontFacingSegments(-Math.PI / 2, Math.PI / 2)).toEqual([
      { startAngle: 0, endAngle: Math.PI / 2 },
    ]);
    expect(frontFacingSegments(Math.PI / 2, Math.PI * 2.5)).toEqual([
      { startAngle: Math.PI / 2, endAngle: Math.PI },
      { startAngle: Math.PI * 2, endAngle: Math.PI * 2.5 },
    ]);
  });

  it('clips newly exposed extrusion arcs to the back half', () => {
    expect(backFacingSegments(-Math.PI / 2, Math.PI / 2)).toEqual([
      { startAngle: -Math.PI / 2, endAngle: 0 },
    ]);
    expect(backFacingSegments(Math.PI / 2, Math.PI * 2.5)).toEqual([
      { startAngle: Math.PI, endAngle: Math.PI * 2 },
    ]);
  });

  it('darkens six-digit hex colors for side faces', () => {
    expect(shadeHexColor('#336699', 0.25)).toBe('#264d73');
    expect(shadeHexColor('canvas-gradient', 0.25)).toBe('canvas-gradient');
  });

  it('calculates percentages and handles an all-zero dataset', () => {
    expect(calculatePercentages([
      { label: 'A', value: 1, color: '#000' },
      { label: 'B', value: 3, color: '#fff' },
    ])).toEqual([25, 75]);
    expect(calculatePercentages([
      { label: 'A', value: 0, color: '#000' },
    ])).toEqual([0]);
  });

  it('normalizes valid data and rejects invalid values', () => {
    const source = [{ label: 'A', value: 2, color: '#123456' }];
    const result = validateThreeDPieData(source);
    expect(result).toEqual(source);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result[0])).toBe(true);
    expect(() => validateThreeDPieData([
      { label: 'A', value: -1, color: '#123456' },
    ])).toThrow(TypeError);
  });
});
