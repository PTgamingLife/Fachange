import { Point, FaceScores, FaceDimensions, SkinAnalysis, ImprovementItem } from '@/types';

function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val));
}

function scoreFromRatio(actual: number, ideal: number, tolerance: number): number {
  const deviation = Math.abs(actual - ideal) / ideal;
  return Math.max(0, 1 - deviation / tolerance);
}

export function calculateFaceDimensions(landmarks: Point[]): FaceDimensions {
  const faceWidth = dist(landmarks[0], landmarks[16]);
  const browMid = midpoint(
    midpoint(landmarks[17], landmarks[21]),
    midpoint(landmarks[22], landmarks[26])
  );
  const chin = landmarks[8];
  const faceHeight = dist(chin, browMid) * 1.3;
  const faceRatio = faceHeight / faceWidth;
  const rightEyeWidth = dist(landmarks[36], landmarks[39]);
  const leftEyeWidth = dist(landmarks[42], landmarks[45]);
  const innerEyeDistance = dist(landmarks[39], landmarks[42]);
  const noseWidth = dist(landmarks[31], landmarks[35]);
  const mouthWidth = dist(landmarks[48], landmarks[54]);

  return {
    faceWidth,
    faceHeight,
    faceRatio,
    rightEyeWidth,
    leftEyeWidth,
    innerEyeDistance,
    noseWidth,
    mouthWidth,
  };
}

export function calculateContourScore(landmarks: Point[], dims: FaceDimensions): number {
  // Face ratio: ideal 1.35–1.60 (close to golden ratio)
  const ratioScore = scoreFromRatio(dims.faceRatio, 1.46, 0.45) * 45;

  // Jawline definition: smoothness of jaw curve (0-16)
  const jawPoints = landmarks.slice(0, 17);
  let jawVariance = 0;
  for (let i = 1; i < jawPoints.length - 1; i++) {
    const v1 = { x: jawPoints[i].x - jawPoints[i - 1].x, y: jawPoints[i].y - jawPoints[i - 1].y };
    const v2 = { x: jawPoints[i + 1].x - jawPoints[i].x, y: jawPoints[i + 1].y - jawPoints[i].y };
    const angle = Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x);
    jawVariance += Math.abs(angle);
  }
  const jawScore = clamp(35 - jawVariance * 4, 0, 35);

  // Chin proportion
  const chinToNose = dist(landmarks[8], landmarks[33]);
  const noseToBrow = dist(landmarks[27], midpoint(landmarks[21], landmarks[22]));
  const chinRatioScore = scoreFromRatio(chinToNose / noseToBrow, 1.0, 0.5) * 20;

  return clamp(ratioScore + jawScore + chinRatioScore);
}

export function calculateProportionScore(landmarks: Point[], dims: FaceDimensions): number {
  const { rightEyeWidth, leftEyeWidth, innerEyeDistance, noseWidth, mouthWidth } = dims;
  const avgEyeWidth = (rightEyeWidth + leftEyeWidth) / 2;

  // Neoclassical canon: inner eye gap ≈ one eye width
  const eyeSpacingScore = scoreFromRatio(innerEyeDistance, avgEyeWidth, 0.5) * 25;

  // Nose width ≈ one eye width
  const noseScore = scoreFromRatio(noseWidth, avgEyeWidth, 0.55) * 25;

  // Mouth width ≈ 1.5× eye width
  const mouthScore = scoreFromRatio(mouthWidth, avgEyeWidth * 1.5, 0.5) * 25;

  // Rule of thirds
  const browToNose = dist(midpoint(landmarks[21], landmarks[22]), landmarks[33]);
  const noseToChin = dist(landmarks[33], landmarks[8]);
  const thirdsScore = scoreFromRatio(browToNose, noseToChin, 0.5) * 25;

  return clamp(eyeSpacingScore + noseScore + mouthScore + thirdsScore);
}

export function calculateSymmetryScore(landmarks: Point[]): number {
  const centerX = (landmarks[0].x + landmarks[16].x) / 2;
  const faceWidth = dist(landmarks[0], landmarks[16]);

  // Symmetric landmark pairs (left index, right index)
  const pairs: [number, number][] = [
    [1, 15], [2, 14], [3, 13], [4, 12], [5, 11], [6, 10], [7, 9],
    [17, 26], [18, 25], [19, 24], [20, 23],
    [31, 35], [32, 34],
    [36, 45], [37, 44], [38, 43], [39, 42],
    [48, 54], [49, 53], [50, 52],
  ];

  let totalAsymmetry = 0;
  for (const [li, ri] of pairs) {
    const l = landmarks[li];
    const r = landmarks[ri];
    const mirroredR = { x: 2 * centerX - r.x, y: r.y };
    totalAsymmetry += dist(l, mirroredR) / faceWidth;
  }

  const avgAsymmetry = totalAsymmetry / pairs.length;
  return clamp(100 - avgAsymmetry * 900);
}

export function calculateYouthfulnessScore(
  landmarks: Point[],
  dims: FaceDimensions,
  skinScore: number
): number {
  // Cheek fullness: compare cheekbone width to jaw width
  const cheekWidth = dist(landmarks[1], landmarks[15]);
  const jawWidth = dist(landmarks[4], landmarks[12]);
  const cheekToJawRatio = cheekWidth / jawWidth;
  // Youthful faces have fuller cheeks relative to jaw (ratio > 1.1)
  const plumpnessScore = scoreFromRatio(cheekToJawRatio, 1.15, 0.3) * 30;

  // Eye openness: eye height / width ratio
  const rightEyeHeight = dist(landmarks[37], landmarks[41]);
  const rightEyeWidth = dims.rightEyeWidth;
  const eyeOpennessScore = scoreFromRatio(rightEyeHeight / rightEyeWidth, 0.33, 0.4) * 25;

  // Lip fullness
  const upperLipHeight = dist(landmarks[51], landmarks[62]);
  const lowerLipHeight = dist(landmarks[57], landmarks[66]);
  const lipScore = scoreFromRatio((upperLipHeight + lowerLipHeight) / dims.mouthWidth, 0.28, 0.5) * 20;

  // Skin contribution to youth
  const skinContribution = skinScore * 0.25;

  return clamp(plumpnessScore + eyeOpennessScore + lipScore + skinContribution);
}

export function calculateSkinScoreFromAnalysis(skin: SkinAnalysis): number {
  return clamp(
    skin.evenness * 0.30 +
    (100 - skin.redness) * 0.20 +
    skin.brightness * 0.20 +
    skin.texture * 0.20 +
    skin.hydration * 0.10
  );
}

export function estimateFaceShape(landmarks: Point[], dims: FaceDimensions): string {
  const { faceRatio, faceWidth } = dims;
  const foreheadWidth = dist(landmarks[17], landmarks[26]);
  const cheekWidth = dist(landmarks[1], landmarks[15]);
  const jawWidth = dist(landmarks[4], landmarks[12]);

  const fwRatio = foreheadWidth / faceWidth;
  const cwRatio = cheekWidth / faceWidth;
  const jwRatio = jawWidth / faceWidth;

  if (faceRatio > 1.55) return '長形臉';
  if (faceRatio < 1.2) return '圓形臉';
  if (jwRatio > 0.85) return '方形臉';
  if (fwRatio > 0.85 && jwRatio < 0.75) return '心形臉';
  if (cwRatio > fwRatio && cwRatio > jwRatio) return '菱形臉';
  if (Math.abs(fwRatio - jwRatio) < 0.05) return '橢圓形臉';
  return '鵝蛋臉';
}

export function buildScores(
  landmarks: Point[],
  skin: SkinAnalysis
): FaceScores {
  const dims = calculateFaceDimensions(landmarks);
  const contour = calculateContourScore(landmarks, dims);
  const proportion = calculateProportionScore(landmarks, dims);
  const symmetry = calculateSymmetryScore(landmarks);
  const skinTexture = calculateSkinScoreFromAnalysis(skin);
  const youthfulness = calculateYouthfulnessScore(landmarks, dims, skinTexture);

  const total = clamp(
    contour * 0.15 +
    proportion * 0.20 +
    symmetry * 0.20 +
    skinTexture * 0.25 +
    youthfulness * 0.20
  );

  return { total, contour, proportion, symmetry, skinTexture, youthfulness };
}

export function buildImprovements(scores: FaceScores): ImprovementItem[] {
  const dimensions: Array<{
    key: keyof Omit<FaceScores, 'total'>;
    label: string;
    maxPotential: number;
  }> = [
    { key: 'contour', label: '輪廓與臉型', maxPotential: 15 },
    { key: 'proportion', label: '五官比例', maxPotential: 12 },
    { key: 'symmetry', label: '對稱性', maxPotential: 18 },
    { key: 'skinTexture', label: '肌理膚況', maxPotential: 20 },
    { key: 'youthfulness', label: '視覺年輕度', maxPotential: 16 },
  ];

  return dimensions
    .map((d, index) => ({
      dimension: d.key,
      dimensionLabel: d.label,
      currentScore: scores[d.key],
      improvementPotential: Math.round(Math.max(0, d.maxPotential * (1 - scores[d.key] / 100))),
      priority: index + 1,
    }))
    .sort((a, b) => b.improvementPotential - a.improvementPotential)
    .map((item, i) => ({ ...item, priority: i + 1 }));
}
