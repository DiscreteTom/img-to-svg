import type { ConvertOptions, VTracer } from "vtracer-browser";

type VTracerModule = {
  createVTracer: () => VTracer;
};

let tracerPromise: Promise<VTracer> | null = null;
let activeTracer: VTracer | null = null;
let loadVersion = 0;

async function loadTracer(): Promise<VTracer> {
  if (tracerPromise) return tracerPromise;

  const version = loadVersion;
  const moduleUrl = new URL(
    `${import.meta.env.BASE_URL}vtracer/index.js`,
    window.location.href,
  ).href;

  tracerPromise = import(/* @vite-ignore */ moduleUrl)
    .then((module: VTracerModule) => {
      const tracer = module.createVTracer();
      if (version !== loadVersion) {
        tracer.terminate();
        throw new Error("The vectorizer was reloaded.");
      }
      activeTracer = tracer;
      return tracer;
    })
    .catch((error) => {
      tracerPromise = null;
      activeTracer = null;
      throw error;
    });

  return tracerPromise;
}

export async function vectorizeImage(
  image: Blob,
  options: ConvertOptions,
): Promise<string> {
  const tracer = await loadTracer();
  return tracer.convert(image, options);
}

export function disposeVectorizer(): void {
  loadVersion += 1;
  activeTracer?.terminate();
  activeTracer = null;
  tracerPromise = null;
}
