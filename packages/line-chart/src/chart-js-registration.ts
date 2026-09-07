import {
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

export function registerLineChartComponents(): void {
  Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    Tooltip,
    Legend,
  );
}
