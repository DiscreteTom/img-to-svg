export const MAX_FILE_BYTES = 25 * 1024 * 1024;

const SUPPORTED_EXTENSIONS = /\.(png|jpe?g|webp)$/i;

export interface SourceImage {
  file: File;
  url: string;
  width: number;
  height: number;
}

export function isSupportedImage(file: File): boolean {
  return (
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    file.type === "image/webp" ||
    SUPPORTED_EXTENSIONS.test(file.name)
  );
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function prepareImage(file: File): Promise<SourceImage> {
  const url = URL.createObjectURL(file);

  try {
    const dimensions = await getImageDimensions(url);
    return { file, url, ...dimensions };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

function getImageDimensions(
  url: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("This image could not be read."));
    image.src = url;
  });
}

export function downloadSvg(svg: string, filename: string): void {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) throw new Error("Clipboard access is unavailable in this browser.");
}

export function filenameStem(filename: string): string {
  return filename.replace(/\.[^.]+$/, "").trim() || "vector";
}
