import { Point, SkinAnalysis, AnalysisResult, FaceScores } from '@/types';
import {
  buildScores,
  buildImprovements,
  estimateFaceShape,
  calculateFaceDimensions,
} from './scoringEngine';
import { analyzeSkinFromCanvas, fallbackSkinAnalysis } from './skinAnalysis';

const MODEL_URL =
  'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.14/model/';

let modelsLoaded = false;

type FaceApiModule = typeof import('@vladmandic/face-api');
let faceapi: FaceApiModule | null = null;

async function getFaceApi(): Promise<FaceApiModule> {
  if (!faceapi) {
    faceapi = await import('@vladmandic/face-api');
  }
  return faceapi;
}

export async function loadModels(onProgress?: (p: number) => void): Promise<void> {
  if (modelsLoaded) return;
  const fa = await getFaceApi();
  onProgress?.(10);

  await fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  onProgress?.(50);

  await fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  onProgress?.(90);

  modelsLoaded = true;
  onProgress?.(100);
}

export async function analyzeImage(
  imageEl: HTMLImageElement,
  onProgress?: (p: number) => void
): Promise<AnalysisResult | null> {
  const fa = await getFaceApi();
  onProgress?.(10);

  const opts = new fa.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 });
  const detection = await fa.detectSingleFace(imageEl, opts).withFaceLandmarks();

  onProgress?.(60);

  if (!detection) return null;

  const rawLandmarks = detection.landmarks.positions;
  const landmarks: Point[] = rawLandmarks.map(p => ({ x: p.x, y: p.y }));

  // Draw to canvas for pixel analysis
  const canvas = document.createElement('canvas');
  canvas.width = imageEl.naturalWidth || imageEl.width;
  canvas.height = imageEl.naturalHeight || imageEl.height;
  const ctx = canvas.getContext('2d');
  let skin: SkinAnalysis = fallbackSkinAnalysis();
  if (ctx) {
    ctx.drawImage(imageEl, 0, 0);
    try {
      skin = analyzeSkinFromCanvas(canvas, landmarks);
    } catch {
      skin = fallbackSkinAnalysis();
    }
  }

  onProgress?.(80);

  const scores = buildScores(landmarks, skin);
  const improvements = buildImprovements(scores);
  const dims = calculateFaceDimensions(landmarks);
  const faceShape = estimateFaceShape(landmarks, dims);

  // Rough age estimation from feature analysis
  const detectedAge = estimateAge(scores);

  onProgress?.(100);

  return { scores, skinAnalysis: skin, improvements, faceShape, detectedAge };
}

function estimateAge(scores: FaceScores): number {
  // Lower youth score → estimated older visual age
  const baseAge = 25;
  const youthOffset = (100 - scores.youthfulness) / 5;
  const skinOffset = (100 - scores.skinTexture) / 8;
  return Math.round(baseAge + youthOffset + skinOffset);
}

export function isModelsLoaded(): boolean {
  return modelsLoaded;
}
