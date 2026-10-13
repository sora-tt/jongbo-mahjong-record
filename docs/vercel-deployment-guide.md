# Vercel Deployment Guide

## 必要な GitHub Secrets

- `VERCEL_FRONTEND_TOKEN`
  - frontend 用 Vercel project に対する token
- `VERCEL_BACKEND_TOKEN`
  - backend 用 Vercel project に対する token

## Vercel 側の設定

- frontend project: `jongbo-mahjong-record-frontend`
- backend project: `jongbo-mahjong-record-backend`
- それぞれの workflow は `main` への push と手動実行 (`workflow_dispatch`) で動作します。

### バックエンドのルーティング設定

- Git 連携でリポジトリを取り込む場合、Root Directory は `backend` にします。GitHub Actions は既に `backend/` を作業ディレクトリにしています。
- Framework Preset は `Other`、Output Directory は `public` にします。
- `backend/vercel.json` が Framework Preset、Build Command (`pnpm compile`)、Output Directory (`public`) を指定します。追加の環境変数や Dashboard 上のルーティングルール設定は不要です。
- `Other` でビルドコマンドを指定すると静的出力先も必要です。`backend/public/robots.txt` を配置して出力先を確保しています。`dist/` は Functions 用のコンパイル結果で、静的出力先には指定しません。
- `routes` の `/api(?:/.*)?` で `/api` とその配下を `api/index.js` へ転送し、元のパスとクエリを Hono が処理します。キャプチャを使わないので、転送用のパラメータがクエリに追加されません。通常の Functions の `[...route].js` に複数階層の catch-all 動作を依存させません。
- 設定変更を反映するには、修正を含むバックエンドを再デプロイします。以前のデプロイをそのまま再実行するだけでは反映されません。

デプロイ後は、認証情報なしで `GET /api/leagues/{leagueId}/members` や `GET /api/leagues/{leagueId}/seasons` を呼び、Hono の JSON 形式の401 (`authentication_error`) が返ることを確認します。Vercel の `x-vercel-error: NOT_FOUND` が返る場合は、Functions に到達していません。ログイン済みの画面では、これらの取得が成功して参加者・シーズン一覧が表示されることを確認します。

## 再実行と切り戻し

### 再実行

- GitHub Actions の対象 workflow を開き、`Run workflow` から手動実行します。
- デプロイ失敗時は、まず同じ workflow を再実行して一時的な失敗かを切り分けます。

### 切り戻し

- Vercel Dashboard の Deployment 一覧から、直前の成功した deployment を選んで Promote します。
- frontend と backend は別 project なので、必要に応じてそれぞれ個別に切り戻します。

## 失敗時の確認ポイント

- GitHub Secrets が正しく設定されているか
- frontend / backend それぞれの Vercel project が一致しているか
- backend は `backend/` 配下で build されているか
