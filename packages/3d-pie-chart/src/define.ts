import { registerThreeDPieChartComponents } from './chart-js-registration.js';
import { GraphPieSliceElement } from './graph-pie-slice-element.js';
import { GraphThreeDPieChartElement } from './three-d-pie-chart-element.js';

export function defineThreeDPieChart(name = 'graph-3d-pie-chart'): void {
  registerThreeDPieChartComponents();
  const existingSlice = customElements.get('graph-pie-slice');
  if (existingSlice && existingSlice !== GraphPieSliceElement) {
    throw new Error('Custom element "graph-pie-slice" is already defined.');
  }
  if (!existingSlice) customElements.define('graph-pie-slice', GraphPieSliceElement);
  const existing = customElements.get(name);
  if (existing && existing !== GraphThreeDPieChartElement) {
    throw new Error(`Custom element "${name}" is already defined.`);
  }
  if (!existing) customElements.define(name, GraphThreeDPieChartElement);
}
