import { ChartJsChartElement } from '@graph-web-component/chart';
import { Legend, Tooltip, type Chart, type ChartConfiguration } from 'chart.js';
import type { LineChartStyle, LineDatum } from './types.js';

const DEFAULT_STYLE: LineChartStyle = {
  axisColor: '#64748b',
  gridColor: '#e2e8f0',
  lineColor: '#2563eb',
  lineWidth: 2,
  pointRadius: 3,
};

export class GraphLineChartElement extends ChartJsChartElement<'line'> {
  static readonly observedAttributes = [
    'axis-color',
    'grid-color',
    'line-color',
    'line-width',
    'point-radius',
  ];

  #data: readonly LineDatum[] = [];

  constructor() {
    super();
  }

  get data(): readonly LineDatum[] {
    return this.#data;
  }

  set data(value: readonly LineDatum[]) {
    const next = value.map(({ x, y }) => ({ x: Number(x), y: Number(y) }));
    if (next.some(({ x, y }) => !Number.isFinite(x) || !Number.isFinite(y))) {
      throw new TypeError('Line chart data must contain finite x and y values.');
    }

    this.#data = Object.freeze(next.map((datum) => Object.freeze(datum)));
    this.setAccessibleDescription(
      `${next.length} points. ${next.map(({ x, y }) => `x ${x}, y ${y}`).join('; ')}`,
    );
    this.requestChartUpdate();
  }

  attributeChangedCallback(): void {
    this.requestChartUpdate('none');
  }

  protected createChartConfiguration(): ChartConfiguration<'line'> {
    const style = this.#style();
    return {
      type: 'line',
      data: {
        datasets: [{
          data: [...this.#data],
          parsing: false,
          borderColor: style.lineColor,
          borderWidth: style.lineWidth,
          pointBackgroundColor: style.lineColor,
          pointRadius: style.pointRadius,
        }],
      },
      plugins: [Tooltip, Legend],
      options: {
        maintainAspectRatio: false,
        normalized: true,
        responsive: true,
        scales: {
          x: {
            type: 'linear',
            border: { color: style.axisColor },
            grid: { color: style.gridColor },
          },
          y: {
            type: 'linear',
            border: { color: style.axisColor },
            grid: { color: style.gridColor },
          },
        },
      },
    };
  }

  protected synchronizeChart(chart: Chart<'line'>): void {
    const style = this.#style();
    const dataset = chart.data.datasets[0];
    if (!dataset) return;

    dataset.data = [...this.#data];
    dataset.borderColor = style.lineColor;
    dataset.borderWidth = style.lineWidth;
    dataset.pointBackgroundColor = style.lineColor;
    dataset.pointRadius = style.pointRadius;

    const scales = chart.options.scales;
    if (scales?.x) {
      scales.x.border = { color: style.axisColor };
      scales.x.grid = { color: style.gridColor };
    }
    if (scales?.y) {
      scales.y.border = { color: style.axisColor };
      scales.y.grid = { color: style.gridColor };
    }
  }

  #style(): LineChartStyle {
    return {
      axisColor: this.getAttribute('axis-color') ?? DEFAULT_STYLE.axisColor,
      gridColor: this.getAttribute('grid-color') ?? DEFAULT_STYLE.gridColor,
      lineColor: this.getAttribute('line-color') ?? DEFAULT_STYLE.lineColor,
      lineWidth: this.#positiveNumberAttribute('line-width', DEFAULT_STYLE.lineWidth),
      pointRadius: this.#positiveNumberAttribute('point-radius', DEFAULT_STYLE.pointRadius),
    };
  }

  #positiveNumberAttribute(name: string, fallback: number): number {
    const value = Number(this.getAttribute(name));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }
}
