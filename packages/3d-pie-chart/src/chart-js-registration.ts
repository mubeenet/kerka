import { Chart, Legend, Tooltip } from 'chart.js';
import { ThreeDArcElement } from './three-d-arc-element.js';
import { ThreeDPieController } from './three-d-pie-controller.js';
import { threeDPieLabelsPlugin } from './three-d-pie-labels-plugin.js';

export function registerThreeDPieChartComponents(): void {
  Chart.register(
    ThreeDPieController,
    ThreeDArcElement,
    threeDPieLabelsPlugin,
    Tooltip,
    Legend,
  );
}
