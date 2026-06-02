'use client';

import { FaceScores, SkinAnalysis, ImprovementItem } from '@/types';

interface Props {
  scores: FaceScores;
  skin: SkinAnalysis;
  improvements: ImprovementItem[];
  faceShape: string;
  detectedAge: number;
}

function scoreColor(s: number): string {
  if (s >= 80) return 'from-emerald-500 to-green-400';
  if (s >= 65) return 'from-yellow-500 to-amber-400';
  if (s >= 50) return 'from-orange-500 to-amber-500';
  return 'from-red-500 to-orange-500';
}

function scoreLabel(s: number): string {
  if (s >= 85) return '優秀';
  if (s >= 75) return '良好';
  if (s >= 65) return '中等';
  if (s >= 50) return '待改善';
  return '需加強';
}

function ScoreBar({ label, score, icon, delay = 0 }: { label: string; score: number; icon: string; delay?: number }) {
  return (
    <div className="space-y-2" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-white/80 text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-white/10 ${score >= 75 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-orange-400'}`}>
            {scoreLabel(score)}
          </span>
          <span className="text-white font-bold text-lg w-12 text-right">{Math.round(score)}</span>
        </div>
      </div>
      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${scoreColor(score)} transition-all duration-1000 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function SkinMetric({ label, value, invert = false, unit = '' }: { label: string; value: number; invert?: boolean; unit?: string }) {
  const displayScore = invert ? 100 - value : value;
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
      <span className="text-white/60 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${displayScore >= 70 ? 'bg-green-400' : displayScore >= 50 ? 'bg-yellow-400' : 'bg-orange-400'}`}
            style={{ width: `${displayScore}%` }}
          />
        </div>
        <span className="text-white/80 text-sm w-16 text-right">
          {unit || `${Math.round(displayScore)}%`}
        </span>
      </div>
    </div>
  );
}

export default function ScoreBreakdown({ scores, skin, improvements, faceShape, detectedAge }: Props) {
  const topImprovements = improvements.slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Main scores */}
      <div className="bg-white/5 rounded-2xl p-6 space-y-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>📊</span> 各維度評分
        </h3>
        <ScoreBar label="輪廓與臉型" score={scores.contour} icon="🔷" delay={0} />
        <ScoreBar label="五官比例" score={scores.proportion} icon="📐" delay={100} />
        <ScoreBar label="對稱性" score={scores.symmetry} icon="⚖️" delay={200} />
        <ScoreBar label="肌理膚況" score={scores.skinTexture} icon="✨" delay={300} />
        <ScoreBar label="視覺年輕度" score={scores.youthfulness} icon="🌿" delay={400} />
      </div>

      {/* Face info + skin detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">臉部資訊</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/60 text-sm">臉型分類</span>
              <span className="text-yellow-400 font-semibold">{faceShape}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60 text-sm">視覺年齡估測</span>
              <span className="text-white font-semibold">{detectedAge} 歲</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60 text-sm">魅力總分</span>
              <span className={`font-bold text-lg ${scores.total >= 75 ? 'text-green-400' : scores.total >= 60 ? 'text-yellow-400' : 'text-orange-400'}`}>
                {Math.round(scores.total)} / 100
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">膚況分析</h4>
          <SkinMetric label="膚色均勻度" value={skin.evenness} />
          <SkinMetric label="膚色亮度" value={skin.brightness} />
          <SkinMetric label="肌膚紋理" value={skin.texture} />
          <SkinMetric label="保水度（估）" value={skin.hydration} />
          <SkinMetric label="泛紅程度" value={skin.redness} invert />
        </div>
      </div>

      {/* Top improvements */}
      <div className="bg-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🎯</span> 優化優先序
        </h3>
        <div className="space-y-3">
          {topImprovements.map((item, idx) => (
            <div key={item.dimension} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                ${idx === 0 ? 'bg-yellow-400 text-black' : idx === 1 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70'}`}>
                {item.priority}
              </div>
              <div className="flex-1">
                <div className="text-white font-medium text-sm">{item.dimensionLabel}</div>
                <div className="text-white/50 text-xs">現分 {Math.round(item.currentScore)} 分</div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-bold text-sm">+{item.improvementPotential}</div>
                <div className="text-white/40 text-xs">可提升</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
