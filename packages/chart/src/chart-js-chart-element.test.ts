// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const chartInstances: MockChart[] = [];
function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

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
  });

  it('creates one Chart.js instance after the first layout frame', async () => {
    const element = document.createElement('test-chart-js-element');
    document.body.append(element);

    expect(chartInstances).toHaveLength(0);
    await waitForAnimationFrame();

    expect(chartInstances).toHaveLength(1);
    expect(chartInstances[0]?.config).toMatchObject({ type: 'line' });
    expect(element.getAttribute('role')).toBe('img');
    expect(element.shadowRoot?.querySelector('canvas')).not.toBeNull();
  });

  it('batches synchronous update requests and preserves the latest mode', async () => {
    const element = document.createElement('test-chart-js-element') as TestChartElement;
    document.body.append(element);
    await waitForAnimationFrame();

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

  it('destroys on disconnect and creates a fresh instance on reconnect', async () => {
    const element = document.createElement('test-chart-js-element');
    document.body.append(element);
    await waitForAnimationFrame();
    const first = chartInstances[0];

    element.remove();
    expect(first?.destroy).toHaveBeenCalledOnce();

    document.body.append(element);
    await waitForAnimationFrame();
    expect(chartInstances).toHaveLength(2);
  });

  it('does not create a chart when disconnected before its animation frame', async () => {
    const element = document.createElement('test-chart-js-element');
    document.body.append(element);

    element.remove();
    await waitForAnimationFrame();

    expect(chartInstances).toHaveLength(0);
  });
});
