import dynamic from 'next/dynamic';

const FaceAnalyzer = dynamic(() => import('@/components/FaceAnalyzer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 text-white/40 text-sm">
      初始化中…
    </div>
  ),
});

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080d1a] relative overflow-hidden">
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <header className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-4 py-1.5 text-yellow-400 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
            AI 驅動 · 本地執行 · 隱私保護
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Fa<span className="text-yellow-400">Change</span>
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            AI 臉部評分 × 個人化保養方案
          </p>
          <p className="text-sm text-white/40 max-w-lg mx-auto leading-relaxed">
            上傳照片，獲得輪廓、比例、對稱性、膚況與年輕度的多維度評分，
            以及依 CP 值排序的最快改善保養建議
          </p>
        </header>

        {/* Score dimension pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { icon: '🔷', label: '輪廓臉型' },
            { icon: '📐', label: '五官比例' },
            { icon: '⚖️', label: '對稱性' },
            { icon: '✨', label: '肌理膚況' },
            { icon: '🌿', label: '視覺年輕度' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/60"
            >
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Main analyzer */}
        <FaceAnalyzer />

        {/* Footer */}
        <footer className="text-center mt-16 pb-8 text-white/25 text-xs space-y-1">
          <p>本工具為 AI 輔助參考，不構成醫療診斷或醫美建議</p>
          <p>分數反映統計模型結果，不代表個人價值或絕對審美標準</p>
        </footer>
      </div>
    </main>
  );
}
