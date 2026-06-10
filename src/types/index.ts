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
  // Per-dimension improvement breakdown
  dimensionImprovements?: Partial<Record<keyof Omit<FaceScores, 'total'>, number>>;
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
  landmarks?: Point[];
}

// Projection / confirmation step
export interface ProjectedScores {
  current: FaceScores;
  projected: FaceScores;
  delta: FaceScores;
}

export interface AIProjectionReport {
  summary: string;
  zoneChanges: ZoneChange[];
  timeline: TimelineStep[];
  caution: string;
}

export interface ZoneChange {
  zone: string;
  treatment: string;
  description: string;
  improvement: 'high' | 'medium' | 'low';
}

export interface TimelineStep {
  week: string;
  milestone: string;
}
