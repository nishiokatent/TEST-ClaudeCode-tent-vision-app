# テント自動張替シミュレーター

Gemini Vision APIを使用した店舗テント張替シミュレーションツール

## 機能

- 📸 画像アップロード
- 🤖 AI自動テント検出（Gemini Vision）
- 🎨 生地選択（CSVマスター連携）
- 🖼️ リアルタイムプレビュー
- 💾 画像ダウンロード

## 技術スタック

- Frontend: HTML/CSS/JavaScript（Vanilla）
- Backend: Vercel Serverless Functions
- AI: Google Gemini Vision API
- Deploy: Vercel + GitHub

## デプロイ方法

1. GitHubにプッシュ
2. Vercelと連携
3. 環境変数を設定:
   - `GEMINI_API_KEY`
   - `APP_PASSWORD`

## 使い方 

1. https://あなたのvercel.app にアクセス
2. パスワード入力
3. 生地選択 
4. 画像アップロード
5. AI検出実行
6. 完成！
