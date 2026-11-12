import { z } from "zod";

export const EditSettingsSchema = z.strictObject({
  brightness: z.number().finite().min(30).max(170),
  contrast: z.number().finite().min(30).max(170),
  saturation: z.number().finite().min(0).max(200),
  softness: z.number().finite().min(0).max(4),
  sharpness: z.number().finite().min(0).max(100),
  crop: z.enum(["original", "square", "portrait", "landscape"]),
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
});
export type EditSettings = z.infer<typeof EditSettingsSchema>;
export const originalEdits: EditSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  softness: 0,
  sharpness: 0,
  crop: "original",
  rotation: 0,
};
export const filterFor = (edits: EditSettings) =>
  `brightness(${edits.brightness}%) contrast(${edits.contrast}%) saturate(${edits.saturation}%) blur(${edits.softness}px)`;

export function imageGeometry(
  width: number,
  height: number,
  crop: EditSettings["crop"],
  rotation: number,
  sample: boolean,
) {
  if (
    ![width, height].every((value) => Number.isInteger(value) && value > 0 && value <= 8192) ||
    width * height > 4096 * 4096 ||
    ![0, 90, 180, 270].includes(rotation)
  )
    throw new Error("The image dimensions or rotation exceed the canvas limits.");
  const sourceWidth = sample ? Math.floor(width / 3) : width;
  let sw = sourceWidth;
  let sh = height;
  const ratio = { original: 0, square: 1, portrait: 3 / 4, landscape: 16 / 9 }[crop];
  if (ratio && sw / sh > ratio) sw = Math.round(sh * ratio);
  else if (ratio) sh = Math.round(sw / ratio);
  const quarterTurn = rotation === 90 || rotation === 270;
  return {
    sx: Math.floor((sourceWidth - sw) / 2),
    sy: Math.floor((height - sh) / 2),
    sw,
    sh,
    width: quarterTurn ? sh : sw,
    height: quarterTurn ? sw : sh,
  };
}

/** Bounded five-tap sharpen. Preserves borders/alpha and never mutates input. */
export function sharpenPixels(
  input: Uint8ClampedArray,
  width: number,
  height: number,
  percent: number,
): Uint8ClampedArray {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width * height > 4_194_304 ||
    input.length !== width * height * 4 ||
    !Number.isFinite(percent) ||
    percent < 0 ||
    percent > 100
  )
    throw new Error(
      "Sharpness supports images up to 4 megapixels. Reduce the crop or set sharpness to 0 to export this image.",
    );
  const result = new Uint8ClampedArray(input);
  const amount = percent / 100;
  if (!amount) return result;
  const stride = width * 4;
  for (let y = 1; y < height - 1; y++)
    for (let x = 1; x < width - 1; x++) {
      const at = y * stride + x * 4;
      for (let channel = 0; channel < 3; channel++)
        result[at + channel] =
          input[at + channel] * (1 + 4 * amount) -
          amount *
            (input[at - 4 + channel] +
              input[at + 4 + channel] +
              input[at - stride + channel] +
              input[at + stride + channel]);
    }
  return result;
}

/** Geometry/sharpness are applied before the shared color filter for preview/export. */
export function imageBaseCanvas(
  source: HTMLImageElement,
  values: EditSettings,
  sample: boolean,
  maxDimension?: number,
) {
  const edits = EditSettingsSchema.parse(values);
  const area = imageGeometry(
    source.naturalWidth,
    source.naturalHeight,
    edits.crop,
    edits.rotation,
    sample,
  );
  const scale = maxDimension ? Math.min(1, maxDimension / Math.max(area.width, area.height)) : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width * scale));
  canvas.height = Math.max(1, Math.round(area.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image editing is unavailable in this browser.");
  context.imageSmoothingQuality = "high";
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((edits.rotation * Math.PI) / 180);
  context.drawImage(
    source,
    area.sx,
    area.sy,
    area.sw,
    area.sh,
    (-area.sw * scale) / 2,
    (-area.sh * scale) / 2,
    area.sw * scale,
    area.sh * scale,
  );
  if (edits.sharpness) {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    pixels.data.set(sharpenPixels(pixels.data, canvas.width, canvas.height, edits.sharpness));
    context.putImageData(pixels, 0, 0);
  }
  return canvas;
}

export async function exportImage(source: HTMLImageElement, edits: EditSettings, sample: boolean) {
  const base = imageBaseCanvas(source, edits, sample);
  const canvas = document.createElement("canvas");
  canvas.width = base.width;
  canvas.height = base.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image export is unavailable in this browser.");
  if (!("filter" in context) && filterFor(edits) !== filterFor(originalEdits))
    throw new Error("This browser cannot export adjusted images. Use a current desktop browser.");
  context.filter = filterFor(edits);
  context.drawImage(base, 0, 0);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The PNG could not be exported."))),
      "image/png",
    ),
  );
}
