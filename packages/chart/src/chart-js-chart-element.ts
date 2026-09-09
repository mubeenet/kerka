import {
  Chart,
  type ChartConfiguration,
  type ChartType,
  type UpdateMode,
} from 'chart.js';

const styles = `
  :host {
    display: block;
    min-block-size: 12rem;
    min-inline-size: 0;
    position: relative;
  }

  canvas {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }

  .accessible-description {
    block-size: 1px;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    inline-size: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
  }
`;

export abstract class ChartJsChartElement<
  TType extends ChartType = ChartType,
> extends HTMLElement {
  readonly #canvas: HTMLCanvasElement;
  readonly #description: HTMLSpanElement;
  readonly #resizeObserver: ResizeObserver;
  #chart: Chart<TType> | undefined;
  #updateQueued = false;
  #updateMode: UpdateMode = 'default';

  protected constructor() {
    super();

    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = styles;

    this.#canvas = document.createElement('canvas');
    this.#canvas.setAttribute('aria-hidden', 'true');

    this.#description = document.createElement('span');
    this.#description.className = 'accessible-description';

    this.#resizeObserver = new ResizeObserver(() => {
      this.#chart?.resize();
    });

    root.append(style, this.#canvas, this.#description);
  }

  connectedCallback(): void {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'img');
    this.#createChart();
    this.#resizeObserver.observe(this);
  }

  disconnectedCallback(): void {
    this.#resizeObserver.disconnect();
    this.#chart?.destroy();
    this.#chart = undefined;
    this.#updateQueued = false;
  }

  protected get chart(): Chart<TType> | undefined {
    return this.#chart;
  }

  protected requestChartUpdate(mode: UpdateMode = 'default'): void {
    this.#updateMode = mode;
    if (!this.isConnected || !this.#chart || this.#updateQueued) return;

    this.#updateQueued = true;
    queueMicrotask(() => {
      this.#updateQueued = false;
      const chart = this.#chart;
      if (!chart || !this.isConnected) return;

      this.synchronizeChart(chart);
      chart.update(this.#updateMode);
      this.#updateMode = 'default';
    });
  }

  protected setAccessibleDescription(description: string): void {
    this.#description.textContent = description;
  }

  protected abstract createChartConfiguration(): ChartConfiguration<TType>;

  protected abstract synchronizeChart(chart: Chart<TType>): void;

  #createChart(): void {
    if (this.#chart) return;
    this.#chart = new Chart<TType>(this.#canvas, this.createChartConfiguration());
  }
}
