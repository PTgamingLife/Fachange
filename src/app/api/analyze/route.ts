import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { FaceScores, Treatment, ProjectedScores, AIProjectionReport } from '@/types';

export const runtime = 'nodejs';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface AnalyzeRequest {
  imageBase64: string;
  imageType: string;
  currentScores: FaceScores;
  projectedScores: ProjectedScores;
  selectedTreatments: Treatment[];
  faceShape: string;
  detectedAge: number;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 503 }
    );
  }

  let body: AnalyzeRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const {
    imageBase64,
    imageType,
    currentScores,
    projectedScores,
    selectedTreatments,
    faceShape,
    detectedAge,
  } = body;

  const treatmentList = selectedTreatments
    .map(t => `• ${t.emoji} ${t.name}（${t.category === 'skincare' ? '保養品' : '醫美療程'}，預計提升 ${t.improvementPoints} 分）`)
    .join('\n');

  const scoreTable = [
    `整體魅力：${Math.round(currentScores.total)} → ${Math.round(projectedScores.projected.total)}（+${Math.round(projectedScores.delta.total)}）`,
    `輪廓臉型：${Math.round(currentScores.contour)} → ${Math.round(projectedScores.projected.contour)}（+${Math.round(projectedScores.delta.contour)}）`,
    `五官比例：${Math.round(currentScores.proportion)} → ${Math.round(projectedScores.projected.proportion)}（+${Math.round(projectedScores.delta.proportion)}）`,
    `對稱性：${Math.round(currentScores.symmetry)} → ${Math.round(projectedScores.projected.symmetry)}（+${Math.round(projectedScores.delta.symmetry)}）`,
    `肌理膚況：${Math.round(currentScores.skinTexture)} → ${Math.round(projectedScores.projected.skinTexture)}（+${Math.round(projectedScores.delta.skinTexture)}）`,
    `視覺年輕度：${Math.round(currentScores.youthfulness)} → ${Math.round(projectedScores.projected.youthfulness)}（+${Math.round(projectedScores.delta.youthfulness)}）`,
  ].join('\n');

  const prompt = `你是一位頂尖的醫美諮詢 AI，擁有豐富的臉部美學與療程分析專業知識。

我提供了一張臉部照片，以及透過 AI 人臉偵測模型計算出的詳細評分資料。

## 目前臉部分析資料
- 臉型：${faceShape}
- 視覺年齡：約 ${detectedAge} 歲
- AI 評分結果（各項 0-100 分）：
  - 輪廓臉型：${Math.round(currentScores.contour)}
  - 五官比例：${Math.round(currentScores.proportion)}
  - 對稱性：${Math.round(currentScores.symmetry)}
  - 肌理膚況：${Math.round(currentScores.skinTexture)}
  - 視覺年輕度：${Math.round(currentScores.youthfulness)}
  - 魅力總分：${Math.round(currentScores.total)}

## 已選擇的療程
${treatmentList}

## 預測改善後評分
${scoreTable}

請根據照片中臉部的實際特徵，以及以上療程資料，提供一份**詳細、個人化的臉部變化分析報告**。

請以以下 JSON 格式回覆（只回覆 JSON，不要有其他文字）：
{
  "summary": "整體變化摘要（2-3句，繁體中文，具體描述臉部哪些部位會有明顯改變）",
  "zoneChanges": [
    {
      "zone": "臉部區域名稱（如：眼周、蘋果肌、下顎線等）",
      "treatment": "對應療程名稱",
      "description": "這個區域具體會有什麼變化（1-2句，包含改善幅度描述）",
      "improvement": "high 或 medium 或 low"
    }
  ],
  "timeline": [
    {
      "week": "時間點（如：第1週、第4週、第12週）",
      "milestone": "這個時間點會看到的具體變化"
    }
  ],
  "caution": "注意事項與個人化建議（1-2句）"
}

請確保分析是針對這張具體照片的臉部特徵，給出真實、有洞察力的分析。`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }

    const report: AIProjectionReport = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ report });
  } catch (err) {
    console.error('AI analyze error:', err);
    return NextResponse.json(
      { error: 'AI analysis failed', detail: String(err) },
      { status: 500 }
    );
  }
}
