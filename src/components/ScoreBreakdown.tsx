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

function ScoreBar({ label, score, icon, delay = 0 }: {
  label: string; score: number; icon: string; delay?: number;
}) {
  return (
    <div className="space-y-1.5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">{icon}</span>
          <span className="text-white/80 text-sm font-medium truncate">{label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full bg-white/10 hidden sm:inline
            ${score >= 75 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-orange-400'}`}>
            {scoreLabel(score)}
          </span>
          <span className="text-white font-bold text-base w-10 text-right">{Math.round(score)}</span>
        </div>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${scoreColor(score)} transition-all duration-1000 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function SkinMetric({ label, value, invert = false }: {
  label: string; value: number; invert?: boolean;
}) {
  const ds = invert ? 100 - value : value;
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
      <span className="text-white/55 text-xs">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${ds >= 70 ? 'bg-green-400' : ds >= 50 ? 'bg-yellow-400' : 'bg-orange-400'}`}
            style={{ width: `${ds}%` }}
          />
        </div>
        <span className="text-white/70 text-xs w-10 text-right">{Math.round(ds)}%</span>
      </div>
    </div>
  );
}

export default function ScoreBreakdown({ scores, skin, improvements, faceShape, detectedAge }: Props) {
  const topImprovements = improvements.slice(0, 3);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Main dimension scores */}
      <div className="bg-white/5 rounded-2xl p-4 space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <span>📊</span> 各維度評分
        </h3>
        <ScoreBar label="輪廓與臉型" score={scores.contour}     icon="🔷" delay={0} />
        <ScoreBar label="五官比例"   score={scores.proportion}  icon="📐" delay={80} />
        <ScoreBar label="對稱性"     score={scores.symmetry}    icon="⚖️" delay={160} />
        <ScoreBar label="肌理膚況"   score={scores.skinTexture} icon="✨" delay={240} />
        <ScoreBar label="視覺年輕度" score={scores.youthfulness}icon="🌿" delay={320} />
      </div>

      {/* Face info + skin analysis side by side on tablet+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-2xl p-4">
          <h4 className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-wider">臉部資訊</h4>
          <div className="space-y-2.5">
            <div className="flex justify-between">
              <span className="text-white/55 text-sm">臉型</span>
              <span className="text-yellow-400 font-semibold text-sm">{faceShape}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/55 text-sm">視覺年齡</span>
              <span className="text-white font-semibold text-sm">{detectedAge} 歲</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/55 text-sm">魅力總分</span>
              <span className={`font-bold text-base ${scores.total >= 75 ? 'text-green-400' : scores.total >= 60 ? 'text-yellow-400' : 'text-orange-400'}`}>
                {Math.round(scores.total)} / 100
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-4">
          <h4 className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-wider">膚況分析</h4>
          <SkinMetric label="膚色均勻度" value={skin.evenness} />
          <SkinMetric label="膚色亮度"   value={skin.brightness} />
          <SkinMetric label="肌膚紋理"   value={skin.texture} />
          <SkinMetric label="保水度（估）" value={skin.hydration} />
          <SkinMetric label="泛紅程度"   value={skin.redness} invert />
        </div>
      </div>

      {/* Priority improvements */}
      <div className="bg-white/5 rounded-2xl p-4">
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <span>🎯</span> 優化優先序
        </h3>
        <div className="space-y-2.5">
          {topImprovements.map((item, idx) => (
            <div key={item.dimension} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                ${idx === 0 ? 'bg-yellow-400 text-black' : idx === 1 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'}`}>
                {item.priority}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm">{item.dimensionLabel}</div>
                <div className="text-white/45 text-xs">現分 {Math.round(item.currentScore)}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-green-400 font-bold text-sm">+{item.improvementPotential}</div>
                <div className="text-white/35 text-xs">可提升</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
