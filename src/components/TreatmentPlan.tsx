'use client';

import { useState } from 'react';
import { Treatment, TreatmentPlan } from '@/types';

interface Props {
  treatments: Treatment[];
  plan: TreatmentPlan;
}

type PlanTab = 'economy' | 'standard' | 'premium' | 'all';
type CategoryTab = 'all' | 'skincare' | 'professional';

const EFFORT_LABEL: Record<string, string> = { low: '輕鬆', medium: '中等', high: '需耐心' };
const EFFORT_COLOR: Record<string, string> = { low: 'text-green-400', medium: 'text-yellow-400', high: 'text-orange-400' };

const DIM_LABEL: Record<string, string> = {
  contour: '輪廓', proportion: '比例', symmetry: '對稱', skinTexture: '膚質', youthfulness: '年輕度',
};

function TreatmentCard({ t, rank }: { t: Treatment; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const roiStars = t.roi > 30 ? 5 : t.roi > 20 ? 4 : t.roi > 12 ? 3 : t.roi > 6 ? 2 : 1;

  return (
    <div className={`bg-white/5 rounded-2xl overflow-hidden border transition-all
      ${rank === 1 ? 'border-yellow-400/50' : 'border-white/10'}`}>
      {rank === 1 && (
        <div className="bg-gradient-to-r from-yellow-500/30 to-amber-500/20 px-4 py-1.5 text-xs font-bold text-yellow-400 flex items-center gap-1">
          <span>🏆</span> CP值最高推薦
        </div>
      )}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl shrink-0">{t.emoji}</span>
            <div>
              <div className="text-white font-semibold text-sm">{t.name}</div>
              <div className="text-white/35 text-xs">{t.nameEn}</div>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0
            ${t.category === 'skincare' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
            {t.category === 'skincare' ? '保養' : '醫美'}
          </span>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-yellow-400 font-bold text-sm">+{t.improvementPoints}</div>
            <div className="text-white/35 text-xs">可提分</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-white font-bold text-sm">
              {t.timeToResultsWeeks === 0 ? '即效' : `${t.timeToResultsWeeks}週`}
            </div>
            <div className="text-white/35 text-xs">見效</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-white font-bold text-xs leading-tight">
              NT${Math.round(t.costMin / 1000)}k–{Math.round(t.costMax / 1000)}k
            </div>
            <div className="text-white/35 text-xs">{t.costUnit === 'month' ? '每月' : '每次'}</div>
          </div>
        </div>

        {/* ROI + effort */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-0.5">
            <span className="text-white/40 text-xs mr-1">CP值</span>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-sm ${i < roiStars ? 'text-yellow-400' : 'text-white/15'}`}>★</span>
            ))}
          </div>
          <span className={`text-xs ${EFFORT_COLOR[t.effort]}`}>{EFFORT_LABEL[t.effort]}</span>
        </div>

        {/* Target dims */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {t.targetDimensions.map(dim => (
            <span key={dim} className="text-xs bg-white/10 text-white/55 px-2 py-0.5 rounded-full">
              {DIM_LABEL[dim]}
            </span>
          ))}
        </div>

        {/* Description */}
        <p className={`text-white/55 text-sm leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {t.description}
        </p>

        {expanded && (
          <div className="mt-3 space-y-1.5">
            <div className="text-white/65 text-sm font-medium">使用重點：</div>
            <ul className="space-y-1">
              {t.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/50">
                  <span className="text-yellow-400 mt-0.5 shrink-0">•</span>
                  {tip}
                </li>
              ))}
            </ul>
            {t.maintenanceMonths > 1 && (
              <div className="text-xs text-white/35 mt-2">效果維持：約 {t.maintenanceMonths} 個月</div>
            )}
          </div>
        )}

        {/* Expand toggle — large touch target */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-3 w-full py-2 text-yellow-400/70 text-xs hover:text-yellow-400 transition-colors flex items-center justify-center gap-1 active:opacity-70"
        >
          {expanded ? '收起 ▲' : '展開詳情 ▼'}
        </button>
      </div>
    </div>
  );
}

export default function TreatmentPlanView({ treatments, plan }: Props) {
  const [planTab, setPlanTab] = useState<PlanTab>('economy');
  const [catTab, setCatTab] = useState<CategoryTab>('all');

  const currentList =
    planTab === 'all'     ? treatments :
    planTab === 'economy' ? plan.economy :
    planTab === 'standard'? plan.standard :
    plan.premium;

  const filtered = catTab === 'all' ? currentList : currentList.filter(t => t.category === catTab);

  const skincareCost = {
    min: filtered.filter(t => t.category === 'skincare').reduce((s, t) => s + t.costMin, 0),
    max: filtered.filter(t => t.category === 'skincare').reduce((s, t) => s + t.costMax, 0),
  };
  const medicalCost = filtered.filter(t => t.category === 'professional')
    .reduce((s, t) => s + (t.costMin + t.costMax) / 2, 0);

  const planConfig: Record<PlanTab, { label: string; desc: string }> = {
    economy:  { label: '💰 經濟',  desc: '最高CP值保養，月費 NT$1,500–4,000' },
    standard: { label: '⭐ 標準',  desc: '保養 + 1項醫美，全面提升' },
    premium:  { label: '👑 進階',  desc: '完整療程組合，最大化效果' },
    all:      { label: '📋 全部',  desc: '依CP值排列全部項目' },
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white/5 rounded-2xl p-4">
        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <span>💎</span> 個人化改善方案
        </h3>
        <p className="text-white/45 text-xs">依改善幅度 ÷ 成本 × 見效時間排序</p>
      </div>

      {/* Plan tabs — horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-0">
        {(Object.keys(planConfig) as PlanTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setPlanTab(tab)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 active:scale-95
              ${planTab === tab ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60 hover:bg-white/15'}`}
          >
            {planConfig[tab].label}
          </button>
        ))}
      </div>

      {/* Plan description + cost estimate */}
      {planTab !== 'all' && (
        <div className="bg-yellow-400/10 rounded-xl p-3.5 border border-yellow-400/20">
          <p className="text-yellow-300 text-sm">{planConfig[planTab].desc}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {skincareCost.min > 0 && (
              <span className="text-white/50">
                月保養 <span className="text-white font-bold">NT${skincareCost.min.toLocaleString()}–{skincareCost.max.toLocaleString()}</span>
              </span>
            )}
            {medicalCost > 0 && (
              <span className="text-white/50">
                醫美 <span className="text-white font-bold">NT${Math.round(medicalCost / 1000)}k</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2">
        {(['all', 'skincare', 'professional'] as CategoryTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setCatTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all active:scale-95
              ${catTab === tab ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
          >
            {tab === 'all' ? '全部' : tab === 'skincare' ? '💊 保養品' : '🏥 醫美'}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map((t, idx) => (
          <TreatmentCard key={t.id} t={t} rank={idx + 1} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-white/35 py-8 text-sm">此分類無項目</div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <p className="text-white/35 text-xs leading-relaxed">
          ⚠️ 以上建議僅供參考，實際效果因個人體質及醫師技術而異。
          醫美療程請諮詢合格醫師後進行。費用為市場參考值。
        </p>
      </div>
    </div>
  );
}
