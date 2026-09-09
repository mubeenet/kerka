import { ChartJsChartElement } from '@graph-web-component/chart';
import type { ActiveElement, Chart, ChartConfiguration } from 'chart.js';
import { calculatePercentages, validateThreeDPieData } from './geometry.js';
import type {
  ThreeDPieDatum,
  ThreeDPieOptions,
  ThreeDPieSliceDetail,
} from './types.js';
import { DEFAULT_THREE_D_PIE_OPTIONS } from './types.js';

export class GraphThreeDPieChartElement extends ChartJsChartElement<'threeDPie'> {
  static readonly observedAttributes = [
    'aria-label',
    'depth',
    'hover-offset',
    'offset',
    'reversed',
    'rotation',
    'show-percentage',
    'show-tooltip',
    'side-shade',
    'vertical-scale',
  ];

  #data: readonly ThreeDPieDatum[] = [];
  readonly #sliceObserver: MutationObserver;

  constructor() {
    super();
    this.#sliceObserver = new MutationObserver(() => this.#refreshData());
  }

  override connectedCallback(): void {
    this.#refreshData(false);
    this.#sliceObserver.observe(this, {
      attributeFilter: ['color', 'label', 'value'],
      attributes: true,
      childList: true,
      subtree: true,
    });
    super.connectedCallback();
  }

  override disconnectedCallback(): void {
    this.#sliceObserver.disconnect();
    super.disconnectedCallback();
  }

  attributeChangedCallback(name: string): void {
    if (name === 'aria-label') this.#updateAccessibleDescription();
    this.#resolvedOptions();
    this.requestChartUpdate('none');
  }

  protected createChartConfiguration(): ChartConfiguration<'threeDPie'> {
    const options = this.#resolvedOptions();
    return {
      type: 'threeDPie',
      data: {
        labels: this.#data.map(({ label }) => label),
        datasets: [{
          data: this.#data.map(({ value }) => value),
          backgroundColor: this.#data.map(({ color }) => color),
          borderWidth: 0,
          depth: options.depth,
          hoverBackgroundColor: this.#data.map(({ color }) => color),
          hoverBorderWidth: 0,
          hoverOffset: options.hoverOffset,
          offset: options.offset,
          sideShade: options.sideShade,
          verticalScale: options.verticalScale,
        }],
      },
      options: {
        animation: {
          animateRotate: true,
          animateScale: false,
        },
        cutout: 0,
        depth: options.depth,
        maintainAspectRatio: false,
        onClick: (_event, active) => this.#emitSliceEvent('three-d-pie-click', active),
        onHover: (_event, active) => this.#emitSliceEvent('three-d-pie-hover', active),
        responsive: true,
        reversed: options.reversed,
        rotation: options.rotation,
        sideShade: options.sideShade,
        verticalScale: options.verticalScale,
        plugins: {
          legend: { display: false },
          threeDPieLabels: this.#percentageLabelOptions(),
          tooltip: {
            enabled: this.hasAttribute('show-tooltip'),
            callbacks: {
              label: (context) => {
                const datum = this.#data[context.dataIndex];
                if (!datum) return '';
                const percentage = calculatePercentages(this.#data)[context.dataIndex] ?? 0;
                return `${datum.label}: ${datum.value} (${percentage.toFixed(1)}%)`;
              },
            },
          },
        },
      },
    };
  }

  protected synchronizeChart(chart: Chart<'threeDPie'>): void {
    const options = this.#resolvedOptions();
    chart.data.labels = this.#data.map(({ label }) => label);
    const dataset = chart.data.datasets[0];
    if (dataset) {
      dataset.data = this.#data.map(({ value }) => value);
      dataset.backgroundColor = this.#data.map(({ color }) => color);
      dataset.depth = options.depth;
      dataset.hoverBackgroundColor = this.#data.map(({ color }) => color);
      dataset.hoverBorderWidth = 0;
      dataset.hoverOffset = options.hoverOffset;
      dataset.offset = options.offset;
      dataset.sideShade = options.sideShade;
      dataset.verticalScale = options.verticalScale;
    }
    chart.options.depth = options.depth;
    chart.options.rotation = options.rotation;
    chart.options.reversed = options.reversed;
    chart.options.sideShade = options.sideShade;
    chart.options.verticalScale = options.verticalScale;
    if (chart.options.plugins) {
      chart.options.plugins.threeDPieLabels = this.#percentageLabelOptions();
      if (chart.options.plugins.tooltip) {
        chart.options.plugins.tooltip.enabled = this.hasAttribute('show-tooltip');
      }
    }
  }

  #emitSliceEvent(
    name: 'three-d-pie-click' | 'three-d-pie-hover',
    active: readonly ActiveElement[],
  ): void {
    const first = active[0];
    const detail = first ? this.#sliceDetail(first.index) : null;
    this.dispatchEvent(new CustomEvent<ThreeDPieSliceDetail | null>(name, { detail }));
  }

  #sliceDetail(index: number): ThreeDPieSliceDetail | null {
    const datum = this.#data[index];
    if (!datum) return null;
    return {
      ...datum,
      index,
      percentage: calculatePercentages(this.#data)[index] ?? 0,
    };
  }

  #resolvedOptions(): Required<ThreeDPieOptions> {
    const depth = this.#numberOption('depth', DEFAULT_THREE_D_PIE_OPTIONS.depth);
    const hoverOffset = this.#numberOption(
      'hover-offset',
      DEFAULT_THREE_D_PIE_OPTIONS.hoverOffset,
    );
    const offset = this.#numberOption('offset', DEFAULT_THREE_D_PIE_OPTIONS.offset);
    const reversed = this.hasAttribute('reversed');
    const rotation = this.#numberOption(
      'rotation',
      DEFAULT_THREE_D_PIE_OPTIONS.rotation,
      true,
    );
    const sideShade = this.#numberOption(
      'side-shade',
      DEFAULT_THREE_D_PIE_OPTIONS.sideShade,
    );
    const verticalScale = this.#numberOption(
      'vertical-scale',
      DEFAULT_THREE_D_PIE_OPTIONS.verticalScale,
    );

    if (depth < 0 || hoverOffset < 0 || offset < 0) {
      throw new RangeError('3D pie depth, hover offset, and offset must be non-negative.');
    }
    if (sideShade < 0 || sideShade > 1) {
      throw new RangeError('3D pie side shade must be between 0 and 1.');
    }
    if (verticalScale <= 0 || verticalScale > 1) {
      throw new RangeError('3D pie vertical scale must be greater than 0 and at most 1.');
    }

    return {
      depth,
      hoverOffset,
      offset,
      reversed,
      rotation,
      sideShade,
      verticalScale,
    };
  }

  #numberOption(
    attribute: string,
    fallback: number,
    allowNegative = false,
  ): number {
    const attributeValue = this.getAttribute(attribute);
    const value = attributeValue === null ? fallback : Number(attributeValue);
    if (!Number.isFinite(value) || (!allowNegative && value < 0)) {
      throw new TypeError(`Invalid numeric value for ${attribute}.`);
    }
    return value;
  }

  #refreshData(requestUpdate = true): void {
    const data = [...this.children]
      .filter((child): child is HTMLElement => child.localName === 'kerka-pie-slice')
      .map((slice) => {
        const label = slice.getAttribute('label');
        const value = slice.getAttribute('value');
        const color = slice.getAttribute('color');
        if (label === null || value === null || color === null) {
          throw new TypeError(
            '<kerka-pie-slice> requires label, value, and color attributes.',
          );
        }
        return { label, value: Number(value), color };
      });
    this.#data = validateThreeDPieData(data);
    this.#updateAccessibleDescription();
    if (requestUpdate) this.requestChartUpdate();
  }

  #updateAccessibleDescription(): void {
    const percentages = calculatePercentages(this.#data);
    const title = this.getAttribute('aria-label');
    const slices = this.#data.map((datum, index) =>
      `${datum.label}: ${datum.value}, ${(percentages[index] ?? 0).toFixed(1)}%`,
    );
    this.setAccessibleDescription(
      [title, ...slices].filter((value): value is string => Boolean(value)).join('. '),
    );
  }

  #percentageLabelOptions(): false | { color: string; font: string } {
    return this.hasAttribute('show-percentage')
      ? { color: '#ffffff', font: '16px sans-serif' }
      : false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'kerka-3d-pie-chart': GraphThreeDPieChartElement;
  }
}
