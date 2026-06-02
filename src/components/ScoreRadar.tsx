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

const SCORE_LABELS: Record<keyof Omit<FaceScores, 'total'>, { full: string; short: string }> = {
  contour:     { full: '輪廓臉型',  short: '輪廓' },
  proportion:  { full: '五官比例',  short: '比例' },
  symmetry:    { full: '對稱性',   short: '對稱' },
  skinTexture: { full: '肌理膚況',  short: '膚況' },
  youthfulness:{ full: '視覺年輕度', short: '年輕度' },
};

export default function ScoreRadar({ scores }: Props) {
  const data = (Object.keys(SCORE_LABELS) as Array<keyof Omit<FaceScores, 'total'>>).map(key => ({
    subject: SCORE_LABELS[key].full,
    shortSubject: SCORE_LABELS[key].short,
    score: Math.round(scores[key]),
    fullMark: 100,
  }));

  return (
    <div className="w-full h-60 md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
          <PolarGrid stroke="rgba(255,255,255,0.15)" />
          <PolarAngleAxis
            dataKey="shortSubject"
            tick={{ fill: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 500 }}
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
              fontSize: 13,
            }}
            formatter={(value: number) => [`${value} 分`, '評分']}
            labelFormatter={(label: string) => {
              const entry = data.find(d => d.shortSubject === label);
              return entry?.subject ?? label;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
