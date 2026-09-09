// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const chartInstances: MockChart[] = [];
const resizeObserverInstances: MockResizeObserver[] = [];

class MockResizeObserver {
  readonly disconnect = vi.fn();
  readonly observe = vi.fn();

  constructor(readonly callback: ResizeObserverCallback) {
    resizeObserverInstances.push(this);
  }
}

vi.stubGlobal('ResizeObserver', MockResizeObserver);

class MockChart {
  readonly config: unknown;
  readonly destroy = vi.fn();
  readonly resize = vi.fn();
  readonly update = vi.fn();

  constructor(_canvas: HTMLCanvasElement, config: unknown) {
    this.config = config;
    chartInstances.push(this);
  }
}

vi.mock('chart.js', () => ({ Chart: MockChart }));

const { ChartJsChartElement } = await import('./chart-js-chart-element.js');

class TestChartElement extends ChartJsChartElement<'line'> {
  value = 1;

  constructor() {
    super();
  }

  protected createChartConfiguration() {
    return {
      type: 'line' as const,
      data: { datasets: [{ data: [this.value] }] },
    };
  }

  protected synchronizeChart(): void {}

  update(mode: 'default' | 'none' = 'default'): void {
    this.requestChartUpdate(mode);
  }

  describeForAccessibility(text: string): void {
    this.setAccessibleDescription(text);
  }
}

customElements.define('test-chart-js-element', TestChartElement);

describe('ChartJsChartElement', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    chartInstances.length = 0;
    resizeObserverInstances.length = 0;
  });

  it('creates one Chart.js instance when connected', () => {
    const element = document.createElement('test-chart-js-element');
    document.body.append(element);

    expect(chartInstances).toHaveLength(1);
    expect(chartInstances[0]?.config).toMatchObject({ type: 'line' });
    expect(element.getAttribute('role')).toBe('img');
    expect(element.shadowRoot?.querySelector('canvas')).not.toBeNull();
  });

  it('batches synchronous update requests and preserves the latest mode', async () => {
    const element = document.createElement('test-chart-js-element') as TestChartElement;
    document.body.append(element);

    element.update();
    element.update('none');
    await Promise.resolve();

    expect(chartInstances[0]?.update).toHaveBeenCalledTimes(1);
    expect(chartInstances[0]?.update).toHaveBeenCalledWith('none');
  });

  it('updates accessible fallback text', () => {
    const element = document.createElement('test-chart-js-element') as TestChartElement;
    element.describeForAccessibility('A 50%; B 50%');

    expect(element.shadowRoot?.querySelector('.accessible-description')?.textContent)
      .toBe('A 50%; B 50%');
  });

  it('allows the host to shrink as a flex item', () => {
    const element = document.createElement('test-chart-js-element');
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('style')?.textContent)
      .toContain('min-inline-size: 0');
  });

  it('resizes the chart when the host layout changes', () => {
    const element = document.createElement('test-chart-js-element');
    document.body.append(element);

    const observer = resizeObserverInstances[0];
    expect(observer?.observe).toHaveBeenCalledWith(element);

    observer?.callback([], observer as unknown as ResizeObserver);

    expect(chartInstances[0]?.resize).toHaveBeenCalledOnce();
  });

  it('destroys on disconnect and creates a fresh instance on reconnect', () => {
    const element = document.createElement('test-chart-js-element');
    document.body.append(element);
    const first = chartInstances[0];

    element.remove();
    expect(resizeObserverInstances[0]?.disconnect).toHaveBeenCalledOnce();
    expect(first?.destroy).toHaveBeenCalledOnce();

    document.body.append(element);
    expect(chartInstances).toHaveLength(2);
    expect(resizeObserverInstances[0]?.observe).toHaveBeenCalledTimes(2);
  });
});
