import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface FaceScores {
  total: number; contour: number; proportion: number;
  symmetry: number; skinTexture: number; youthfulness: number;
}
interface ProjectedScores {
  current: FaceScores; projected: FaceScores; delta: FaceScores;
}
interface Treatment {
  name: string; emoji: string; category: string; improvementPoints: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let body: {
    imageBase64: string; imageType: string;
    currentScores: FaceScores; projectedScores: ProjectedScores;
    selectedTreatments: Treatment[]; faceShape: string; detectedAge: number;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { imageBase64, imageType, currentScores, projectedScores, selectedTreatments, faceShape, detectedAge } = body;

  const treatmentList = selectedTreatments
    .map(t => `• ${t.emoji} ${t.name}（${t.category === 'skincare' ? '保養品' : '醫美療程'}，預計提升 ${t.improvementPoints} 分）`)
    .join('\n');

  const r = (n: number) => Math.round(n);
  const cs = currentScores;
  const ps = projectedScores;

  const scoreTable = [
    `整體魅力：${r(cs.total)} → ${r(ps.projected.total)}（+${r(ps.delta.total)}）`,
    `輪廓臉型：${r(cs.contour)} → ${r(ps.projected.contour)}（+${r(ps.delta.contour)}）`,
    `五官比例：${r(cs.proportion)} → ${r(ps.projected.proportion)}（+${r(ps.delta.proportion)}）`,
    `對稱性：${r(cs.symmetry)} → ${r(ps.projected.symmetry)}（+${r(ps.delta.symmetry)}）`,
    `肌理膚況：${r(cs.skinTexture)} → ${r(ps.projected.skinTexture)}（+${r(ps.delta.skinTexture)}）`,
    `視覺年輕度：${r(cs.youthfulness)} → ${r(ps.projected.youthfulness)}（+${r(ps.delta.youthfulness)}）`,
  ].join('\n');

  const prompt = `你是一位頂尖的醫美諮詢 AI，擁有豐富的臉部美學與療程分析專業知識。

我提供了一張臉部照片，以及透過 AI 人臉偵測模型計算出的詳細評分資料。

## 目前臉部分析資料
- 臉型：${faceShape}
- 視覺年齡：約 ${detectedAge} 歲
- AI 評分結果（各項 0-100 分）：
  - 輪廓臉型：${r(cs.contour)}
  - 五官比例：${r(cs.proportion)}
  - 對稱性：${r(cs.symmetry)}
  - 肌理膚況：${r(cs.skinTexture)}
  - 視覺年輕度：${r(cs.youthfulness)}
  - 魅力總分：${r(cs.total)}

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
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: imageType, data: imageBase64 },
            },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const rawText = data.content?.[0]?.type === 'text' ? data.content[0].text : '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const report = JSON.parse(jsonMatch[0]);
    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('analyze-face error:', err);
    return new Response(
      JSON.stringify({ error: 'AI analysis failed', detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
