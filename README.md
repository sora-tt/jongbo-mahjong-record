# Jumbo (雀望録)

麻雀のスコア管理アプリケーションです。仲のいいグループごとにリーグを作成することもできます。

## Prerequisites

- Node.jsの使用バージョン統一。nvmのインストールを推奨。

  例: `nvm use $(cat .nvmrc)`

## How to Run our Application

依存関係をインストールして開発サーバを起動します。

```sh
npm install
npm run dev
```

起動スクリプトは、[package.json](package.json)を参照してください。

## Important files and settings

- TypeScript 設定: [tsconfig.json](tsconfig.json)
- ESLint 設定: [eslint.config.mjs](eslint.config.mjs)
- PostCSS/Tailwind 設定: [postcss.config.mjs](postcss.config.mjs) / [src/app/styles/globals.css](src/app/styles/globals.css)
- アプリのルートレイアウト: [src/app/layout.tsx](src/app/layout.tsx)
- Home ページ: [src/app/home/page.tsx](src/app/home/page.tsx)
- コンポーネント例: [src/components/league-card/index.tsx](src/components/league-card/index.tsx), [src/components/create-league-card/index.tsx](src/components/create-league-card/index.tsx)
- モックデータ / 型定義: [src/mocks](src/mocks)（[src/mocks/league.ts](src/mocks/league.ts), [src/mocks/user.ts](src/mocks/user.ts)）、[src/types/domain.ts](src/types/domain.ts)

## Directory Structure

```
.
├─ .githooks/
│  └─ pre-commit
├─ public/
├─ src/
│  ├─ app/
│  │  ├─ home/
│  │  │  └─ page.tsx
│  │  ├─ next-js-demo/
│  │  └─ layout.tsx
│  ├─ backend/                       # to be determined
│  │  ├─ src/
│  │  ├─ package.json
│  │  └─ .env.example
│  ├─ components/                    # common components that might be used by multiple pages
│  │  ├─ common/
│  │  │  ├─ container/
│  │  │  │  ├─ header/
│  │  │  │  │  └─ index.tsx          # It doesn't exist as of now, just example for the component structure
│  │  │  │  └─ footer/
│  │  │  │     └─ index.tsx          # It doesn't exist as of now, just example for the component structure
│  │  │  └─ ui/
│  │  │     └─ button/
│  │  │        └─ index.tsx          # It doesn't exist as of now, just example for the component structure
│  │  └─ pages/
│  │     ├─ league-card/
│  │     │  ├─ hooks.ts              # It doesn't exist as of now, just example for the component structure
│  │     │  └─ index.tsx
│  │     └─ create-league-card/
│  │        └─ index.tsx
│  ├─ mocks/                         # mock data
│  │  ├─ league.ts
│  │  └─ user.ts
│  └─ types/
│     └─ domain.ts
├─ package.json
├─ tsconfig.json
└─ README.md                         # (this file)
```
