import {
  Chart,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
} from 'chart.js';

export function registerLineChartComponents(): void {
  Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
  );
}
