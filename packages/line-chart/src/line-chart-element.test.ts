// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const instances: MockChart[] = [];
const register = vi.fn();

function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

class MockChart {
  readonly configuration: Record<string, any>;
  readonly destroy = vi.fn();
  readonly update = vi.fn();
  data: Record<string, any>;
  options: Record<string, any>;

  constructor(_canvas: HTMLCanvasElement, configuration: Record<string, any>) {
    this.configuration = configuration;
    this.data = configuration.data;
    this.options = configuration.options;
    instances.push(this);
  }

  static register = register;
}

vi.mock('chart.js', () => ({
  Chart: MockChart,
  Legend: { id: 'legend' },
  LinearScale: { id: 'linear' },
  LineController: { id: 'line' },
  LineElement: { id: 'line-element' },
  PointElement: { id: 'point' },
  Tooltip: { id: 'tooltip' },
}));

const {
  defineLineChart,
  GraphLineChartElement,
  registerLineChartComponents,
} = await import('./index.js');

defineLineChart('test-chart-js-line');

describe('GraphLineChartElement on Chart.js', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    instances.length = 0;
    register.mockClear();
  });

  it('registers Chart.js parts and creates a line configuration', async () => {
    registerLineChartComponents();
    const element = document.createElement('test-chart-js-line') as GraphLineChartElement;
    element.data = [{ x: 1, y: 2 }];
    document.body.append(element);
    await waitForAnimationFrame();

    expect(register).toHaveBeenCalledOnce();
    expect(instances[0]?.data.datasets[0]).toMatchObject({
      data: [{ x: 1, y: 2 }],
      parsing: false,
      borderColor: '#2563eb',
    });
    expect(instances[0]?.configuration.plugins).toEqual([
      expect.objectContaining({ id: 'tooltip' }),
      expect.objectContaining({ id: 'legend' }),
    ]);
  });

  it('updates data and presentation without recreating the chart', async () => {
    const element = document.createElement('test-chart-js-line') as GraphLineChartElement;
    document.body.append(element);
    await waitForAnimationFrame();

    element.data = [{ x: 3, y: 7 }];
    element.setAttribute('line-color', '#ff0000');
    await Promise.resolve();

    expect(instances).toHaveLength(1);
    expect(instances[0]?.data.datasets[0]).toMatchObject({
      data: [{ x: 3, y: 7 }],
      borderColor: '#ff0000',
    });
    expect(instances[0]?.update).toHaveBeenCalledOnce();
  });

  it('rejects invalid data and publishes accessible fallback text', () => {
    const element = new GraphLineChartElement();
    expect(() => {
      element.data = [{ x: 1, y: Number.NaN }];
    }).toThrow(TypeError);

    element.data = [{ x: 1, y: 2 }];
    expect(element.shadowRoot?.textContent).toContain('1 points. x 1, y 2');
  });
});
