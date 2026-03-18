# backend 認証設計

## 1. 目的

- 認証基盤として Firebase Authentication を採用する。
- frontend は Firebase Auth SDK でログイン状態を管理し、backend は Firebase ID Token を検証して API 認可を行う。
- 既存 Firestore の `users` コレクションと Auth のユーザー情報を整合させる。
- 将来的に権限制御を追加しやすい、単純で分かりやすい構成にする。

## 2. 前提

- frontend は Next.js App Router。
- backend は Hono + Firebase Admin SDK。
- DB 定義の正本は [firestore.yaml](/Users/tatsuya/dev/study/react/jongbo-mahjong-record-poc/backend/docs/firestore.yaml)。
- `users` コレクションはアプリ内プロフィールの正本として扱う。
- 認証そのものの資格情報管理は Firebase Authentication に任せる。

## 3. 認証方式

### 3.1 基本方針

- frontend
  - Firebase Web SDK を使ってサインアップ、ログイン、ログアウトを行う。
  - ログイン後は Firebase ID Token を取得する。
  - backend へのリクエストには `Authorization: Bearer <idToken>` を付与する。

- backend
  - Firebase Admin SDK で ID Token を検証する。
  - 検証済みユーザー情報を Hono Context に載せる。
  - 認証必須 API では Context から認証ユーザーを参照する。

### 3.2 採用するトークン

- Firebase ID Token
  - 有効期限は短い
  - frontend で定期更新される
  - backend は毎回 verify する

- 今回は session cookie は採用しない
  - まずは SPA / CSR 前提で単純にする
  - 将来的に SSR を強める場合は Firebase Session Cookie の採用を検討する

## 4. 対象ユースケース

### 4.1 初期スコープ

- メールアドレス + パスワードで新規登録
- メールアドレス + パスワードでログイン
- ログアウト
- 現在ログイン中ユーザーの取得
- 認証必須 API の保護
- 初回ログイン時または新規登録時の `users` ドキュメント同期

### 4.2 後続スコープ

- パスワード再設定
- メール確認
- Google ログインなどのソーシャルログイン
- カスタムクレームによる管理者権限

## 5. データモデル方針

### 5.1 Firebase Auth 側

- `uid`
- `email`
- `displayName`
- `emailVerified`

### 5.2 Firestore `users` コレクション

既存定義:

- `id`
- `username`
- `email`
- `name`
- `created_at`
- `updated_at`

### 5.3 対応方針

- `users.id` は Firebase Auth `uid` を使う。
- `users.email` は Auth の email と同期する。
- `users.name` はアプリ表示名として扱う。
- `users.username` は将来的な一意ユーザー名として扱う。

### 5.4 新規登録時の保存ルール

- Firebase Auth 作成後に backend へプロフィール同期 API を呼ぶ。
- backend は `users/{uid}` を作成する。
- `username` が未入力なら初期値は `uid` または `email` 前半を元に生成する。
- `name` は signup 画面の入力値を優先する。

## 6. API 方針

## 6.1 認証が不要な API

- `GET /api/health`
- `GET /doc`
- `GET /ui`

### 6.2 認証必須にする API

基本的に以下は認証必須:

- `GET /api/users/me`
- `GET /api/leagues`
- `POST /api/leagues`
- `GET /api/leagues/:leagueId`
- `PATCH /api/leagues/:leagueId`
- `GET /api/leagues/:leagueId/members`
- `GET /api/leagues/:leagueId/seasons`
- `POST /api/leagues/:leagueId/seasons`
- `GET /api/leagues/:leagueId/seasons/:seasonId`
- `PATCH /api/leagues/:leagueId/seasons/:seasonId`
- `GET /api/leagues/:leagueId/seasons/:seasonId/sessions`
- `POST /api/leagues/:leagueId/seasons/:seasonId/sessions`
- `GET /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId`
- `PATCH /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId`
- `GET /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches`
- `POST /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches`
- `PATCH /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches/:matchId`
- `DELETE /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches/:matchId`
- `GET /api/users/:userId/stats`
- `GET /api/users/:userId/joining-seasons`

### 6.3 認証導入後に変更する API

- `GET /api/leagues?memberUserId=:userId`
  - 認証後は `memberUserId` を不要にする
  - backend で `auth.uid` を使って所属リーグを返す

- `GET /api/users/:userId`
  - 自分のプロフィールだけ返す `GET /api/users/me` を別途追加する
  - 他ユーザー参照可否は後続で整理する

## 7. 新規 API

### 7.1 backend に追加する API

- `POST /api/auth/register-profile`
  - Firebase Auth 済みユーザーの Firestore `users` 同期

- `GET /api/users/me`
  - 認証済みユーザー本人情報取得

- `PATCH /api/users/me`
  - 認証済みユーザープロフィール更新

### 7.2 `POST /api/auth/register-profile`

用途:

- frontend で Firebase Auth の `createUserWithEmailAndPassword` 成功後に呼ぶ

リクエスト:

```json
{
  "name": "岩田",
  "username": "iwata"
}
```

レスポンス:

```json
{
  "data": {
    "id": "firebase-uid",
    "username": "iwata",
    "email": "iwata@mail",
    "name": "岩田",
    "createdAt": "2026-03-14T10:00:00.000Z",
    "updatedAt": "2026-03-14T10:00:00.000Z"
  }
}
```

## 8. backend 実装方針

### 8.1 追加する層

- `src/infra/firebase/auth.ts`
  - Firebase Admin Auth の初期化

- `src/middleware/auth.ts`
  - `Authorization` ヘッダから Bearer Token を取り出して検証

- `src/shared/context.ts`
  - Hono Context に認証済みユーザー型を定義

- `src/usecases/authService.ts`
  - 初回同期や `me` 系処理

### 8.2 ミドルウェア仕様

- `Authorization` ヘッダ必須
- 形式は `Bearer <token>`
- `verifyIdToken()` に失敗したら `401`
- 成功時に Context へ以下を格納

```ts
type AuthUser = {
  uid: string;
  email: string | null;
  name: string | null;
  emailVerified: boolean;
};
```

### 8.3 認証の適用単位

- `app.use("/api/*", authOptional)` は採用しない
- 認証必須ルーター群だけに `requireAuth` を掛ける
- 公開 API と保護 API の境界を明確にする

### 8.4 認可方針

初期実装:

- ログイン済みであることのみ必須
- 所属リーグかどうかの検証は service 層で行う

次段階:

- リーグ作成者
- シーズン更新権限
- 対局記録権限

## 9. frontend 実装方針

### 9.1 使用ライブラリ

- `firebase`

### 9.2 構成

- `src/lib/firebase/client.ts`
  - Firebase App 初期化

- `src/lib/firebase/auth.ts`
  - `signInWithEmailAndPassword`
  - `createUserWithEmailAndPassword`
  - `signOut`
  - `onAuthStateChanged`
  - `getIdToken`

- `src/providers/auth-provider.tsx`
  - 認証状態を React Context で管理

- `src/lib/api/client.ts`
  - backend fetch wrapper
  - Bearer Token を自動付与

### 9.3 login ページ

対象:

- [login/page.tsx](/Users/tatsuya/dev/study/react/jongbo-mahjong-record-poc/frontend/src/app/login/page.tsx)

処理:

1. email / password を入力
2. Firebase Auth でログイン
3. ID Token を取得
4. 認証状態を保持
5. `/home` へ遷移

### 9.4 sign-up ページ

対象:

- [sign-up/page.tsx](/Users/tatsuya/dev/study/react/jongbo-mahjong-record-poc/frontend/src/app/sign-up/page.tsx)

処理:

1. email / password で Firebase Auth ユーザー作成
2. backend の `POST /api/auth/register-profile` を呼ぶ
3. 初回プロフィールを Firestore に同期
4. `/home` へ遷移

## 10. 認証後の API クライアント

### 10.1 fetch wrapper

- backend 呼び出しは共通関数経由にする
- その中で現在ユーザーの ID Token を付与する

例:

```ts
const token = await auth.currentUser?.getIdToken();

fetch("/api/leagues", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### 10.2 失効時の扱い

- `401` が返ったら frontend で再ログインへ誘導する
- まずは単純にログアウト + `/login` 遷移でよい

## 11. Emulator 方針

### 11.1 使用する Emulator

- Authentication Emulator
- Firestore Emulator

### 11.2 backend 側

- `USE_FIRESTORE_EMULATOR=true`
- Auth Emulator も使う場合は Admin SDK 側の projectId を揃える

### 11.3 frontend 側

- Firebase Web SDK を Emulator へ接続する
- `connectAuthEmulator(auth, "http://127.0.0.1:9099")`

### 11.4 `firebase.json`

将来的に backend 側にも auth emulator port を足す:

```json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8081 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

## 12. エラー設計

### 12.1 想定エラー

- `401 unauthorized`
  - トークンなし
  - トークン不正
  - トークン期限切れ

- `403 forbidden`
  - 認証済みだが対象リーグへの権限がない

- `409 conflict`
  - `username` 重複

### 12.2 エラー応答

```json
{
  "error": {
    "code": "unauthorized",
    "message": "authentication required",
    "details": {}
  }
}
```

## 13. 実装順

1. backend に Firebase Auth Admin 初期化を追加する
2. `Authorization: Bearer` 検証ミドルウェアを作る
3. `GET /api/users/me` と `POST /api/auth/register-profile` を作る
4. frontend に Firebase Web SDK を導入する
5. login / sign-up 画面を Auth に接続する
6. API client に ID Token 自動付与を入れる
7. 既存 API を順次認証必須にする
8. リーグ所属チェックなどの認可を足す

## 14. 明示ルール

- Auth の正本は Firebase Authentication。
- アプリプロフィールの正本は Firestore `users`。
- backend は `X-User-Id` のような擬似認証を使わない。
- frontend は ID Token を直接 localStorage に保存しない。
- 認証と認可を分けて考える。
- 認証必須 API は Context の `auth.uid` を唯一の利用者識別子とする。
