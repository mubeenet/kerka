import type {
  CartesianScaleTypeRegistry,
  ChartType,
  DoughnutControllerChartOptions,
  DoughnutControllerDatasetOptions,
  DoughnutMetaExtensions,
} from 'chart.js';

export interface ThreeDPieControllerOptions {
  depth: number;
  reversed: boolean;
  sideShade: number;
  verticalScale: number;
}

export interface ThreeDPieLabelOptions {
  color?: string;
  font?: string;
}

declare module 'chart.js' {
  interface ChartTypeRegistry {
    threeDPie: {
      chartOptions: DoughnutControllerChartOptions & ThreeDPieControllerOptions;
      datasetOptions: DoughnutControllerDatasetOptions & ThreeDPieControllerOptions;
      defaultDataPoint: number;
      metaExtensions: DoughnutMetaExtensions;
      parsedDataType: number;
      scales: keyof CartesianScaleTypeRegistry;
    };
  }

  interface PluginOptionsByType<TType extends ChartType> {
    threeDPieLabels?: ThreeDPieLabelOptions | false;
  }
}
