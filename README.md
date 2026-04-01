# Jumbo (雀望録)

麻雀のリーグ運営と対局記録を管理するアプリケーションです。  
このリポジトリは `frontend` と `backend` を同居させた構成になっています。

## リポジトリ構成

```text
.
├── frontend/   # Next.js フロントエンド
├── backend/    # Hono + Firebase Admin API
└── docs/       # 全体設計・Swagger 配布物など
```

## 前提

- Node.js を利用します（nvm を用いてバージョン管理）。
- npm を利用します。
- 以下を順番に実行してください。
```bash
cd /path/to/jongbo-mahjong-record
git config core.hooksPath .githooks
cd frontend
nvm use
cd ../backend
nvm use
```

---

## Frontend

Next.js (App Router) で実装された Web フロントエンドです。

### セットアップと起動

```bash
cd frontend
npm ci
npm run dev
```

- 起動後: http://localhost:3000

### 主な npm scripts

- `npm run dev`: 開発サーバ起動
- `npm run build`: 本番ビルド
- `npm run start`: 本番ビルドの起動
- `npm run lint`: ESLint
- `npm run lint:fix`: ESLint 自動修正
- `npm run typecheck`: TypeScript 型チェック

### 主なディレクトリ

- `frontend/src/app`: ルーティングとページ
- `frontend/src/components`: UI コンポーネント
- `frontend/src/mocks`: モックデータ
- `frontend/src/types`: 型定義

---

## Backend

Hono + Firestore で実装された API サーバです。ローカルでは Firebase Emulator を利用できます。

### セットアップ

```bash
cd backend
npm ci
```

### ローカル開発（Emulator 利用）

1. Emulator 起動

```bash
npm run emulator
```

- Auth: `127.0.0.1:9099`
- Firestore: `127.0.0.1:8081`
- Emulator UI: `http://127.0.0.1:4000`

2. seed データ投入

```bash
npm run seed
```

3. API サーバ起動

```bash
npm run dev:emulator
```

- API: `http://127.0.0.1:8080`

### 主な npm scripts

- `npm run dev`: API サーバ起動（通常）
- `npm run start`: API サーバ起動（単発実行）
- `npm run typecheck`: TypeScript 型チェック
- `npm run emulator`: Firebase Emulator 起動
- `npm run seed`: Emulator 向け seed 投入
- `npm run dev:emulator`: Emulator 接続で API 起動
- `npm run lint`: ESLint ルールが正しく適用されているかチェック
- `npm run lint:fix`: ESLint ルールに沿ってコードを修正

### API ドキュメント

- Swagger UI: `http://127.0.0.1:8080/ui`
- OpenAPI JSON: `http://127.0.0.1:8080/doc`

### 主なディレクトリ

- `backend/src/app`: アプリ起動・DI・サーバ設定
- `backend/src/application`: アプリケーションサービス
- `backend/src/domain`: ドメインモデル/リポジトリ抽象
- `backend/src/http`: ルーティング・バリデーション・レスポンス
- `backend/src/infrastructure`: Firestore/Firebase 連携の実装
- `backend/src/scripts`: seed など運用スクリプト

---

## 参考ドキュメント

- 全体開発ガイド: `docs/how-to-manage-our-development.md`
- API 設計: `backend/docs/api-design.md`
- API リファレンス: `backend/docs/api-reference.md`
- 認証設計: `backend/docs/auth-design.md`
