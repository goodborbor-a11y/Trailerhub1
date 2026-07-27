import sharp, { Metadata, Sharp, SharpOptions } from 'sharp';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_FAVICON_INPUT_PIXELS = 40_000_000;
export const FAVICON_TIMEOUT_SECONDS = 10;
export const ALLOWED_FAVICON_FORMATS = new Set(['jpeg', 'png', 'webp']);

const inputOptions: SharpOptions = {
  failOn: 'error',
  limitInputPixels: MAX_FAVICON_INPUT_PIXELS,
  sequentialRead: true,
};

// Bound process-wide libvips resource use for this API process.
sharp.cache({ memory: 64, files: 20, items: 100 });
sharp.concurrency(2);

export class InvalidFaviconImage extends Error {
  constructor() {
    super('Invalid favicon image');
    this.name = 'InvalidFaviconImage';
  }
}

export function configuredUploadLimit(value: string | undefined): number {
  if (!value) return MAX_UPLOAD_BYTES;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= MAX_UPLOAD_BYTES
    ? parsed
    : MAX_UPLOAD_BYTES;
}

export async function validateFaviconInput(input: string | Buffer): Promise<Metadata> {
  try {
    const metadata = await sharp(input, inputOptions)
      .timeout({ seconds: FAVICON_TIMEOUT_SECONDS })
      .metadata();
    if (
      !metadata.format
      || !ALLOWED_FAVICON_FORMATS.has(metadata.format)
      || !metadata.width
      || !metadata.height
    ) {
      throw new InvalidFaviconImage();
    }
    return metadata;
  } catch {
    throw new InvalidFaviconImage();
  }
}

export function createFaviconPipeline(input: string | Buffer, size: number): Sharp {
  if (!Number.isSafeInteger(size) || size < 1 || size > 256) {
    throw new InvalidFaviconImage();
  }
  return sharp(input, inputOptions)
    .rotate()
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .timeout({ seconds: FAVICON_TIMEOUT_SECONDS })
    .png({ compressionLevel: 9, adaptiveFiltering: true });
}

export function imageRuntimeLimits() {
  return {
    cache: sharp.cache(),
    concurrency: sharp.concurrency(),
  };
}
