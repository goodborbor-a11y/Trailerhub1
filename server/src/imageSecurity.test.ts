import assert from 'node:assert/strict';
import sharp from 'sharp';
import {
  ALLOWED_FAVICON_FORMATS,
  FAVICON_TIMEOUT_SECONDS,
  InvalidFaviconImage,
  MAX_FAVICON_INPUT_PIXELS,
  MAX_UPLOAD_BYTES,
  configuredUploadLimit,
  createFaviconPipeline,
  imageRuntimeLimits,
  validateFaviconInput,
} from './imageSecurity';

async function expectInvalid(input: Buffer): Promise<void> {
  await assert.rejects(() => validateFaviconInput(input), InvalidFaviconImage);
}

async function main(): Promise<void> {
  assert.deepEqual([...ALLOWED_FAVICON_FORMATS].sort(), ['jpeg', 'png', 'webp']);
  assert.equal(MAX_UPLOAD_BYTES, 10 * 1024 * 1024);
  assert.equal(MAX_FAVICON_INPUT_PIXELS, 40_000_000);
  assert.equal(FAVICON_TIMEOUT_SECONDS, 10);
  assert.equal(configuredUploadLimit(undefined), MAX_UPLOAD_BYTES);
  assert.equal(configuredUploadLimit('1048576'), 1_048_576);
  assert.equal(configuredUploadLimit('0'), MAX_UPLOAD_BYTES);
  assert.equal(configuredUploadLimit('not-a-number'), MAX_UPLOAD_BYTES);
  assert.equal(configuredUploadLimit(String(MAX_UPLOAD_BYTES + 1)), MAX_UPLOAD_BYTES);

  const base = sharp({
    create: { width: 8, height: 4, channels: 4, background: { r: 200, g: 20, b: 10, alpha: 1 } },
  });
  const fixtures = {
    jpeg: await base.clone().jpeg().toBuffer(),
    png: await base.clone().png().toBuffer(),
    webp: await base.clone().webp().toBuffer(),
  };

  for (const [format, input] of Object.entries(fixtures)) {
    const inputMetadata = await validateFaviconInput(input);
    assert.equal(inputMetadata.format, format);
    const output = await createFaviconPipeline(input, 16).toBuffer();
    const outputMetadata = await sharp(output).metadata();
    assert.equal(outputMetadata.format, 'png');
    assert.equal(outputMetadata.width, 16);
    assert.equal(outputMetadata.height, 16);
  }

  // The application uses contain, not crop: transparent letterboxing must remain.
  const contained = await createFaviconPipeline(fixtures.png, 16).raw().toBuffer({ resolveWithObject: true });
  assert.equal(contained.info.channels, 4);
  assert.equal(contained.data[3], 0);
  const middlePixel = ((8 * 16) + 8) * 4;
  assert.equal(contained.data[middlePixel + 3], 255);

  // EXIF orientation is applied by rotate(), then metadata is stripped by PNG output.
  const oriented = await sharp({
    create: { width: 6, height: 3, channels: 3, background: { r: 5, g: 100, b: 200 } },
  }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const orientedInputMetadata = await sharp(oriented).metadata();
  assert.equal(orientedInputMetadata.orientation, 6);
  const orientedOutput = await createFaviconPipeline(oriented, 32).toBuffer();
  const orientedOutputMetadata = await sharp(orientedOutput).metadata();
  assert.equal(orientedOutputMetadata.orientation, undefined);
  assert.equal(orientedOutputMetadata.exif, undefined);
  assert.equal(orientedOutputMetadata.xmp, undefined);

  await expectInvalid(Buffer.alloc(0));
  await expectInvalid(Buffer.from([0xff, 0xd8, 0xff]));
  await expectInvalid(Buffer.from('not-an-image'));
  const unsupportedGif = await base.clone().gif().toBuffer();
  await expectInvalid(unsupportedGif);
  const oversizedSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1000000" height="1000000"></svg>');
  await expectInvalid(oversizedSvg);

  await assert.rejects(async () => {
    await sharp({
      create: { width: 2_147_483_648, height: 2, channels: 4, background: 'black' },
    }).png().toBuffer();
  });
  assert.throws(() => createFaviconPipeline(fixtures.png, 0), InvalidFaviconImage);
  assert.throws(() => createFaviconPipeline(fixtures.png, Number.POSITIVE_INFINITY), InvalidFaviconImage);

  const runtime = imageRuntimeLimits();
  assert.equal(runtime.cache.memory.max, 64);
  assert.equal(runtime.cache.files.max, 20);
  assert.equal(runtime.cache.items.max, 100);
  assert.equal(runtime.concurrency, 2);

  console.log('Sharp favicon security tests passed for JPEG, PNG, WebP, malformed inputs, metadata, containment, and resource limits.');
}

main().catch(error => {
  console.error(error instanceof Error ? error.name : 'SharpSecurityTestFailed');
  process.exit(1);
});
