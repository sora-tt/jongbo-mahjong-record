# CLAUDE.md - 雀望録 (Jongbo Mahjong Record)

## プロジェクト概要

麻雀の成績管理Webアプリケーション。リーグ作成・対局記録・成績追跡が主な機能。
モノレポ構成で `frontend/` と `backend/` に分離されている。

## 技術スタック

### Frontend (`frontend/`)

- Next.js 15.5.4 (App Router, Turbopack), React 19, TypeScript (strict)
- Tailwind CSS 4, ESLint + Prettier

### Backend (`backend/`)

- Hono (Node.js), Firebase Admin SDK (Firestore, Auth), TypeScript
- DDD / Clean Architecture

## 開発コマンド

### Frontend

```bash
cd frontend
npm run dev          # 開発サーバー起動 (Turbopack)
npm run build        # ビルド
npm run lint:fix     # ESLint 自動修正
npm run typecheck    # TypeScript 型チェック
```

### Backend

```bash
cd backend
npm run emulator     # Firebase Emulator 起動（先に実行）
npm run dev:emulator # Emulator接続で開発サーバー起動
npm run seed         # Firestore にシードデータ投入
npm run typecheck    # TypeScript 型チェック
```

## コーディング規約

### 基本ルール（ESLint + Prettier で強制）

- コンポーネントは **アロー関数 + `React.FC`** で定義
- import 順序: React/Next → サードパーティ → 内部モジュール(`@/`) → CSS
- Prettier: 2スペース、LF、trailing comma
- 未使用変数は `_` プレフィックスを付ける

### Frontend の設計パターン

- ページごとのロジックは `src/app/*/hooks/index.ts` にカスタムhookとして抽出する
- hooks から状態とハンドラを返し、ページコンポーネントは表示に専念する
- レイアウトは `Spacer` コンポーネントで制御する（padding, gap, display を props で指定）
- 新規ページ作成時は `src/app/home/page.tsx` を参考にする
- ID は branded types（`LeagueIdType` 等）、コレクションは `Record<ID, Item>` パターン
- 現在 API 未接続。データは `src/mocks/` のモックを使用。ドメイン型変更時はモックも更新すること

### Backend の設計パターン

- `src/http/routes/` → `src/application/services/` → `src/domain/` → `src/infrastructure/` の依存方向
- リポジトリは `src/domain/repositories/` にインターフェース、`src/infrastructure/repositories/` に実装

## Git ワークフロー

- メインブランチ: `develop`（**直接変更禁止**）
- 作業ブランチ: `ISSUE-XX-description` または `feature/ISSUE-XX-description`
- 開発フロー: Issue 作成 → ブランチ作成 → 開発 → PR 作成 → レビュー → マージ
- コミットメッセージは英語で簡潔に
- コードレビューは **日本語** で行う
- 詳細: `docs/how-to-manage-our-development.md`

## ドキュメント一覧

| ファイル | 内容 |
|---|---|
| `docs/how-to-manage-our-development.md` | Git 運用ガイド |
| `docs/pull-request-template.md` | PR テンプレート |
| `docs/architecture.drawio` | アーキテクチャ図 |
| `backend/docs/api-design.md` | API 設計書 |
| `backend/docs/api-reference.md` | API リファレンス |
| `backend/docs/auth-design.md` | 認証設計書 |
| `backend/docs/firestore.yaml` | Firestore スキーマ定義 |
| `docs/swagger/` | Swagger UI |

## 注意事項

- Frontend は現在モックデータで動作（API 統合は未実施）
- Backend は開発途中の部分あり
- Node.js バージョンは `.nvmrc` で管理。`nvm use` で合わせること
- 環境変数ファイル（`.env` 等）はコミットしない
