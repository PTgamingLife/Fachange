'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AnalysisResult, Treatment, TreatmentPlan, AnalysisStatus, ProjectedScores } from '@/types';
import { buildTreatments, buildPlan } from '@/lib/recommendationEngine';

const ImageUploader    = dynamic(() => import('./ImageUploader'),    { ssr: false });
const ScoreRadar       = dynamic(() => import('./ScoreRadar'),       { ssr: false });
const ScoreBreakdown   = dynamic(() => import('./ScoreBreakdown'),   { ssr: false });
const TreatmentPlanView = dynamic(() => import('./TreatmentPlan'),  { ssr: false });
const TreatmentConfirm = dynamic(() => import('./TreatmentConfirm'), { ssr: false });
const FaceProjection   = dynamic(() => import('./FaceProjection'),   { ssr: false });

type ActiveTab = 'scores' | 'treatments';
type AppStep = 'analysis' | 'confirm' | 'projection';

const STATUS_MESSAGES: Partial<Record<AnalysisStatus, { text: string; icon: string }>> = {
  'loading-models': { text: '載入 AI 模型中…\n首次約需 30 秒', icon: '🤖' },
  'detecting':      { text: '偵測臉部特徵點…',               icon: '🔍' },
  'analyzing':      { text: '計算評分與分析膚況…',            icon: '📊' },
};

function TotalScoreRing({ score }: { score: number }) {
  const r = 46;
  const circumference = 2 * Math.PI * r;
  const filled = (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 65 ? '#f59e0b' : score >= 50 ? '#f97316' : '#ef4444';

  return (
    <svg width="116" height="116" viewBox="0 0 116 116" className="shrink-0">
      <circle cx="58" cy="58" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
      <circle
        cx="58" cy="58" r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        strokeDashoffset={circumference * 0.25}
        style={{ filter: `drop-shadow(0 0 6px ${color}90)` }}
      />
      <text x="58" y="53" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">
        {Math.round(score)}
      </text>
      <text x="58" y="71" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="11">
        魅力總分
      </text>
    </svg>
  );
}

function MiniScore({ label, val }: { label: string; val: number }) {
  return (
    <div className="text-center">
      <div className={`font-bold text-base ${val >= 75 ? 'text-green-400' : val >= 60 ? 'text-yellow-400' : 'text-orange-400'}`}>
        {Math.round(val)}
      </div>
      <div className="text-white/40 text-xs">{label}</div>
    </div>
  );
}

const MAX_B64_DIM = 1024;

function extractBase64(img: HTMLImageElement): { base64: string; imageType: string } {
  const scale = Math.min(1, MAX_B64_DIM / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const w = Math.round((img.naturalWidth || img.width) * scale);
  const h = Math.round((img.naturalHeight || img.height) * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { base64: '', imageType: 'image/jpeg' };
  ctx.drawImage(img, 0, 0, w, h);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
  return { base64: dataUrl.split(',')[1] ?? '', imageType: 'image/jpeg' };
}

export default function FaceAnalyzer() {
  const [status, setStatus]       = useState<AnalysisStatus>('idle');
  const [appStep, setAppStep]     = useState<AppStep>('analysis');
  const [progress, setProgress]   = useState(0);
  const [error, setError]         = useState<string | null>(null);
  const [result, setResult]       = useState<AnalysisResult | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [plan, setPlan]           = useState<TreatmentPlan | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState('');
  const [imageType, setImageType] = useState('image/jpeg');
  const [activeTab, setActiveTab] = useState<ActiveTab>('scores');
  const [confirmedProjection, setConfirmedProjection] = useState<ProjectedScores | null>(null);
  const [confirmedTreatments, setConfirmedTreatments] = useState<Treatment[]>([]);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleImageReady = useCallback(async (img: HTMLImageElement, url: string) => {
    setPreviewUrl(url);
    imageRef.current = img;
    setError(null);
    setResult(null);
    setAppStep('analysis');
    setStatus('loading-models');
    setProgress(0);

    const { base64, imageType: type } = extractBase64(img);
    setImageBase64(base64);
    setImageType(type);

    try {
      const { loadModels, analyzeImage } = await import('@/lib/faceDetection');
      await loadModels(p => setProgress(Math.round(p * 0.5)));

      setStatus('detecting');
      setProgress(50);

      const analysisResult = await analyzeImage(img, p => setProgress(50 + Math.round(p * 0.5)));

      setStatus('analyzing');

      if (!analysisResult) {
        setError('未偵測到臉部。請使用清晰的正面照片，避免強光、遮擋或側臉超過 30°。');
        setStatus('error');
        return;
      }

      const t = buildTreatments(analysisResult.scores);
      const p = buildPlan(t);
      setResult(analysisResult);
      setTreatments(t);
      setPlan(p);
      setStatus('complete');
      setProgress(100);
    } catch (e) {
      console.error(e);
      setError('分析發生錯誤，請重試。建議使用 Chrome/Safari 最新版並確認網路正常。');
      setStatus('error');
    }
  }, []);

  const reset = () => {
    setStatus('idle');
    setAppStep('analysis');
    setProgress(0);
    setError(null);
    setResult(null);
    setPreviewUrl(null);
    setImageBase64('');
    setActiveTab('scores');
    setConfirmedProjection(null);
    setConfirmedTreatments([]);
  };

  const handleConfirm = (selected: Treatment[], projection: ProjectedScores) => {
    setConfirmedTreatments(selected);
    setConfirmedProjection(projection);
    setAppStep('projection');
  };

  const isLoading = status === 'loading-models' || status === 'detecting' || status === 'analyzing';

  return (
    <div className="min-h-[60vh]">
      {/* Upload */}
      {status === 'idle' && (
        <div className="animate-fade-in">
          <ImageUploader onImageReady={handleImageReady} />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-6 animate-fade-in px-4">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="分析中"
              className="w-28 h-28 md:w-36 md:h-36 object-cover rounded-2xl opacity-70 shadow-2xl ring-2 ring-yellow-400/30"
            />
          )}
          <div className="text-center space-y-2">
            <div className="text-3xl md:text-4xl animate-bounce">
              {STATUS_MESSAGES[status]?.icon}
            </div>
            <div className="text-white font-semibold text-base md:text-lg whitespace-pre-line text-center">
              {STATUS_MESSAGES[status]?.text}
            </div>
          </div>
          <div className="w-64 md:w-72 bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/35 text-xs text-center max-w-[260px]">
            AI 模型在您的裝置本地執行，照片不會離開您的裝置
          </p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="flex flex-col items-center justify-center py-10 gap-5 animate-fade-in px-4">
          <div className="text-5xl">😕</div>
          <div className="text-center max-w-sm">
            <h3 className="text-white font-bold text-lg mb-2">分析失敗</h3>
            <p className="text-white/60 leading-relaxed text-sm">{error}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 w-full max-w-sm text-sm text-white/50 space-y-1.5">
            <p className="font-semibold text-white/70 mb-2">建議：</p>
            <p>• 使用正面、清晰、無遮擋的照片</p>
            <p>• 臉部需有充足光線</p>
            <p>• 避免強烈逆光或過曝</p>
            <p>• 確認網路連線以下載 AI 模型</p>
          </div>
          <button
            onClick={reset}
            className="w-full max-w-sm py-3.5 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 active:scale-95 transition-all text-sm"
          >
            重新上傳
          </button>
        </div>
      )}

      {/* Treatment confirmation step */}
      {status === 'complete' && result && appStep === 'confirm' && (
        <TreatmentConfirm
          treatments={treatments}
          currentScores={result.scores}
          onConfirm={handleConfirm}
        />
      )}

      {/* AI projection step */}
      {status === 'complete' && result && appStep === 'projection' && confirmedProjection && (
        <FaceProjection
          imageBase64={imageBase64}
          imageType={imageType}
          previewUrl={previewUrl ?? ''}
          currentScores={result.scores}
          projectedScores={confirmedProjection}
          selectedTreatments={confirmedTreatments}
          faceShape={result.faceShape}
          detectedAge={result.detectedAge}
          onBack={() => setAppStep('confirm')}
          onReset={reset}
        />
      )}

      {/* Main analysis results */}
      {status === 'complete' && result && plan && appStep === 'analysis' && (
        <div className="space-y-5 animate-fade-in">
          {/* Score overview */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-4 md:p-6 border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="已分析"
                  className="w-20 h-20 md:w-28 md:h-28 object-cover rounded-xl shadow-xl ring-2 ring-yellow-400/30 shrink-0"
                />
              )}
              <div className="flex flex-col items-start gap-1">
                <TotalScoreRing score={result.scores.total} />
                <div className="flex gap-3 text-xs mt-1">
                  <span className="text-white/40">臉型 <span className="text-yellow-400 font-medium">{result.faceShape}</span></span>
                  <span className="text-white/40">視覺年齡 <span className="text-white font-medium">{result.detectedAge}歲</span></span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2 bg-white/5 rounded-xl p-3 mb-4">
              <MiniScore label="輪廓"  val={result.scores.contour} />
              <MiniScore label="比例"  val={result.scores.proportion} />
              <MiniScore label="對稱"  val={result.scores.symmetry} />
              <MiniScore label="膚質"  val={result.scores.skinTexture} />
              <MiniScore label="年輕度" val={result.scores.youthfulness} />
            </div>

            <ScoreRadar scores={result.scores} />
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('scores')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95
                ${activeTab === 'scores' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              📊 詳細評分
            </button>
            <button
              onClick={() => setActiveTab('treatments')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95
                ${activeTab === 'treatments' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              💎 改善方案
            </button>
          </div>

          {activeTab === 'scores' && (
            <ScoreBreakdown
              scores={result.scores}
              skin={result.skinAnalysis}
              improvements={result.improvements}
              faceShape={result.faceShape}
              detectedAge={result.detectedAge}
            />
          )}

          {activeTab === 'treatments' && (
            <TreatmentPlanView treatments={treatments} plan={plan} />
          )}

          {/* CTA: go to treatment confirm */}
          <div className="bg-gradient-to-br from-yellow-400/15 to-amber-400/5 rounded-2xl p-4 border border-yellow-400/20">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🎯</span>
              <div>
                <div className="text-white font-bold text-sm">選擇療程，預測你的改善效果</div>
                <div className="text-white/45 text-xs">勾選想做的項目，AI 即時預估分數變化與臉部變化</div>
              </div>
            </div>
            <button
              onClick={() => setAppStep('confirm')}
              className="w-full py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 active:scale-95 transition-all text-sm"
            >
              選擇療程方案，查看 AI 預測 →
            </button>
          </div>

          <div className="flex justify-center pb-8">
            <button
              onClick={reset}
              className="w-full max-w-xs py-3 bg-white/10 text-white/70 rounded-xl hover:bg-white/15 active:scale-95 transition-all text-sm font-medium"
            >
              重新分析另一張照片
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
