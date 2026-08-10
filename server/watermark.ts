import sharp from 'sharp';
import fs from 'fs';
import { WatermarkConfig } from '../src/types.js';

export async function generateWatermarkedImage(
  imagePath: string,
  watermark: WatermarkConfig,
  targetWidth: number = 1200
): Promise<Buffer> {
  if (!fs.existsSync(imagePath)) {
    throw new Error('Image file not found on server');
  }

  // Load and resize original photo safely
  const resizedBuffer = await sharp(imagePath)
    .resize(targetWidth, null, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  if (!watermark || !watermark.enabled || !watermark.text || !watermark.text.trim()) {
    return resizedBuffer;
  }

  // Get exact dimensions of resized image to guarantee composite matching size
  const resizedMeta = await sharp(resizedBuffer).metadata();
  const width = resizedMeta.width || targetWidth;
  const height = resizedMeta.height || Math.round(width * 0.66);

  // Construct Watermark SVG Overlay
  const text = watermark.text.toUpperCase();
  const opacity = Math.min(Math.max(watermark.opacity || 0.35, 0.05), 0.95);
  const color = watermark.color || '#ffffff';

  let svgOverlay = '';

  if (watermark.position === 'center') {
    const fontSize = Math.max(14, Math.round(width * 0.05));
    svgOverlay = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          font-family="system-ui, sans-serif" font-size="${fontSize}" font-weight="800"
          fill="${color}" fill-opacity="${opacity}" letter-spacing="4">
          ${escapeXml(text)}
        </text>
      </svg>
    `;
  } else if (watermark.position === 'diagonal') {
    const fontSize = Math.max(14, Math.round(width * 0.045));
    const angle = -30;
    svgOverlay = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <g transform="rotate(${angle}, ${width / 2}, ${height / 2})">
          <text x="${width / 2}" y="${height / 2}" dominant-baseline="middle" text-anchor="middle"
            font-family="system-ui, sans-serif" font-size="${fontSize}" font-weight="800"
            fill="${color}" fill-opacity="${opacity}" letter-spacing="4">
            ${escapeXml(text)}
          </text>
        </g>
      </svg>
    `;
  } else {
    // Repeated / Grid pattern
    const fontSize = Math.max(12, Math.round(width * 0.028));
    const patternWidth = Math.max(100, Math.round(width * 0.4));
    const patternHeight = Math.max(60, Math.round(height * 0.25));

    svgOverlay = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="wmPattern" width="${patternWidth}" height="${patternHeight}" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
            <text x="${patternWidth / 2}" y="${patternHeight / 2}" dominant-baseline="middle" text-anchor="middle"
              font-family="system-ui, sans-serif" font-size="${fontSize}" font-weight="700"
              fill="${color}" fill-opacity="${opacity}" letter-spacing="2">
              ${escapeXml(text)}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wmPattern)" />
      </svg>
    `;
  }

  // Composite watermark onto image
  const finalBuffer = await sharp(resizedBuffer)
    .composite([
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0
      }
    ])
    .jpeg({ quality: 82 })
    .toBuffer();

  return finalBuffer;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
