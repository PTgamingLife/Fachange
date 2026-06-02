import dynamic from 'next/dynamic';

const FaceAnalyzer = dynamic(() => import('@/components/FaceAnalyzer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-60 text-white/35 text-sm">
      初始化中…
    </div>
  ),
});

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080d1a] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-72 h-72 bg-yellow-400/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-8 pb-4 md:pt-12">
        {/* Header */}
        <header className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full px-3 py-1 text-yellow-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
            AI 驅動 · 本地執行 · 隱私保護
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Fa<span className="text-yellow-400">Change</span>
          </h1>
          <p className="text-base md:text-lg text-white/55 max-w-sm mx-auto leading-relaxed">
            AI 臉部評分 × 個人化保養方案
          </p>
          <p className="text-xs text-white/35 max-w-xs mx-auto leading-relaxed hidden md:block">
            上傳照片，獲得五維度評分與依 CP 值排序的最快改善建議
          </p>
        </header>

        {/* Dimension pills — scrollable on mobile */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 justify-start md:justify-center scrollbar-hide">
          {[
            { icon: '🔷', label: '輪廓' },
            { icon: '📐', label: '比例' },
            { icon: '⚖️', label: '對稱' },
            { icon: '✨', label: '膚況' },
            { icon: '🌿', label: '年輕度' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/55 shrink-0"
            >
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Main component */}
        <FaceAnalyzer />

        {/* Footer */}
        <footer className="text-center mt-10 pb-6 text-white/20 text-xs space-y-1 px-4">
          <p>本工具為 AI 輔助參考，不構成醫療診斷</p>
          <p>分數反映模型結果，不代表個人價值</p>
        </footer>
      </div>
    </main>
  );
}
