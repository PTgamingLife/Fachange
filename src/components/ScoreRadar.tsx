'use client';

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { FaceScores } from '@/types';

interface Props {
  scores: FaceScores;
}

const SCORE_LABELS: Record<keyof Omit<FaceScores, 'total'>, string> = {
  contour: '輪廓臉型',
  proportion: '五官比例',
  symmetry: '對稱性',
  skinTexture: '肌理膚況',
  youthfulness: '視覺年輕度',
};

export default function ScoreRadar({ scores }: Props) {
  const data = (Object.keys(SCORE_LABELS) as Array<keyof Omit<FaceScores, 'total'>>).map(key => ({
    subject: SCORE_LABELS[key],
    score: Math.round(scores[key]),
    fullMark: 100,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="rgba(255,255,255,0.15)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 500 }}
          />
          <Radar
            name="分數"
            dataKey="score"
            stroke="#f5c842"
            fill="#f5c842"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(15,23,41,0.95)',
              border: '1px solid rgba(245,200,66,0.4)',
              borderRadius: 8,
              color: '#fff',
            }}
            formatter={(value: number) => [`${value} 分`, '評分']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
