import OpenAI from 'openai';

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 環境変数の存在確認
  const apiKey = process.env.OPENAI_API_KEY;
  const appPassword = process.env.APP_PASSWORD;

  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set');
    return res.status(500).json({
      success: false,
      error: '環境変数 OPENAI_API_KEY が設定されていません。Vercelの環境変数を確認してください。'
    });
  }

  if (!appPassword) {
    console.error('APP_PASSWORD is not set');
    return res.status(500).json({
      success: false,
      error: '環境変数 APP_PASSWORD が設定されていません。Vercelの環境変数を確認してください。'
    });
  }

  // リクエストデータの解析
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ success: false, error: 'リクエストのJSONが不正です' });
    }
  }

  if (!body) {
    return res.status(400).json({ success: false, error: 'リクエストボディが空です' });
  }

  const { password, imageBase64, fabricData, imageWidth, imageHeight } = body;

  // 認証チェック
  if (password !== appPassword) {
    return res.status(401).json({
      success: false,
      error: 'パスワードが正しくありません'
    });
  }

  if (!imageBase64) {
    return res.status(400).json({
      success: false,
      error: '画像データが必要です'
    });
  }

  try {
    const openai = new OpenAI({ apiKey });

    // ★ 改善: 正規化座標(0.0〜1.0)を使うことでピクセル座標のずれを防ぐ
    const prompt = `この画像から「店舗の入口テント（日よけ・雨よけテント、オーニング）」の輪郭を検出してください。

【テントとは】
- 店舗入口の上部にある布製・ビニール製の日よけ・雨よけ
- 看板、ガラス窓、壁、地面、柱は含めない
- テントの布部分のみを対象とする

【座標の指定方法 - 非常に重要】
座標は「正規化座標」で返してください：
- 画像の左上が (0.0, 0.0)、右下が (1.0, 1.0)
- x: 左端=0.0、右端=1.0
- y: 上端=0.0、下端=1.0
- 例：画像の中央は (0.5, 0.5)

テントが見つからない場合は "found": false を返してください。

【出力形式】
以下のJSON形式のみで回答してください。説明文やマークダウンは不要です：

{
  "found": true,
  "polygon": [
    {"x": 0.15, "y": 0.10},
    {"x": 0.85, "y": 0.10},
    {"x": 0.90, "y": 0.35},
    {"x": 0.10, "y": 0.35}
  ],
  "confidence": 0.9,
  "description": "赤色のテントを検出"
}

polygonは4〜8点で、テントの輪郭に沿って時計回りに指定してください。
テントが台形なら4点、曲線があれば多めの点で近似してください。`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'あなたは画像内のオブジェクト検出を行うAIです。必ず有効なJSONのみを返してください。マークダウンや説明文は一切含めないでください。'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
    });

    const text = response.choices[0].message.content;
    console.log('OpenAI Response:', text);

    // ★ 改善: より堅牢なJSONパース
    let parsedData;
    try {
      let cleanText = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

      // JSONオブジェクトだけを抽出
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON形式のレスポンスが見つかりません');
      }
      cleanText = jsonMatch[0];
      parsedData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', text);

      // フォールバック: 正規表現でpolygon部分だけ抽出
      try {
        const polygonMatch = text.match(/"polygon"\s*:\s*\[([\s\S]*?)\]/);
        if (polygonMatch) {
          const points = [];
          const pointRegex = /\{\s*"x"\s*:\s*([\d.]+)\s*,\s*"y"\s*:\s*([\d.]+)\s*\}/g;
          let match;
          while ((match = pointRegex.exec(polygonMatch[1])) !== null) {
            points.push({ x: parseFloat(match[1]), y: parseFloat(match[2]) });
          }
          if (points.length >= 3) {
            parsedData = { found: true, polygon: points, confidence: 0.7 };
          }
        }
      } catch (e) {
        // フォールバックも失敗
      }

      if (!parsedData) {
        throw new Error('AIの応答をJSON形式に変換できませんでした。再度お試しください。');
      }
    }

    // テントが見つからなかった場合
    if (parsedData.found === false) {
      return res.status(200).json({
        success: false,
        error: 'テントが検出されませんでした。別の画像をお試しください。',
        confidence: 0,
      });
    }

    // 座標データの検証
    if (!parsedData.polygon || !Array.isArray(parsedData.polygon)) {
      throw new Error('座標データが正しく取得できませんでした');
    }

    if (parsedData.polygon.length < 3) {
      throw new Error('ポリゴンには最低3点必要です');
    }

    // ★ 改善: 座標の正規化を保証（0.0〜1.0の範囲）
    // GPT-4oがピクセル座標を返した場合に自動補正
    const maxX = Math.max(...parsedData.polygon.map(p => p.x));
    const maxY = Math.max(...parsedData.polygon.map(p => p.y));

    let normalizedPolygon;
    if (maxX > 1.0 || maxY > 1.0) {
      // ピクセル座標 → 正規化座標に変換
      const w = parsedData.imageWidth || imageWidth || Math.max(maxX, 1);
      const h = parsedData.imageHeight || imageHeight || Math.max(maxY, 1);
      console.log(`Normalizing pixel coords: dividing by ${w}x${h}`);
      normalizedPolygon = parsedData.polygon.map(p => ({
        x: Math.min(1.0, Math.max(0.0, p.x / w)),
        y: Math.min(1.0, Math.max(0.0, p.y / h)),
      }));
    } else {
      normalizedPolygon = parsedData.polygon.map(p => ({
        x: Math.min(1.0, Math.max(0.0, p.x)),
        y: Math.min(1.0, Math.max(0.0, p.y)),
      }));
    }

    // 成功レスポンス（正規化座標で返す）
    return res.status(200).json({
      success: true,
      polygon: normalizedPolygon,
      confidence: parsedData.confidence || 0.7,
      description: parsedData.description || '',
      fabricData: fabricData,
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'AI解析エラー: ' + error.message,
    });
  }
}
