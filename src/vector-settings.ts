import type {
  ConvertOptions,
  VTracerClustering,
  VTracerMode,
  VTracerPreset,
  VTracerProgressHandler,
} from "vtracer-browser";

export interface TraceSettings {
  preset: VTracerPreset;
  clustering: VTracerClustering;
  mode: VTracerMode;
  maxColors: number;
  filterSpeckle: number;
  layerDifference: number;
  cornerThreshold: number;
  simplify: number;
  pathPrecision: number;
  optimize: 0 | 1 | 2;
  binaryAdaptive: boolean;
  maxDimension: number;
}

export type PresetId = "artwork" | "photo" | "lines";

export interface PresetDefinition {
  id: PresetId;
  label: string;
  description: string;
  settings: TraceSettings;
}

export const PRESETS: PresetDefinition[] = [
  {
    id: "artwork",
    label: "Artwork & icons",
    description: "Crisp color blocks, smooth curves",
    settings: {
      preset: "poster",
      clustering: "color-cluster",
      mode: "spline",
      maxColors: 16,
      filterSpeckle: 2,
      layerDifference: 10,
      cornerThreshold: 62,
      simplify: 0.8,
      pathPrecision: 2,
      optimize: 2,
      binaryAdaptive: false,
      maxDimension: 1600,
    },
  },
  {
    id: "photo",
    label: "Photos & gradients",
    description: "Preserve richer color detail",
    settings: {
      preset: "photo",
      clustering: "color-cluster",
      mode: "spline",
      maxColors: 28,
      filterSpeckle: 6,
      layerDifference: 20,
      cornerThreshold: 68,
      simplify: 1.4,
      pathPrecision: 2,
      optimize: 1,
      binaryAdaptive: false,
      maxDimension: 1400,
    },
  },
  {
    id: "lines",
    label: "Line art & logos",
    description: "High contrast, clean edges",
    settings: {
      preset: "bw",
      clustering: "binary",
      mode: "spline",
      maxColors: 2,
      filterSpeckle: 3,
      layerDifference: 16,
      cornerThreshold: 55,
      simplify: 0.4,
      pathPrecision: 2,
      optimize: 2,
      binaryAdaptive: true,
      maxDimension: 1800,
    },
  },
];

export const DEFAULT_SETTINGS = PRESETS[0].settings;

export function buildTracerOptions(
  settings: TraceSettings,
  onProgress: VTracerProgressHandler,
): ConvertOptions {
  return {
    preset: settings.preset,
    clustering: settings.clustering,
    mode: settings.mode,
    hierarchical: "stacked",
    filterSpeckle: settings.filterSpeckle,
    colorPrecision: 6,
    layerDifference: settings.layerDifference,
    cornerThreshold: settings.cornerThreshold,
    lengthThreshold: 4,
    maxIterations: 10,
    spliceThreshold: 45,
    simplify: settings.mode === "spline" ? settings.simplify : null,
    pathPrecision: settings.pathPrecision,
    maxColors:
      settings.clustering === "binary" ? null : settings.maxColors,
    optimize: settings.optimize,
    binaryAdaptive: settings.binaryAdaptive,
    width: settings.maxDimension,
    height: settings.maxDimension,
    onProgress,
  };
}
