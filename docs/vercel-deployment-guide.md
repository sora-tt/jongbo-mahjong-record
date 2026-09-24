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