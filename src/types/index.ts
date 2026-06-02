export interface Point {
  x: number;
  y: number;
}

export interface FaceScores {
  total: number;
  contour: number;
  proportion: number;
  symmetry: number;
  skinTexture: number;
  youthfulness: number;
}

export interface SkinAnalysis {
  evenness: number;
  redness: number;
  brightness: number;
  texture: number;
  hydration: number;
}

export interface FaceDimensions {
  faceWidth: number;
  faceHeight: number;
  faceRatio: number;
  rightEyeWidth: number;
  leftEyeWidth: number;
  innerEyeDistance: number;
  noseWidth: number;
  mouthWidth: number;
}

export interface ImprovementItem {
  dimension: keyof Omit<FaceScores, 'total'>;
  dimensionLabel: string;
  currentScore: number;
  improvementPotential: number;
  priority: number;
}

export type TreatmentCategory = 'skincare' | 'professional';

export interface Treatment {
  id: string;
  name: string;
  nameEn: string;
  category: TreatmentCategory;
  emoji: string;
  targetDimensions: Array<keyof Omit<FaceScores, 'total'>>;
  improvementPoints: number;
  costMin: number;
  costMax: number;
  costUnit: 'month' | 'treatment';
  timeToResultsWeeks: number;
  maintenanceMonths: number;
  effort: 'low' | 'medium' | 'high';
  description: string;
  tips: string[];
  roi: number;
}

export interface TreatmentPlan {
  economy: Treatment[];
  standard: Treatment[];
  premium: Treatment[];
}

export type AnalysisStatus =
  | 'idle'
  | 'loading-models'
  | 'detecting'
  | 'analyzing'
  | 'complete'
  | 'error';

export interface AnalysisResult {
  scores: FaceScores;
  skinAnalysis: SkinAnalysis;
  improvements: ImprovementItem[];
  faceShape: string;
  detectedAge: number;
}
