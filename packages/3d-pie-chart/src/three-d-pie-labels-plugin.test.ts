import { describe, expect, it, vi } from 'vitest';
import { drawPercentageLabels, threeDPieLabelsPlugin } from './three-d-pie-labels-plugin.js';

describe('3D pie percentage labels', () => {
  it('draws percentages at the projected arc centers', () => {
    const context = {
      fillText: vi.fn(),
      restore: vi.fn(),
      save: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    const chart = {
      ctx: context,
      data: { datasets: [{ data: [458, 83, 83, 83, 292] }] },
      getDatasetMeta: () => ({
        data: [
          { hidden: false, getCenterPoint: () => ({ x: 10, y: 20 }) },
          { hidden: false, getCenterPoint: () => ({ x: 20, y: 30 }) },
          { hidden: true, getCenterPoint: () => ({ x: 30, y: 40 }) },
          { hidden: false, getCenterPoint: () => ({ x: 40, y: 50 }) },
          { hidden: false, getCenterPoint: () => ({ x: 50, y: 60 }) },
        ],
      }),
    };

    drawPercentageLabels(
      chart as never,
      { color: '#fff', font: '16px sans-serif' },
    );

    expect(context.fillText).toHaveBeenNthCalledWith(1, '45.8%', 10, 20);
    expect(context.fillText).toHaveBeenNthCalledWith(2, '8.3%', 20, 30);
    expect(context.fillText).toHaveBeenNthCalledWith(3, '8.3%', 40, 50);
    expect(context.fillText).toHaveBeenNthCalledWith(4, '29.2%', 50, 60);
  });

  it('does not draw labels for an all-zero dataset', () => {
    const context = {
      fillText: vi.fn(),
      restore: vi.fn(),
      save: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    drawPercentageLabels({
      ctx: context,
      data: { datasets: [{ data: [0] }] },
      getDatasetMeta: () => ({
        data: [{ hidden: false, getCenterPoint: () => ({ x: 0, y: 0 }) }],
      }),
    } as never, {});
    expect(context.fillText).not.toHaveBeenCalled();
  });

  it('does not run when accidentally registered against a non-3D-pie chart', () => {
    const context = {
      fillText: vi.fn(),
      restore: vi.fn(),
      save: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    threeDPieLabelsPlugin.afterDatasetsDraw?.({
      config: { type: 'line' },
      ctx: context,
      data: { datasets: [{ data: [1] }] },
      getDatasetMeta: () => ({
        data: [{ hidden: false, getCenterPoint: () => ({ x: 0, y: 0 }) }],
      }),
    } as never, {} as never, {});

    expect(context.fillText).not.toHaveBeenCalled();
  });
});
