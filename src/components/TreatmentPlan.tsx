'use client';

import { useState } from 'react';
import { Treatment, TreatmentPlan } from '@/types';

interface Props {
  treatments: Treatment[];
  plan: TreatmentPlan;
}

type PlanTab = 'all' | 'economy' | 'standard' | 'premium';
type CategoryTab = 'all' | 'skincare' | 'professional';

const EFFORT_LABEL: Record<string, string> = {
  low: '輕鬆',
  medium: '中等',
  high: '需耐心',
};

const EFFORT_COLOR: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
};

function TreatmentCard({ t, rank }: { t: Treatment; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const avgCost = (t.costMin + t.costMax) / 2;

  const roiStars = t.roi > 30 ? 5 : t.roi > 20 ? 4 : t.roi > 12 ? 3 : t.roi > 6 ? 2 : 1;

  return (
    <div className={`
      bg-white/5 rounded-2xl overflow-hidden border transition-all duration-200
      ${rank === 1 ? 'border-yellow-400/50' : 'border-white/10 hover:border-white/20'}
    `}>
      {rank === 1 && (
        <div className="bg-gradient-to-r from-yellow-500/30 to-amber-500/20 px-4 py-1.5 text-xs font-bold text-yellow-400 flex items-center gap-1">
          <span>🏆</span> CP值最高推薦
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{t.emoji}</span>
            <div>
              <div className="text-white font-semibold">{t.name}</div>
              <div className="text-white/40 text-xs">{t.nameEn}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium
              ${t.category === 'skincare' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
              {t.category === 'skincare' ? '保養品' : '醫美療程'}
            </span>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-yellow-400 font-bold text-sm">+{t.improvementPoints}</div>
            <div className="text-white/40 text-xs">可提分</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-white font-bold text-sm">
              {t.timeToResultsWeeks === 0 ? '即效' : `${t.timeToResultsWeeks}週`}
            </div>
            <div className="text-white/40 text-xs">見效時間</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-white font-bold text-sm">
              {t.costUnit === 'month'
                ? `NT$${(t.costMin / 1000).toFixed(0)}k–${(t.costMax / 1000).toFixed(0)}k`
                : `NT$${(t.costMin / 1000).toFixed(0)}k–${(t.costMax / 1000).toFixed(0)}k`}
            </div>
            <div className="text-white/40 text-xs">
              {t.costUnit === 'month' ? '每月' : '每次'}
            </div>
          </div>
        </div>

        {/* ROI + effort */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <span className="text-white/50 text-xs mr-1">CP值</span>
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-sm ${i < roiStars ? 'text-yellow-400' : 'text-white/15'}`}>★</span>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-white/40">執行難度：</span>
            <span className={EFFORT_COLOR[t.effort]}>{EFFORT_LABEL[t.effort]}</span>
          </div>
        </div>

        {/* Target dimensions */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          {t.targetDimensions.map(dim => {
            const labels: Record<string, string> = {
              contour: '輪廓',
              proportion: '比例',
              symmetry: '對稱',
              skinTexture: '膚質',
              youthfulness: '年輕度',
            };
            return (
              <span key={dim} className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">
                {labels[dim]}
              </span>
            );
          })}
        </div>

        <p className={`text-white/60 text-sm leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {t.description}
        </p>

        {expanded && (
          <div className="mt-4 space-y-2">
            <div className="text-white/70 text-sm font-medium">使用重點：</div>
            <ul className="space-y-1.5">
              {t.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/55">
                  <span className="text-yellow-400 mt-0.5 shrink-0">•</span>
                  {tip}
                </li>
              ))}
            </ul>
            {t.maintenanceMonths > 1 && (
              <div className="mt-3 text-xs text-white/40">
                效果維持：約 {t.maintenanceMonths} 個月
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-3 text-yellow-400/70 text-xs hover:text-yellow-400 transition-colors flex items-center gap-1"
        >
          {expanded ? '收起 ▲' : '展開更多 ▼'}
        </button>
      </div>
    </div>
  );
}

export default function TreatmentPlanView({ treatments, plan }: Props) {
  const [planTab, setPlanTab] = useState<PlanTab>('economy');
  const [catTab, setCatTab] = useState<CategoryTab>('all');

  const currentList =
    planTab === 'all' ? treatments :
    planTab === 'economy' ? plan.economy :
    planTab === 'standard' ? plan.standard :
    plan.premium;

  const filtered = catTab === 'all'
    ? currentList
    : currentList.filter(t => t.category === catTab);

  const totalCostMin = filtered.reduce((s, t) =>
    t.category === 'skincare' ? s + t.costMin : s, 0);
  const totalCostMax = filtered.reduce((s, t) =>
    t.category === 'skincare' ? s + t.costMax : s, 0);
  const medicalCost = filtered.filter(t => t.category === 'professional')
    .reduce((s, t) => s + (t.costMin + t.costMax) / 2, 0);

  const planLabels: Record<PlanTab, string> = {
    all: '全部',
    economy: '💰 經濟方案',
    standard: '⭐ 標準方案',
    premium: '👑 進階方案',
  };

  const planDescriptions: Record<PlanTab, string> = {
    all: '依 CP 值排列所有建議',
    economy: '最高效益保養，每月預算約 NT$1,500–4,000',
    standard: '保養 + 1項醫美，全面提升',
    premium: '完整療程組合，最大化效果',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white/5 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <span>💎</span> 個人化改善方案
        </h3>
        <p className="text-white/50 text-sm">依照 CP 值（改善幅度 ÷ 成本 × 時間）排序，優先推薦最划算的項目</p>
      </div>

      {/* Plan tabs */}
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(planLabels) as PlanTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setPlanTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${planTab === tab
                ? 'bg-yellow-400 text-black'
                : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white'}`}
          >
            {planLabels[tab]}
          </button>
        ))}
      </div>

      {planTab !== 'all' && (
        <div className="bg-gradient-to-r from-yellow-500/15 to-amber-500/10 rounded-xl p-4 border border-yellow-400/20">
          <p className="text-yellow-300 text-sm">{planDescriptions[planTab]}</p>
          <div className="mt-3 flex gap-6 text-sm">
            {totalCostMin > 0 && (
              <div>
                <span className="text-white/50">每月保養約 </span>
                <span className="text-white font-bold">NT${totalCostMin.toLocaleString()}–{totalCostMax.toLocaleString()}</span>
              </div>
            )}
            {medicalCost > 0 && (
              <div>
                <span className="text-white/50">醫美約 </span>
                <span className="text-white font-bold">NT${Math.round(medicalCost / 1000)}k</span>
              </div>
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
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${catTab === tab
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'}`}
          >
            {tab === 'all' ? '全部' : tab === 'skincare' ? '💊 保養品' : '🏥 醫美療程'}
          </button>
        ))}
      </div>

      {/* Treatment cards */}
      <div className="space-y-4">
        {filtered.map((t, idx) => (
          <TreatmentCard key={t.id} t={t} rank={idx + 1} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-white/40 py-8">此分類無項目</div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <p className="text-white/40 text-xs leading-relaxed">
          ⚠️ 以上建議僅供參考，實際效果因個人體質、膚質、醫師技術及執行方式而有差異。
          醫美療程請務必諮詢合格醫師後再進行，本工具不構成醫療建議。
          費用區間為市場參考值，實際費用依診所及療程設計為準。
        </p>
      </div>
    </div>
  );
}
