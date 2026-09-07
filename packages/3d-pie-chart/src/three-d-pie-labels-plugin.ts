import type { Chart, Plugin } from 'chart.js';
import { calculatePercentages } from './geometry.js';
import type { ThreeDArcElement } from './three-d-arc-element.js';
import type { ThreeDPieLabelOptions } from './chart-js-types.js';

export const threeDPieLabelsPlugin: Plugin<'threeDPie'> = {
  id: 'threeDPieLabels',
  defaults: {
    color: '#ffffff',
    font: '16px sans-serif',
  },
  afterDatasetsDraw(chart, _arguments, options) {
    drawPercentageLabels(chart, options);
  },
};

export function drawPercentageLabels(
  chart: Chart<'threeDPie'>,
  options: ThreeDPieLabelOptions,
): void {
  const dataset = chart.data.datasets[0];
  if (!dataset) return;

  const values = dataset.data.map((value) => Number(value));
  const percentages = calculatePercentages(values.map((value) => ({
    label: '',
    value,
    color: '',
  })));
  const arcs = chart.getDatasetMeta(0).data as ThreeDArcElement[];
  const { ctx } = chart;

  ctx.save();
  ctx.fillStyle = options.color ?? '#ffffff';
  ctx.font = options.font ?? '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let index = 0; index < arcs.length; index += 1) {
    const percentage = percentages[index] ?? 0;
    const arc = arcs[index];
    const hidden = (arc as unknown as { hidden?: boolean } | undefined)?.hidden;
    if (!arc || hidden || percentage <= 0) continue;
    const position = arc.getCenterPoint(false);
    ctx.fillText(`${percentage.toFixed(1)}%`, position.x, position.y);
  }
  ctx.restore();
}
