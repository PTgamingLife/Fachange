'use client';

import { useCallback, useRef, useState } from 'react';

interface Props {
  onImageReady: (img: HTMLImageElement, url: string) => void;
}

export default function ImageUploader({ onImageReady }: Props) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      setPreview(url);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => onImageReady(img, url);
      img.src = url;
    },
    [onImageReady]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file);
    },
    [loadFile]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => fileRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300
          flex flex-col items-center justify-center p-6 md:p-10
          min-h-[240px] md:min-h-[320px]
          ${dragging
            ? 'border-yellow-400 bg-yellow-400/10 scale-[1.02]'
            : 'border-white/20 bg-white/5 hover:border-yellow-400/60 hover:bg-white/10'
          }
        `}
      >
        {preview ? (
          <img
            src={preview}
            alt="上傳預覽"
            className="max-h-[360px] max-w-full rounded-xl object-contain shadow-2xl"
          />
        ) : (
          <>
            <div className="text-5xl md:text-7xl mb-4">📸</div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2 text-center">
              上傳臉部照片
            </h3>
            <p className="text-white/60 text-center mb-5 max-w-xs leading-relaxed text-sm md:text-base">
              從相簿選擇照片，或使用下方按鈕直接拍攝
            </p>
            <div className="flex gap-2 flex-wrap justify-center">
              {['正面自然光', '未遮擋五官', '不含濾鏡'].map(t => (
                <div key={t} className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 text-xs text-white/70">
                  <span>✅</span> {t}
                </div>
              ))}
            </div>
          </>
        )}

        {preview && (
          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
            <span className="text-white text-base font-semibold">點擊更換照片</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mt-4">
        {/* Gallery picker */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/10 text-white font-medium text-sm hover:bg-white/15 active:scale-95 transition-all"
        >
          <span className="text-lg">🖼️</span>
          從相簿選擇
        </button>

        {/* Camera button — mobile only; hidden on desktop via CSS but functional */}
        <button
          onClick={() => cameraRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-yellow-400/20 border border-yellow-400/30 text-yellow-300 font-medium text-sm hover:bg-yellow-400/30 active:scale-95 transition-all"
        >
          <span className="text-lg">📷</span>
          直接拍照
        </button>
      </div>

      {/* Hidden inputs */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={onFileChange}
      />

      <p className="text-center text-white/35 text-xs mt-4 px-4">
        照片僅在您的裝置本地分析，不會上傳至任何伺服器
      </p>
    </div>
  );
}
