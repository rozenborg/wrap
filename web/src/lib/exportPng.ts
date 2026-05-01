/**
 * Validate Tesla wrap filename: alphanumeric, underscore, dash, space; max 30 chars.
 */
export function validateName(name: string): string | null {
  if (!name) return "name is required";
  if (name.length > 30) return "max 30 characters";
  if (!/^[A-Za-z0-9 _-]+$/.test(name)) return "only letters, numbers, space, _ and -";
  return null;
}

/**
 * Iteratively re-encode a canvas to PNG and downscale until under maxBytes (Tesla cap is 1MB).
 */
export async function canvasToTeslaPng(
  source: HTMLCanvasElement,
  maxBytes = 1_000_000
): Promise<{ blob: Blob; size: number }> {
  const sizes: number[] = [1024, 768, 512];
  for (const dim of sizes) {
    const out = document.createElement("canvas");
    out.width = dim;
    out.height = dim;
    const ctx = out.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, dim, dim);
    const blob: Blob | null = await new Promise((r) => out.toBlob(r, "image/png"));
    if (blob && blob.size <= maxBytes) return { blob, size: blob.size };
    if (dim === 512 && blob) return { blob, size: blob.size };
  }
  throw new Error("export failed");
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
