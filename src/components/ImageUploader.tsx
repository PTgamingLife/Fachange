'use client';

import { useCallback, useRef, useState } from 'react';

interface Props {
  onImageReady: (img: HTMLImageElement, url: string) => void;
}

export default function ImageUploader({ onImageReady }: Props) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => fileRef.current?.click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300
          flex flex-col items-center justify-center min-h-[320px] p-8
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
            className="max-h-[400px] max-w-full rounded-xl object-contain shadow-2xl"
          />
        ) : (
          <>
            <div className="text-7xl mb-6 animate-pulse-glow">📸</div>
            <h3 className="text-2xl font-bold text-white mb-3">上傳臉部照片</h3>
            <p className="text-white/60 text-center mb-6 max-w-sm leading-relaxed">
              支援 JPG、PNG、WebP 格式<br />
              建議使用正面、光線充足的照片以獲得最準確的分析結果
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 text-sm text-white/70">
                <span>✅</span> 正面自然光
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 text-sm text-white/70">
                <span>✅</span> 未遮擋五官
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 text-sm text-white/70">
                <span>✅</span> 不含濾鏡
              </div>
            </div>
          </>
        )}

        {preview && (
          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
            <span className="text-white text-lg font-semibold">點擊更換照片</span>
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <p className="text-center text-white/40 text-xs mt-4">
        照片僅在您的瀏覽器中本地分析，不會上傳至任何伺服器
      </p>
    </div>
  );
}
