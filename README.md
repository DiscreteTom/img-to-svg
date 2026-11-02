# img-to-svg

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

## Internationalization

The interface supports English and Simplified Chinese. It follows the browser language on first visit, and the language switcher stores the user's choice in local storage.

Translation resources live in `src/locales`. Add new interface strings to both locale files so every language stays complete.

## GitHub Pages

After pushing the repository to GitHub:

1. Open **Settings → Pages** and set the source to **GitHub Actions**.
2. Push to the `main` branch. The included workflow will build and deploy the site.

Vite reads `GITHUB_REPOSITORY` during GitHub Actions and automatically configures the correct repository subpath.

For a manual deployment, configure the repository as `origin`, authenticate with GitHub, and run `npm run deploy`.

## Vectorization engine

The original `@neplex/vectorizer` package is a native Node.js addon containing platform-specific `.node` binaries, so it cannot run directly in the browser on GitHub Pages. This project uses `vtracer-browser`, a browser WebAssembly wrapper around the same VisionCortex VTracer engine. The result is a fully static site with no backend.
