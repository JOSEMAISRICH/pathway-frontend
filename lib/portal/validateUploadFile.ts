/**
 * Nivel 1 — Validación de calidad pre-upload (portal cliente).
 */

export type UploadValidationResult = { ok: true } | { ok: false; error: string };

const MAX_BYTES = 10 * 1024 * 1024;
const MIN_BYTES = 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

/** P0: tipo, tamaño, no vacío. */
export function validateUploadFileBasic(file: File): UploadValidationResult {
  if (!file || file.size <= 0) {
    return { ok: false, error: "El archivo está vacío. Elige otra foto o PDF." };
  }
  if (file.size < MIN_BYTES) {
    return { ok: false, error: "El archivo es demasiado pequeño para ser un documento válido." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "El archivo supera el límite de 10 MB." };
  }
  const type = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  const extOk = /\.(jpe?g|png|webp|gif|pdf)$/i.test(name);
  if (!ALLOWED_TYPES.has(type) && !extOk) {
    return { ok: false, error: "Formato no admitido. Usa imagen (JPG, PNG) o PDF." };
  }
  return { ok: true };
}

/** Varianza Laplaciana aproximada — umbral empírico; solo imágenes. */
function laplacianVariance(imageData: ImageData): number {
  const { data, width, height } = imageData;
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      const c = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const iL = (y * width + (x - 1)) * 4;
      const iR = (y * width + (x + 1)) * 4;
      const iU = ((y - 1) * width + x) * 4;
      const iD = ((y + 1) * width + x) * 4;
      const l = data[iL] * 0.299 + data[iL + 1] * 0.587 + data[iL + 2] * 0.114;
      const r = data[iR] * 0.299 + data[iR + 1] * 0.587 + data[iR + 2] * 0.114;
      const u = data[iU] * 0.299 + data[iU + 1] * 0.587 + data[iU + 2] * 0.114;
      const d = data[iD] * 0.299 + data[iD + 1] * 0.587 + data[iD + 2] * 0.114;
      const lap = -4 * c + l + r + u + d;
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  if (n === 0) return 0;
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

const BLUR_THRESHOLD = 80;

/**
 * P1 opcional: detecta desenfoque en imágenes.
 * PDFs pasan sin análisis.
 */
export function validateUploadImageQuality(file: File): Promise<UploadValidationResult> {
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    return Promise.resolve({ ok: true });
  }
  if (typeof document === "undefined") {
    return Promise.resolve({ ok: true });
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const maxW = 640;
        const scale = Math.min(1, maxW / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ ok: true });
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const variance = laplacianVariance(ctx.getImageData(0, 0, w, h));
        if (variance < BLUR_THRESHOLD) {
          resolve({
            ok: false,
            error: "La imagen parece borrosa o poco legible. Haz otra foto con buena luz y el documento enfocado.",
          });
          return;
        }
        resolve({ ok: true });
      } catch {
        resolve({ ok: true });
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: false, error: "No se pudo leer la imagen. Prueba con otro archivo." });
    };
    img.src = url;
  });
}

export async function validateUploadForPortal(file: File): Promise<UploadValidationResult> {
  const basic = validateUploadFileBasic(file);
  if (!basic.ok) return basic;
  return validateUploadImageQuality(file);
}
