'use client';

import { useState, useMemo } from 'react';
import { Treatment, FaceScores, ProjectedScores } from '@/types';
import { calcProjectedScores } from '@/lib/recommendationEngine';
import dynamic from 'next/dynamic';

const ScoreRadar = dynamic(() => import('./ScoreRadar'), { ssr: false });

interface Props {
  treatments: Treatment[];
  currentScores: FaceScores;
  onConfirm: (selected: Treatment[], projection: ProjectedScores) => void;
}

const DIM_LABELS: Record<keyof Omit<FaceScores, 'total'>, string> = {
  contour: '輪廓',
  proportion: '比例',
  symmetry: '對稱',
  skinTexture: '膚質',
  youthfulness: '年輕度',
};

function ScoreDelta({ label, from, to }: { label: string; from: number; to: number }) {
  const diff = to - from;
  const color = diff > 3 ? 'text-green-400' : diff > 0 ? 'text-yellow-400' : 'text-white/40';
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
      <span className="text-white/55 text-xs">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-white/50 text-xs">{Math.round(from)}</span>
        <span className="text-white/30 text-xs">→</span>
        <span className={`font-bold text-sm ${color}`}>{Math.round(to)}</span>
        {diff > 0 && <span className="text-green-400 text-xs">+{Math.round(diff)}</span>}
      </div>
    </div>
  );
}

export default function TreatmentConfirm({ treatments, currentScores, onConfirm }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const selectedList = useMemo(
    () => treatments.filter(t => selected.has(t.id)),
    [treatments, selected]
  );

  const projection = useMemo(
    () => calcProjectedScores(currentScores, selectedList),
    [currentScores, selectedList]
  );

  const totalDelta = projection.delta.total;

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const skincare = treatments.filter(t => t.category === 'skincare');
  const professional = treatments.filter(t => t.category === 'professional');

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="bg-white/5 rounded-2xl p-4">
        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <span>✅</span> 選擇你要執行的療程
        </h3>
        <p className="text-white/45 text-xs">勾選想做的項目，右側即時預覽預測分數變化</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Treatment selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Skincare */}
          <div className="bg-white/5 rounded-2xl p-4">
            <h4 className="text-xs font-semibold text-blue-300 mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <span>💊</span> 保養品
            </h4>
            <div className="space-y-2">
              {skincare.map(t => (
                <TreatmentRow key={t.id} t={t} checked={selected.has(t.id)} onToggle={() => toggle(t.id)} />
              ))}
            </div>
          </div>

          {/* Professional */}
          <div className="bg-white/5 rounded-2xl p-4">
            <h4 className="text-xs font-semibold text-purple-300 mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <span>🏥</span> 醫美療程
            </h4>
            <div className="space-y-2">
              {professional.map(t => (
                <TreatmentRow key={t.id} t={t} checked={selected.has(t.id)} onToggle={() => toggle(t.id)} />
              ))}
            </div>
          </div>
        </div>

        {/* Live projection panel */}
        <div className="space-y-3">
          <div className="bg-white/5 rounded-2xl p-4 sticky top-4">
            <h4 className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-wider">預測改善</h4>

            {selected.size === 0 ? (
              <div className="text-center text-white/30 text-sm py-6">
                勾選療程查看預測分數
              </div>
            ) : (
              <>
                {/* Total delta */}
                <div className="bg-gradient-to-r from-yellow-400/20 to-amber-400/10 rounded-xl p-3 mb-4 text-center border border-yellow-400/20">
                  <div className="text-yellow-400 font-black text-2xl">
                    {Math.round(currentScores.total)} → {Math.round(projection.projected.total)}
                  </div>
                  <div className="text-green-400 font-bold text-sm">
                    整體提升 +{Math.round(totalDelta)} 分
                  </div>
                  <div className="text-white/40 text-xs mt-0.5">
                    已選 {selected.size} 項療程
                  </div>
                </div>

                {/* Per-dimension deltas */}
                <div className="mb-4">
                  <ScoreDelta label="輪廓臉型" from={currentScores.contour}     to={projection.projected.contour} />
                  <ScoreDelta label="五官比例" from={currentScores.proportion}  to={projection.projected.proportion} />
                  <ScoreDelta label="對稱性"   from={currentScores.symmetry}    to={projection.projected.symmetry} />
                  <ScoreDelta label="肌理膚況" from={currentScores.skinTexture} to={projection.projected.skinTexture} />
                  <ScoreDelta label="視覺年輕度" from={currentScores.youthfulness} to={projection.projected.youthfulness} />
                </div>

                {/* Mini radar */}
                <ScoreRadar scores={projection.projected} />
              </>
            )}

            <button
              disabled={selected.size === 0}
              onClick={() => onConfirm(selectedList, projection)}
              className={`w-full mt-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-95
                ${selected.size > 0
                  ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
            >
              {selected.size === 0 ? '請先勾選療程' : `確認方案，查看 AI 分析 →`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TreatmentRow({ t, checked, onToggle }: { t: Treatment; checked: boolean; onToggle: () => void }) {
  return (
    <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
      ${checked ? 'bg-yellow-400/10 border border-yellow-400/30' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}>
      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-all
        ${checked ? 'bg-yellow-400' : 'bg-white/15 border border-white/20'}`}>
        {checked && <span className="text-black text-xs font-bold">✓</span>}
      </div>
      <input type="checkbox" checked={checked} onChange={onToggle} className="hidden" />
      <span className="text-lg shrink-0">{t.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-medium truncate">{t.name}</div>
        <div className="text-white/40 text-xs">
          {t.timeToResultsWeeks === 0 ? '即效' : `${t.timeToResultsWeeks}週見效`} ·
          NT${Math.round(t.costMin / 1000)}k–{Math.round(t.costMax / 1000)}k/{t.costUnit === 'month' ? '月' : '次'}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-green-400 font-bold text-sm">+{t.improvementPoints}</div>
        <div className="text-white/30 text-xs">分</div>
      </div>
    </label>
  );
}
