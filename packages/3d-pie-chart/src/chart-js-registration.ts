import { Chart } from 'chart.js';
import { ThreeDArcElement } from './three-d-arc-element.js';
import { ThreeDPieController } from './three-d-pie-controller.js';

export function registerThreeDPieChartComponents(): void {
  Chart.register(
    ThreeDPieController,
    ThreeDArcElement,
  );
}
