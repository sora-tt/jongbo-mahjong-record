# frontend

Next.js App Router で動く麻雀記録アプリの frontend です。

## 環境変数

`.env.example` をコピーして `.env.local` を作成します。

```bash
cp .env.example .env.local
```

認証画面を使う場合は、少なくとも以下を設定してください。

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Auth Emulator を使う場合は、以下も設定します。

- `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL`

`./.env.example` には以下も含まれています。

- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`

## ローカル起動

backend を `http://127.0.0.1:8080` で起動したうえで、frontend を起動します。

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## 認証フロー

- `/login`
  - Firebase Auth でログイン
  - backend の `GET /api/users/me` でプロフィール取得
- `/signup`
  - Firebase Auth でユーザー作成
  - backend の `POST /api/users/me` でプロフィール作成
- backend API 呼び出し時は Firebase ID Token を `Authorization: Bearer <token>` で送ります

## 補足

- クライアント側の Firebase 初期化は [`src/lib/firebase/client.ts`](/Users/tatsuya/dev/study/react/jongbo-mahjong-record/frontend/src/lib/firebase/client.ts)
- 認証 API は [`src/lib/firebase/auth.ts`](/Users/tatsuya/dev/study/react/jongbo-mahjong-record/frontend/src/lib/firebase/auth.ts)
- backend API ラッパーは [`src/lib/api/client.ts`](/Users/tatsuya/dev/study/react/jongbo-mahjong-record/frontend/src/lib/api/client.ts)
- 認証状態は [`src/providers/auth-provider.tsx`](/Users/tatsuya/dev/study/react/jongbo-mahjong-record/frontend/src/providers/auth-provider.tsx) で管理します
