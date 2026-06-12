'use client';

import { useState, useRef, useCallback } from 'react';
import { ProjectedScores } from '@/types';

interface Props {
  previewUrl: string;
  projectedScores: ProjectedScores;
}

export default function BeforeAfterSlider({ previewUrl, projectedScores }: Props) {
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePos = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPos(Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const { delta } = projectedScores;

  // Scale factors — kept proportional but multiplied to cross perceptual threshold
  const skinFactor  = Math.min(delta.skinTexture  / 100, 0.3);   // 0–0.3
  const youthFactor = Math.min(delta.youthfulness / 100, 0.25);  // 0–0.25
  const totalFactor = Math.min(delta.total        / 100, 0.2);   // 0–0.2

  // Visible: brightness +0–12%, contrast −0–8%, saturate +0–35%, blur 0–0.4px softer
  const afterFilter = [
    `brightness(${(1 + totalFactor  * 0.6).toFixed(3)})`,
    `contrast(${(1  - skinFactor   * 0.27).toFixed(3)})`,
    `saturate(${(1  + youthFactor  * 1.4).toFixed(3)})`,
    `blur(${(skinFactor * 0.4).toFixed(2)}px)`,
  ].join(' ');

  return (
    <div className="space-y-1.5">
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden select-none touch-none cursor-ew-resize"
        style={{ aspectRatio: '1 / 1' }}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          updatePos(e.clientX);
        }}
        onPointerMove={(e) => { if (dragging.current) updatePos(e.clientX); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}
      >
        {/* After — filtered (skin smoother, brighter, more saturated) */}
        <img
          src={previewUrl}
          alt="療程後預測"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ filter: afterFilter }}
          draggable={false}
        />

        {/* Before — original, clipped to left portion */}
        <img
          src={previewUrl}
          alt="目前"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ clipPath: `inset(0 ${(100 - pos).toFixed(1)}% 0 0)` }}
          draggable={false}
        />

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/90 pointer-events-none"
          style={{ left: `${pos}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center">
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
              <path d="M5 5H1M1 5L3.5 2.5M1 5L3.5 7.5M11 5H15M15 5L12.5 2.5M15 5L12.5 7.5" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Labels */}
        <span className="absolute top-2 left-2 text-xs text-white/90 bg-black/50 px-2 py-0.5 rounded-full pointer-events-none">
          目前
        </span>
        <span className="absolute top-2 right-2 text-xs text-green-400 bg-black/50 px-2 py-0.5 rounded-full pointer-events-none">
          療程後預測
        </span>
      </div>
      <p className="text-white/25 text-xs text-center">← 左右滑動比較外觀變化 →</p>
    </div>
  );
}
