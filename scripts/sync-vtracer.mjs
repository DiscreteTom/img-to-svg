import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = resolve(projectRoot, "node_modules/vtracer-browser/dist");
const publicRoot = resolve(projectRoot, "public/vtracer");
const assets = ["index.js", "worker.js", "vtracer_bg.wasm"];

await mkdir(publicRoot, { recursive: true });
await Promise.all(
  assets.map((asset) =>
    copyFile(resolve(packageRoot, asset), resolve(publicRoot, asset)),
  ),
);

console.log(`VTracer browser assets synced to ${publicRoot}`);

