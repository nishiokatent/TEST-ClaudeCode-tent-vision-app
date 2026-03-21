import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // リクエストデータの解析
  let body = req.body;
  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  const { password, imageBase64, fabricData } = body;

  // 認証チェック
  if (password !== process.env.APP_PASSWORD) {
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
    // Gemini API初期化
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // プロンプト作成
    const prompt = `
あなたは画像解析の専門家です。
この画像から「店舗の入口テント（日よけ・雨よけテント）」部分を正確に検出してください。

【重要な指示】
1. テント部分の境界座標を正確に抽出してください
2. テントとは：店舗の入口上部にある布製の日よけ・雨よけのこと
3. 看板やガラス、壁、地面は含めないでください
4. 画像の実際のサイズに基づいたピクセル座標で返してください

【出力形式】
必ず以下のJSON形式のみで回答してください。他の文章は一切含めないでください：

{
  "polygon": [
    {"x": 100, "y": 50},
    {"x": 300, "y": 50},
    {"x": 300, "y": 150},
    {"x": 100, "y": 150}
  ],
  "confidence": 0.95,
  "imageWidth": 800,
  "imageHeight": 600
}

座標は画像の左上を(0,0)として、ピクセル単位で指定してください。
polygonは時計回りまたは反時計回りに並べてください。
confidenceは0.0から1.0の範囲で、検出の信頼度を表します。
`;

    // 画像データの準備
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg'
      }
    };

    // Gemini APIにリクエスト
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini Response:', text);

    // JSONパース
    let parsedData;
    try {
      // マークダウンのコードブロックを除去
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw response:', text);
      throw new Error('AIの応答をJSON形式に変換できませんでした');
    }

    // 座標データの検証
    if (!parsedData.polygon || !Array.isArray(parsedData.polygon)) {
      throw new Error('座標データが正しく取得できませんでした');
    }

    if (parsedData.polygon.length < 3) {
      throw new Error('ポリゴンには最低3点必要です');
    }

    // 成功レスポンス
    return res.status(200).json({
      success: true,
      polygon: parsedData.polygon,
      confidence: parsedData.confidence || 0.9,
      imageWidth: parsedData.imageWidth,
      imageHeight: parsedData.imageHeight,
      fabricData: fabricData
    });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'AI解析エラー: ' + error.message
    });
  }
}
