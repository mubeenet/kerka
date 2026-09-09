// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const instances: MockChart[] = [];

function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

class MockChart {
  static register = vi.fn();
  readonly configuration: Record<string, any>;
  data: Record<string, any>;
  options: Record<string, any>;
  readonly destroy = vi.fn();
  readonly update = vi.fn();

  constructor(_canvas: HTMLCanvasElement, configuration: Record<string, any>) {
    this.configuration = configuration;
    this.data = configuration.data;
    this.options = configuration.options;
    instances.push(this);
  }
}

class MockArcElement {
  static defaults = {};
  static defaultRoutes = {};
  static descriptors = {};
}

class MockDoughnutController {
  static defaults = {};
  update(): void {}
}

vi.mock('chart.js', () => ({
  ArcElement: MockArcElement,
  Chart: MockChart,
  DoughnutController: MockDoughnutController,
  Legend: { id: 'legend' },
  Tooltip: { id: 'tooltip' },
}));

const { defineThreeDPieChart, GraphThreeDPieChartElement } = await import('./index.js');
defineThreeDPieChart('test-3d-pie-chart');

describe('GraphThreeDPieChartElement', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    instances.length = 0;
  });

  it('maps component data and options into a Chart.js configuration', async () => {
    const element = document.createElement('test-3d-pie-chart') as GraphThreeDPieChartElement;
    element.innerHTML = `
      <kerka-pie-slice label="Blue" value="2" color="#3366cc"></kerka-pie-slice>
      <kerka-pie-slice label="Red" value="1" color="#dc3912"></kerka-pie-slice>
    `;
    element.setAttribute('depth', '24');
    element.setAttribute('offset', '6');
    element.setAttribute('reversed', '');
    element.setAttribute('vertical-scale', '0.6');
    document.body.append(element);
    await waitForAnimationFrame();

    expect(instances[0]?.data).toMatchObject({
      labels: ['Blue', 'Red'],
      datasets: [{
        data: [2, 1],
        backgroundColor: ['#3366cc', '#dc3912'],
        depth: 24,
        hoverBackgroundColor: ['#3366cc', '#dc3912'],
        hoverBorderWidth: 0,
        offset: 6,
        verticalScale: 0.6,
      }],
    });
    expect(instances[0]?.options.reversed).toBe(true);
    expect(instances[0]?.configuration.plugins).toEqual([
      expect.objectContaining({ id: 'tooltip' }),
      expect.objectContaining({ id: 'legend' }),
      expect.objectContaining({ id: 'threeDPieLabels' }),
    ]);
    expect(instances[0]?.options.plugins.threeDPieLabels).toBe(false);
    expect(instances[0]?.options.plugins.tooltip.enabled).toBe(false);
  });

  it('updates the existing chart and supports numeric attributes', async () => {
    const element = document.createElement('test-3d-pie-chart') as GraphThreeDPieChartElement;
    document.body.append(element);
    await waitForAnimationFrame();
    element.insertAdjacentHTML(
      'beforeend',
      '<kerka-pie-slice label="A" value="1" color="#000000"></kerka-pie-slice>',
    );
    element.setAttribute('depth', '40');
    await Promise.resolve();
    await Promise.resolve();

    expect(instances).toHaveLength(1);
    expect(instances[0]?.data.datasets[0].depth).toBe(40);
    expect(instances[0]?.update).toHaveBeenCalledOnce();
  });

  it('emits typed slice details for hover and click callbacks', async () => {
    const element = document.createElement('test-3d-pie-chart') as GraphThreeDPieChartElement;
    element.innerHTML = `
      <kerka-pie-slice label="A" value="1" color="#000000"></kerka-pie-slice>
      <kerka-pie-slice label="B" value="3" color="#ffffff"></kerka-pie-slice>
    `;
    document.body.append(element);
    await waitForAnimationFrame();
    const clicked = vi.fn();
    const hovered = vi.fn();
    element.addEventListener('three-d-pie-click', clicked);
    element.addEventListener('three-d-pie-hover', hovered);

    instances[0]?.options.onClick({}, [{ datasetIndex: 0, index: 1 }]);
    instances[0]?.options.onHover({}, []);

    expect(clicked.mock.calls[0]?.[0].detail).toEqual({
      label: 'B', value: 3, color: '#ffffff', index: 1, percentage: 75,
    });
    expect(hovered.mock.calls[0]?.[0].detail).toBeNull();
  });

  it('generates accessible percentages and rejects invalid attributes', () => {
    const element = document.createElement('test-3d-pie-chart') as GraphThreeDPieChartElement;
    element.setAttribute('aria-label', 'Market share');
    element.innerHTML =
      '<kerka-pie-slice label="A" value="1" color="#000000"></kerka-pie-slice>';
    document.body.append(element);
    expect(element.shadowRoot?.textContent).toContain('Market share. A: 1, 100.0%');
    expect(() => {
      element.setAttribute('vertical-scale', '2');
    }).toThrow(RangeError);
  });

  it('updates data when a slice attribute changes', async () => {
    const element = document.createElement('test-3d-pie-chart') as GraphThreeDPieChartElement;
    element.innerHTML =
      '<kerka-pie-slice label="A" value="1" color="#000000"></kerka-pie-slice>';
    document.body.append(element);
    await waitForAnimationFrame();
    element.querySelector('kerka-pie-slice')?.setAttribute('value', '4');
    await Promise.resolve();
    await Promise.resolve();

    expect(instances[0]?.data.datasets[0].data).toEqual([4]);
    expect(instances[0]?.update).toHaveBeenCalledOnce();
  });

  it('toggles percentage labels with the show-percentage attribute', async () => {
    const element = document.createElement('test-3d-pie-chart') as GraphThreeDPieChartElement;
    element.setAttribute('show-percentage', '');
    element.innerHTML =
      '<kerka-pie-slice label="A" value="1" color="#000000"></kerka-pie-slice>';
    document.body.append(element);
    await waitForAnimationFrame();

    expect(instances[0]?.options.plugins.threeDPieLabels).toEqual({
      color: '#ffffff',
      font: '16px sans-serif',
    });

    element.removeAttribute('show-percentage');
    await Promise.resolve();

    expect(instances[0]?.options.plugins.threeDPieLabels).toBe(false);
    expect(instances[0]?.update).toHaveBeenCalledOnce();
  });

  it('toggles hover tooltips with the show-tooltip attribute', async () => {
    const element = document.createElement('test-3d-pie-chart') as GraphThreeDPieChartElement;
    element.setAttribute('show-tooltip', '');
    element.innerHTML =
      '<kerka-pie-slice label="A" value="1" color="#000000"></kerka-pie-slice>';
    document.body.append(element);
    await waitForAnimationFrame();

    expect(instances[0]?.options.plugins.tooltip.enabled).toBe(true);

    element.removeAttribute('show-tooltip');
    await Promise.resolve();

    expect(instances[0]?.options.plugins.tooltip.enabled).toBe(false);
    expect(instances[0]?.update).toHaveBeenCalledOnce();
  });
});
