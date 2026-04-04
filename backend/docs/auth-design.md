# backend 認証設計

## 1. 目的

- Firebase Authentication を認証基盤として使う
- Web アプリ向けに session cookie を使い、backend と Next middleware の両方で認証状態を扱えるようにする
- `users` コレクションと Firebase Auth の `uid` / `email` / `displayName` を整合させる

## 2. 構成

- frontend
  - Firebase Web SDK でログイン / 新規登録を行う
  - ログイン直後に Firebase ID Token を取得する
  - `POST /api/auth/session` へ ID Token を送り、session cookie を発行する
  - 以後の API 呼び出しは `credentials: "include"` で Cookie を送る

- backend
  - Firebase Admin SDK で ID Token から session cookie を作る
  - 認証必須 API では Cookie を `verifySessionCookie()` で検証する
  - 検証済みユーザーを Hono Context の `authUser` に載せる

- middleware
  - Next.js 側で Cookie の有無を見て `/home` と `/login`, `/signup` を振り分ける
  - 厳密な認証は backend で継続して行う

## 3. トークンと Cookie

### 3.1 採用方針

- Firebase ID Token
  - session cookie 作成時だけ使う
  - 通常 API 認証には使わない

- session cookie
  - 名前: `jongbo_session`
  - `httpOnly`
  - `sameSite=lax`
  - `secure` は production のみ有効
  - デフォルト寿命は 5 日

### 3.2 なぜ Cookie か

- Next.js middleware で認証済み / 未認証を先に判定できる
- リロード時の client-side 認証待ちを減らせる
- backend API で毎回 `Authorization` ヘッダを組み立てなくてよい

## 4. ログインフロー

1. frontend が Firebase Auth でログインする
2. frontend が `user.getIdToken()` を取得する
3. frontend が `POST /api/auth/session` を呼ぶ
4. backend が ID Token を検証し、session cookie を発行する
5. frontend が `GET /api/users/me` などを Cookie 付きで呼ぶ
6. `/home` への遷移後は middleware も Cookie を見て認証済みと判定する

## 5. ログアウトフロー

1. frontend が `DELETE /api/auth/session` を呼ぶ
2. backend が session cookie を削除する
3. frontend が Firebase client 側でも `signOut()` する
4. `/login` へ遷移する

## 6. API 方針

### 6.1 認証不要

- `GET /api/health`
- `GET /doc`
- `GET /ui`
- `POST /api/auth/session`
- `DELETE /api/auth/session`

### 6.2 認証必須

- `GET /api/users`
- `POST /api/users/me`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `GET /api/users/:userId`
- `GET /api/users/:userId/joining-seasons`
- `GET /api/users/:userId/stats`
- `GET /api/leagues`
- `POST /api/leagues`
- `GET /api/leagues/:leagueId`
- `PATCH /api/leagues/:leagueId`
- `DELETE /api/leagues/:leagueId`
- `GET /api/leagues/:leagueId/members`
- `GET /api/leagues/:leagueId/seasons`
- `POST /api/leagues/:leagueId/seasons`
- `GET /api/leagues/:leagueId/seasons/:seasonId`
- `PATCH /api/leagues/:leagueId/seasons/:seasonId`
- `DELETE /api/leagues/:leagueId/seasons/:seasonId`
- `GET /api/leagues/:leagueId/seasons/:seasonId/members`
- `GET /api/leagues/:leagueId/seasons/:seasonId/sessions`
- `POST /api/leagues/:leagueId/seasons/:seasonId/sessions`
- `GET /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId`
- `PATCH /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId`
- `DELETE /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId`
- `GET /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches`
- `POST /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches`
- `GET /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches/:matchId`
- `PATCH /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches/:matchId`
- `DELETE /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches/:matchId`

## 7. 実装方針

### 7.1 backend

- `src/http/routes/auth.ts`
  - session cookie の作成 / 削除 API

- `src/http/middleware/auth.ts`
  - `jongbo_session` を取り出して `verifySessionCookie()` する

- `src/http/session.ts`
  - Cookie 名と属性を管理する

### 7.2 frontend との接続

- login/signup 成功後に `POST /api/auth/session`
- API client は `credentials: "include"` を使う
- logout 時は `DELETE /api/auth/session`

## 8. 運用上の注意

- frontend と backend は同じホスト名で動かす
  - 例: `127.0.0.1:3000` と `127.0.0.1:8080`
  - `localhost` と `127.0.0.1` を混在させない

- CORS は `credentials: true` が必要
- `Access-Control-Allow-Origin: *` は使わず、許可 origin を明示する
- middleware の Cookie 判定は UX 改善用であり、最終的な認可は backend が担当する
