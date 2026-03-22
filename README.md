# テント自動張替シミュレーター（OpenAI Vision版）

OpenAI GPT-4o Vision APIを使用した店舗テント張替シミュレーションツール

## 機能

- 📸 画像アップロード
- 🤖 AI自動テント検出（GPT-4o Vision）
- 🎨 生地選択（Googleスプレッドシート CSV連携）
- 🖼️ リアルタイムプレビュー
- 💾 画像ダウンロード

## 技術スタック

- Frontend: HTML/CSS/JavaScript（Vanilla）
- Backend: Vercel Serverless Functions
- AI: OpenAI GPT-4o Vision API
- Deploy: Vercel + GitHub

## ファイル構成

```
/
├── index.html          # フロントエンド
├── package.json        # 依存パッケージ（openai）
├── vercel.json         # Vercel設定（タイムアウト60秒）
└── api/
    └── detectTent.js   # OpenAI Vision APIサーバーレス関数
```

## デプロイ手順

1. このフォルダをGitHubリポジトリにプッシュ
2. [Vercel](https://vercel.com) でリポジトリを連携
3. 環境変数を設定:
   - `OPENAI_API_KEY` : OpenAIのAPIキー
   - `APP_PASSWORD`   : 社内アクセス用パスワード
4. デプロイ後、`index.html` の `API_URL` をVercelのURLに変更

```javascript
// index.html 内の以下を更新
const API_URL = "https://あなたのプロジェクト名.vercel.app/api/detectTent";
```

## 使い方

1. デプロイ先URLにアクセス
2. パスワード入力
3. 生地を選択（スプレッドシートから自動読込）
4. 店舗写真をアップロード
5. 「AI自動検出＆張替」をクリック
6. 完成！ダウンロード可能

## 注意事項

- GPT-4o Vision使用のため、1リクエストあたり約 $0.01〜$0.03 のAPIコストが発生します
- Vercelのサーバーレス関数タイムアウトを60秒に設定済み
