import { GraphLineChartElement } from './line-chart-element.js';
import { registerLineChartComponents } from './chart-js-registration.js';

export function defineLineChart(name = 'kerka-line-chart'): void {
  registerLineChartComponents();
  const existing = customElements.get(name);
  if (existing && existing !== GraphLineChartElement) {
    throw new Error(`Custom element "${name}" is already defined.`);
  }
  if (!existing) customElements.define(name, GraphLineChartElement);
}
