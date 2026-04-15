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
- pnpm を利用します（ルートで `pnpm install` すると全アプリケーションの依存が一括でインストールされます）。
- 以下を順番に実行してください。
```bash
cd /path/to/jongbo-mahjong-record
git config core.hooksPath .githooks
nvm use
corepack enable
pnpm install
```

---

## Frontend

Next.js (App Router) で実装された Web フロントエンドです。

### セットアップと起動

```bash
# ルートで pnpm install 済みであれば不要
pnpm --filter mahjong-record-app-frontend install
pnpm --filter mahjong-record-app-frontend dev
```

またはルートから:
```bash
pnpm dev:frontend
```

- 起動後: http://localhost:3000

### 主な pnpm scripts

- `pnpm dev:frontend` (ルート) または `pnpm dev` (frontend 内): 開発サーバ起動
- `pnpm build`: 本番ビルド
- `pnpm start`: 本番ビルドの起動
- `pnpm lint`: ESLint
- `pnpm lint:fix`: ESLint 自動修正
- `pnpm typecheck`: TypeScript 型チェック

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
# ルートで pnpm install 済みであれば不要
pnpm --filter mahjong-record-app-backend install
```

### ローカル開発（Emulator 利用）

1. Emulator 起動

```bash
pnpm run emulator
```

- Auth: `127.0.0.1:9099`
- Firestore: `127.0.0.1:8081`
- Emulator UI: `http://127.0.0.1:4000`

2. seed データ投入

```bash
pnpm run seed
```

3. API サーバ起動

```bash
pnpm run dev:emulator
```

- API: `http://127.0.0.1:8080`

### 主な pnpm scripts

- `pnpm dev`: API サーバ起動（通常）
- `pnpm start`: API サーバ起動（単発実行）
- `pnpm typecheck`: TypeScript 型チェック
- `pnpm emulator`: Firebase Emulator 起動
- `pnpm seed`: Emulator 向け seed 投入
- `pnpm run dev:emulator`: Emulator 接続で API 起動
- `pnpm lint`: ESLint ルールが正しく適用されているかチェック
- `pnpm lint:fix`: ESLint ルールに沿ってコードを修正

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
