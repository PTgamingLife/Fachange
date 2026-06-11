'use client';

import { useState, useEffect, useRef } from 'react';
import { FaceScores, Treatment, ProjectedScores, AIProjectionReport } from '@/types';
import { SUPABASE_ANALYZE_URL } from '@/lib/supabaseConfig';
import dynamic from 'next/dynamic';
import BeforeAfterSlider from './BeforeAfterSlider';

const ScoreRadar = dynamic(() => import('./ScoreRadar'), { ssr: false });

interface Props {
  imageBase64: string;
  imageType: string;
  previewUrl: string;
  currentScores: FaceScores;
  projectedScores: ProjectedScores;
  selectedTreatments: Treatment[];
  faceShape: string;
  detectedAge: number;
  onBack: () => void;
  onReset: () => void;
}

const IMPROVEMENT_CONFIG = {
  high:   { label: '顯著改善', color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/30'  },
  medium: { label: '中度改善', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
  low:    { label: '輕微改善', color: 'text-white/50',   bg: 'bg-white/5',       border: 'border-white/10'      },
};

function ScoreBar({ label, from, to }: { label: string; from: number; to: number }) {
  const diff = to - from;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-white/50">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-white/40">{Math.round(from)}</span>
          <span className="text-white/20">→</span>
          <span className={`font-bold ${diff > 0 ? 'text-green-400' : 'text-white/60'}`}>{Math.round(to)}</span>
          {diff > 0 && <span className="text-green-400">+{Math.round(diff)}</span>}
        </div>
      </div>
      <div className="relative h-2 bg-white/8 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-white/20 rounded-full"
          style={{ width: `${from}%` }}
        />
        {diff > 0 && (
          <div
            className="absolute top-0 h-full bg-gradient-to-r from-yellow-400 to-green-400 rounded-full"
            style={{ left: `${from}%`, width: `${diff}%` }}
          />
        )}
      </div>
    </div>
  );
}

export default function FaceProjection({
  imageBase64, imageType, previewUrl,
  currentScores, projectedScores, selectedTreatments,
  faceShape, detectedAge, onBack, onReset,
}: Props) {
  const [aiStatus, setAiStatus] = useState<'loading' | 'success' | 'unavailable' | 'error'>('loading');
  const [report, setReport] = useState<AIProjectionReport | null>(null);
  const [errorDetail, setErrorDetail] = useState('');
  const hasFetched = useRef(false);

  const runAnalysis = async () => {
    setAiStatus('loading');
    setReport(null);
    setErrorDetail('');
    try {
      const res = await fetch(SUPABASE_ANALYZE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          imageType,
          currentScores,
          projectedScores,
          selectedTreatments,
          faceShape,
          detectedAge,
        }),
      });
      if (res.status === 404) { setAiStatus('unavailable'); return; }
      let data: { error?: string; detail?: string; report?: AIProjectionReport } = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }
      if (!res.ok) {
        if (
          data.error === 'ANTHROPIC_API_KEY not configured' ||
          data.error === 'ANTHROPIC_API_KEY invalid'
        ) { setAiStatus('unavailable'); return; }
        setErrorDetail(data.detail ?? data.error ?? `HTTP ${res.status}`);
        setAiStatus('error');
        return;
      }
      if (data.error || !data.report) {
        setErrorDetail(data.detail ?? data.error ?? '');
        setAiStatus('error');
        return;
      }
      setReport(data.report);
      setAiStatus('success');
    } catch (e) {
      setErrorDetail(String(e));
      setAiStatus('unavailable');
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    runAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalDelta = projectedScores.delta.total;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 transition-all text-white/70 text-sm"
        >
          ← 修改方案
        </button>
        <h3 className="text-white font-bold text-base flex-1">AI 預測分析報告</h3>
      </div>

      {/* Score overview */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-4 border border-white/10">
        <div className="flex gap-4 mb-4">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="分析照片"
              className="w-20 h-20 object-cover rounded-xl ring-2 ring-yellow-400/30 shrink-0"
            />
          )}
          <div className="flex-1 flex flex-col justify-center gap-1">
            <div className="text-white/50 text-xs">預測整體提升</div>
            <div className="flex items-end gap-1">
              <span className="text-yellow-400 font-black text-3xl">+{Math.round(totalDelta)}</span>
              <span className="text-white/40 text-sm mb-1">分</span>
            </div>
            <div className="text-white/40 text-xs">
              {Math.round(currentScores.total)} → {Math.round(projectedScores.projected.total)} 分 · {selectedTreatments.length} 項療程
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <ScoreBar label="輪廓臉型"   from={currentScores.contour}      to={projectedScores.projected.contour} />
          <ScoreBar label="五官比例"   from={currentScores.proportion}   to={projectedScores.projected.proportion} />
          <ScoreBar label="對稱性"     from={currentScores.symmetry}     to={projectedScores.projected.symmetry} />
          <ScoreBar label="肌理膚況"   from={currentScores.skinTexture}  to={projectedScores.projected.skinTexture} />
          <ScoreBar label="視覺年輕度" from={currentScores.youthfulness} to={projectedScores.projected.youthfulness} />
        </div>
      </div>

      {/* Before / After slider */}
      <BeforeAfterSlider previewUrl={previewUrl} projectedScores={projectedScores} />

      {/* Radar before / after */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-2xl p-3">
          <div className="text-white/40 text-xs text-center mb-2">目前</div>
          <ScoreRadar scores={currentScores} />
        </div>
        <div className="bg-white/5 rounded-2xl p-3">
          <div className="text-green-400 text-xs text-center mb-2">療程後預測</div>
          <ScoreRadar scores={projectedScores.projected} />
        </div>
      </div>

      {/* AI report section */}
      {aiStatus === 'loading' && (
        <div className="bg-white/5 rounded-2xl p-6 text-center space-y-3">
          <div className="text-4xl animate-bounce">🤖</div>
          <div className="text-white font-medium text-sm">Claude AI 正在分析您的臉部特徵…</div>
          <div className="text-white/40 text-xs">個人化分析需 10–20 秒</div>
          <div className="w-48 mx-auto bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full animate-pulse"
              style={{ width: '65%' }}
            />
          </div>
        </div>
      )}

      {aiStatus === 'unavailable' && (
        <div className="bg-amber-400/5 rounded-2xl p-5 border border-amber-400/20">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🔑</span>
            <div>
              <div className="text-white font-medium text-sm mb-1">AI 分析 API Key 未設定或無效</div>
              <div className="text-white/50 text-xs leading-relaxed">
                請至 Supabase 後台 → Edge Functions → analyze-face → Secrets，
                更新{' '}
                <code className="bg-white/10 px-1 rounded text-yellow-400">ANTHROPIC_API_KEY</code>
                {' '}為有效的 Anthropic API Key。上方分數為純數學模型預測結果，已可供參考。
              </div>
            </div>
          </div>
        </div>
      )}

      {aiStatus === 'error' && (
        <div className="bg-red-400/5 rounded-2xl p-4 border border-red-400/20 text-center space-y-3">
          <div className="text-white/60 text-sm">AI 分析發生錯誤，請稍後再試</div>
          {errorDetail && (
            <div className="text-white/30 text-xs font-mono break-all text-left bg-white/5 rounded-xl p-2">
              {errorDetail}
            </div>
          )}
          <button
            onClick={runAnalysis}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 active:scale-95 transition-all rounded-xl text-white/70 text-sm"
          >
            重試
          </button>
        </div>
      )}

      {aiStatus === 'success' && report && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-gradient-to-br from-yellow-400/10 to-amber-400/5 rounded-2xl p-4 border border-yellow-400/20">
            <h4 className="text-yellow-400 font-bold text-sm mb-2 flex items-center gap-1.5">
              <span>✨</span> AI 整體分析
            </h4>
            <p className="text-white/80 text-sm leading-relaxed">{report.summary}</p>
          </div>

          {/* Zone changes */}
          <div className="bg-white/5 rounded-2xl p-4">
            <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">分區改善預測</h4>
            <div className="space-y-3">
              {report.zoneChanges.map((z, i) => {
                const cfg = IMPROVEMENT_CONFIG[z.improvement] ?? IMPROVEMENT_CONFIG.low;
                return (
                  <div key={i} className={`rounded-xl p-3 border ${cfg.bg} ${cfg.border}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-sm font-medium">{z.zone}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="text-white/40 text-xs mb-1.5">{z.treatment}</div>
                    <div className="text-white/65 text-xs leading-relaxed">{z.description}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white/5 rounded-2xl p-4">
            <h4 className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">改善時間軸</h4>
            <div className="space-y-1">
              {report.timeline.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-7 h-7 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 text-xs font-bold">
                      {i + 1}
                    </div>
                    {i < report.timeline.length - 1 && (
                      <div className="w-px bg-white/10 my-1" style={{ minHeight: 16 }} />
                    )}
                  </div>
                  <div className="pb-3">
                    <div className="text-yellow-400 text-xs font-semibold mb-0.5">{step.week}</div>
                    <div className="text-white/65 text-xs leading-relaxed">{step.milestone}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Caution */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <h4 className="text-white/50 text-xs font-semibold mb-2 flex items-center gap-1.5">
              <span>⚠️</span> 注意事項
            </h4>
            <p className="text-white/55 text-xs leading-relaxed">{report.caution}</p>
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex gap-3 pb-8">
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-white/10 text-white/70 rounded-xl hover:bg-white/15 active:scale-95 transition-all text-sm font-medium"
        >
          修改方案
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-3 bg-yellow-400 text-black rounded-xl hover:bg-yellow-300 active:scale-95 transition-all text-sm font-bold"
        >
          重新分析
        </button>
      </div>
    </div>
  );
}
