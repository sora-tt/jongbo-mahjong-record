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
cd frontend && pnpm dev
```

ブラウザで `http://localhost:3000` を開きます。

## 認証フロー

- `/login`
  - Firebase Auth でログインし、ID Tokenを`POST /api/auth/session`の`x-id-token`ヘッダーだけで交換
  - 以降の保護APIは`credentials: include`で`jongbo_session` Cookieを送信
- `/signup`
  - Firebase Auth でユーザー作成後、同じsession exchangeを実行
- ログアウトは`DELETE /api/auth/session`の204完了後にFirebase Authを終了
- `jongbo_session`の値はブラウザJavaScriptから読み取らない

## API・型の境界

- `src/lib/api/core.ts`がHono client、base URL、Cookie、timeout、`{ data }`、ErrorEnvelope、204を集約
- `src/lib/api/contracts.ts`がbackendの`AppType`から主要DTO・request型を導出
- APIレスポンスに存在しないrank、point、統計値をfrontendで再計算しない
- transport以外のfeature・pageから直接`fetch`を呼び出さない
- `src/lib/api/request-state.ts`の`useApiRequest`はAbortControllerとrequest sequenceで古い結果を破棄する

## 共通UI

- `src/components/ui/`にButton、Input、Select、Card、Table、Loading/Error/Emptyを配置
- `src/components/layout/`にHeader、AppShell、AuthFormShellを配置
- 色・focus・surface・statusは`src/app/styles/globals.css`のsemantic tokenを参照
- Headerの「リーグ」は、リーグ一覧routeが確定するまでホーム（`/`）へ遷移

## 補足

- APIはfrontendの共通transportからbackendを直接呼び出します
- 本番環境では `NEXT_PUBLIC_API_BASE_URL` に backend の URL を設定してください（例: `https://jongbo-mahjong-record-backend.vercel.app`）
- backend 側の `CORS_ALLOWED_ORIGINS` に frontend origin を含める必要があります

- クライアント側のFirebase初期化は [`src/lib/firebase/client.ts`](/Users/tatsuya/dev/study/react/jongbo-mahjong-record/frontend/src/lib/firebase/client.ts)
- Firebase Auth操作は [`src/lib/firebase/auth.ts`](/Users/tatsuya/dev/study/react/jongbo-mahjong-record/frontend/src/lib/firebase/auth.ts)
- session交換・削除は [`src/lib/api/auth.ts`](/Users/tatsuya/dev/study/react/jongbo-mahjong-record/frontend/src/lib/api/auth.ts)
- backend APIラッパーは [`src/lib/api/core.ts`](/Users/tatsuya/dev/study/react/jongbo-mahjong-record/frontend/src/lib/api/core.ts) と各feature API module
- 認証状態は [`src/providers/auth-provider.tsx`](/Users/tatsuya/dev/study/react/jongbo-mahjong-record/frontend/src/providers/auth-provider.tsx) で管理します
