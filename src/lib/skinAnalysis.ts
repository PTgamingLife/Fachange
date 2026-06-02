import { Point, SkinAnalysis } from '@/types';

interface PixelStats {
  r: number;
  g: number;
  b: number;
  count: number;
}

function sampleRegion(
  imageData: ImageData,
  cx: number,
  cy: number,
  radius: number,
  w: number,
  h: number
): PixelStats {
  let r = 0, g = 0, b = 0, count = 0;
  const r2 = radius * radius;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const px = Math.round(cx + dx);
      const py = Math.round(cy + dy);
      if (px < 0 || px >= w || py < 0 || py >= h) continue;
      const i = (py * w + px) * 4;
      r += imageData.data[i];
      g += imageData.data[i + 1];
      b += imageData.data[i + 2];
      count++;
    }
  }

  return { r: count ? r / count : 0, g: count ? g / count : 0, b: count ? b / count : 0, count };
}

function colorVariance(
  imageData: ImageData,
  cx: number,
  cy: number,
  radius: number,
  w: number,
  h: number
): number {
  const mean = sampleRegion(imageData, cx, cy, radius, w, h);
  let variance = 0;
  let count = 0;
  const r2 = radius * radius;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const px = Math.round(cx + dx);
      const py = Math.round(cy + dy);
      if (px < 0 || px >= w || py < 0 || py >= h) continue;
      const i = (py * w + px) * 4;
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      variance += (r - mean.r) ** 2 + (g - mean.g) ** 2 + (b - mean.b) ** 2;
      count++;
    }
  }

  return count > 0 ? Math.sqrt(variance / count) : 0;
}

// Simple Laplacian-based texture roughness (higher = more texture/pores)
function measureTexture(
  imageData: ImageData,
  cx: number,
  cy: number,
  radius: number,
  w: number,
  h: number
): number {
  let laplacianSum = 0;
  let count = 0;
  const r2 = radius * radius;

  for (let dy = -radius + 1; dy <= radius - 1; dy++) {
    for (let dx = -radius + 1; dx <= radius - 1; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const px = Math.round(cx + dx);
      const py = Math.round(cy + dy);
      if (px < 1 || px >= w - 1 || py < 1 || py >= h - 1) continue;

      const getGray = (x: number, y: number) => {
        const i = (y * w + x) * 4;
        return 0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2];
      };

      const lap = Math.abs(
        4 * getGray(px, py) -
        getGray(px - 1, py) -
        getGray(px + 1, py) -
        getGray(px, py - 1) -
        getGray(px, py + 1)
      );
      laplacianSum += lap;
      count++;
    }
  }

  return count > 0 ? laplacianSum / count : 0;
}

export function analyzeSkinFromCanvas(
  canvas: HTMLCanvasElement,
  landmarks: Point[]
): SkinAnalysis {
  const ctx = canvas.getContext('2d');
  if (!ctx) return fallbackSkinAnalysis();

  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h);
  const faceWidth = Math.abs(landmarks[16].x - landmarks[0].x);
  const sampleR = Math.max(8, Math.round(faceWidth * 0.07));

  // Sample regions: left cheek, right cheek, forehead, nose bridge
  const regions = [
    landmarks[3],   // left jaw area (inner cheek)
    landmarks[13],  // right jaw area
    { x: (landmarks[19].x + landmarks[24].x) / 2, y: landmarks[19].y - faceWidth * 0.1 }, // forehead
    landmarks[28],  // nose bridge
  ];

  const pixelStats = regions.map(r =>
    sampleRegion(imageData, r.x, r.y, sampleR, w, h)
  );
  const variances = regions.map(r =>
    colorVariance(imageData, r.x, r.y, sampleR, w, h)
  );
  const textures = regions.map(r =>
    measureTexture(imageData, r.x, r.y, sampleR, w, h)
  );

  const avgR = pixelStats.reduce((s, p) => s + p.r, 0) / pixelStats.length;
  const avgG = pixelStats.reduce((s, p) => s + p.g, 0) / pixelStats.length;
  const avgB = pixelStats.reduce((s, p) => s + p.b, 0) / pixelStats.length;
  const avgVariance = variances.reduce((s, v) => s + v, 0) / variances.length;
  const avgTexture = textures.reduce((s, t) => s + t, 0) / textures.length;

  // Evenness: lower variance = higher evenness
  const evenness = Math.max(0, Math.min(100, 100 - avgVariance * 1.2));

  // Redness: how much red dominates over green
  const rednessRaw = Math.max(0, (avgR - avgG) / 128);
  const redness = Math.min(100, rednessRaw * 120);

  // Brightness: overall luminance
  const luminance = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
  const brightness = Math.min(100, (luminance / 255) * 130);

  // Texture: lower laplacian = smoother skin
  const texture = Math.max(0, Math.min(100, 100 - avgTexture * 2.5));

  // Hydration estimate: saturation of skin color
  const maxC = Math.max(avgR, avgG, avgB);
  const minC = Math.min(avgR, avgG, avgB);
  const saturation = maxC > 0 ? (maxC - minC) / maxC : 0;
  const hydration = Math.min(100, Math.max(0, 85 - saturation * 60));

  return { evenness, redness, brightness, texture, hydration };
}

export function fallbackSkinAnalysis(): SkinAnalysis {
  // Conservative mid-range estimates when landmark data isn't available
  return {
    evenness: 65,
    redness: 20,
    brightness: 60,
    texture: 65,
    hydration: 60,
  };
}

export function analyzeSkinFromImageElement(
  img: HTMLImageElement,
  landmarks: Point[]
): SkinAnalysis {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return fallbackSkinAnalysis();
  ctx.drawImage(img, 0, 0);
  return analyzeSkinFromCanvas(canvas, landmarks);
}
