# svg-to-png

A browser-based PNG, JPG, and WebP to SVG converter. Images never leave the device; vectorization runs inside a Web Worker using VTracer WebAssembly.

## Local development

```bash
npm install
npm run dev
```

Create and preview a production build:

```bash
npm run build
npm run preview
```

The `predev` and `prebuild` scripts copy the browser worker and WASM files from `vtracer-browser` into `public/vtracer`.

## GitHub Pages

After pushing the repository to GitHub:

1. Open **Settings → Pages** and set the source to **GitHub Actions**.
2. Push to the `main` branch. The included workflow will build and deploy the site.

Vite reads `GITHUB_REPOSITORY` during GitHub Actions and automatically configures the correct repository subpath.

For a manual deployment, configure the repository as `origin`, authenticate with GitHub, and run `npm run deploy`.

## Vectorization engine

The original `@neplex/vectorizer` package is a native Node.js addon containing platform-specific `.node` binaries, so it cannot run directly in the browser on GitHub Pages. This project uses `vtracer-browser`, a browser WebAssembly wrapper around the same VisionCortex VTracer engine. The result is a fully static site with no backend.
