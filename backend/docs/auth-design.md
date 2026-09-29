# backend 認証設計

## 1. 目的

- Firebase Authentication を認証基盤として使う
- Web アプリ向けに session cookie を使い、backend と Next middleware の両方で認証状態を扱えるようにする
- `users` コレクションと Firebase Auth の `uid` / `email` / `displayName` を整合させる
- メール認証の前提設計を明文化し、#86 以降の実装がぶれないようにする

## 2. 認証状態の定義

### 2.1 画面と API で使う状態

| 状態 | 定義 | 典型的な条件 | 許可する画面 / API |
|---|---|---|---|
| `unauthenticated` | セッションなし | `jongbo_session` がない | `/login`, `/signup`, 公開API |
| `pending_verification` | 認証済みだがメール未確認 | Firebase Auth はログイン済み、`emailVerified === false` | `/verify-email`, サインアップ済みリダイレクトページ |
| `verified` | 通常利用可能 | Firebase Auth でログイン済み、`emailVerified === true` | `/home`, 主要機能 |
| `restricted` | 利用制限中 | 退会審査、凍結などのビジネス制約 | 退会/問い合わせのみ、主要 API は `403` |

### 2.2 アクセス制御の基本原則

- `unauthenticated` は、認証不要ページと API のみ利用可能とする
- `pending_verification` は、メール認証の完了を促す画面へ誘導する
- `verified` のみ通常の機能 API を利用可能とする
- `restricted` は、通常の利用禁止とし、バックエンド側で `403 forbidden` を返す

### 2.3 Firebase Auth の `emailVerified` とアプリ側状態の責務

- `Firebase Auth` の `emailVerified` は「メールアドレスが本人確認済みかどうか」のシステム基準であり、最終的な真実源とする
- アプリ側の `auth_status` は「業務上の利用可否」を管理する補助状態とする
- `emailVerified` が `false` でも、ユーザーがアカウント停止対象でなければ `pending_verification` として扱う
- 再送信時や制限解除時に `auth_status` を更新しても、Firebase 側の確認状態が真実源であることは変えない

## 3. 構成

- frontend
  - Firebase Web SDK でログイン / 新規登録を行う
  - ログイン直後に Firebase ID Token を取得する
  - `POST /api/auth/session` の `x-id-token` ヘッダーへ ID Token を送り、session cookie を発行する
  - 以後の API 呼び出しは `credentials: "include"` で Cookie を送る
  - `emailVerified === false` の場合、`/verify-email` へ誘導する

- backend
  - Firebase Admin SDK で ID Token から session cookie を作る
  - 認証必須 API では Cookie を `verifySessionCookie()` で検証する
  - 検証済みユーザーを Hono Context の `authUser` に載せる
  - 必要に応じて `authUser.emailVerified` と Firestore 側の `auth_status` を照合して `403` を返す

- middleware
  - Next.js 側で Cookie の有無を見て `/home` と `/login`, `/signup` を振り分ける
  - `pending_verification` は `/verify-email` を優先表示する
  - 厳密な認可は backend で継続して行う

## 4. トークンと Cookie

### 4.1 採用方針

- Firebase ID Token
  - session cookie 作成時だけ使う
  - 通常 API 認証には使わない

- session交換リクエスト
  - JSON body は使用しない
  - `x-id-token` ヘッダーを必須とする

- session cookie
  - 名前: `jongbo_session`
  - `httpOnly`
  - `sameSite=lax`
  - `secure` は production のみ有効
  - デフォルト寿命は 5 日

### 4.2 メール認証のトークン設計

- 方式は `リンク方式` を採用する
- `コード方式` は入力ミスや再入力の手間が増えるため、初期実装では URL のリンクを踏ませる方式が扱いやすい
- トークンは平文で保存しない
- `verification_token_hash` と `verification_expires_at` を Firestore に保存し、比較時にハッシュ化した値を使う
- 1 回の送信で既存トークンを無効化し、新しいトークンを発行する
- トークンの有効期限は 30 分を目安とし、期限切れ時は再送信付きで再発行する

### 4.3 トークン生成ルール

- 生成元: `crypto.randomBytes(32).toString("hex")` または URL-safe なランダム文字列
- 保存先: `users/{uid}/verification` (または `user_auth/{uid}`) の `verification_token_hash`
- `issued_at` と `expires_at` を必ず保存する
- 再送信時は `prev token` を置き換える
- 既存トークンが有効な状態で再送した場合も、古いリンクを無効化して新しいリンクのみにする

### 4.4 なぜ Cookie か

- Next.js middleware で認証済み / 未認証を先に判定できる
- リロード時の client-side 認証待ちを減らせる
- backend API で毎回 `Authorization` ヘッダを組み立てなくてよい

## 5. ログインフロー

1. frontend が Firebase Auth でログインする
2. frontend が `user.getIdToken()` を取得する
3. frontend が `POST /api/auth/session` を呼ぶ
4. backend が ID Token を検証し、session cookie を発行する
5. backend が `authUser.emailVerified` を見て、未確認なら `pending_verification` として扱う
6. frontend が `GET /api/users/me` などを Cookie 付きで呼ぶ
7. `/home` への遷移後は middleware も Cookie を見て認証済みと判定する
8. `emailVerified === false` の場合は `/verify-email` に誘導する

## 6. メール認証フロー

### 6.1 登録直後の送信タイミング

- 新規アカウント作成時または email 更新時に、認証メールを即時送信する
- 送信前に `last_sent_at` と `resend_cooldown_until` を設定する
- `sendEmailVerification()` は Firebase Auth の組み込み API を使い、ユーザーがメール確認前の状態のままログインできるようにする

### 6.2 再送信ルール

- 再送信はクールダウン付きとする
- 例: 60 秒ごとに 1 回、もしくは 2 分ごとの再送信までに制限する
- 再送信のたびに既存トークンを無効化して、新しいトークンを発行する
- 送信失敗時は `retry_after` を返し、ユーザーは再送信ボタンを待機させる

### 6.3 送信失敗時の挙動

- Firebase の送信失敗は `retryable` と `non_retryable` に分けて扱う
- `non_retryable` では `auth_status` を `pending_verification` のまま維持し、UI に「メール送信に失敗しました」を表示する
- `retryable` はバックグラウンドで再送を試みるが、UI 側での再試行まで待機させる

## 7. Firestore のデータモデル整理

### 7.1 推奨方針

- `users/{uid}` にはプロフィールとアプリ利用状態を持たせる
- 認証メール関連のセンシティブな情報は `users/{uid}/verification` サブコレクションへ分離する
- Firebase Auth の `uid`, `email`, `emailVerified` をアプリの正式データ源として扱う

### 7.2 最低限必要なフィールド

```yaml
users:
  fields:
    uid: string
    email: string
    display_name: string
    avatar_url:
      type: string
      nullable: true
    auth_status:
      type: string
      enum: [unauthenticated, pending_verification, verified, restricted]
    created_at: timestamp
    updated_at: timestamp

  collections:
    verification:
      fields:
        email_verified: boolean
        verification_token_hash:
          type: string
          nullable: true
        verification_expires_at:
          type: timestamp
          nullable: true
        last_sent_at:
          type: timestamp
          nullable: true
        resend_cooldown_until:
          type: timestamp
          nullable: true
        updated_at: timestamp
```

### 7.3 認証情報とプロフィール情報の分離

- プロフィール情報: `display_name`, `avatar_url`, `nickname`, `bio` など
- 認証情報: `email_verified`, `verification_token_hash`, `resend_cooldown_until`
- どちらも `users/{uid}` から参照できるが、認証情報は必要最低限だけを持つ
- `users` ドキュメントは公開しやすい情報、`verification` サブコレクションは管理用データとして分離する

## 8. 未認証ユーザーの制御

### 8.1 API レベルでの制御方針

- session cookie は持っていても `emailVerified === false` の場合は、認証必須 API へのアクセスを `403` で拒否する
- 例: `forbidden` / `email_not_verified`
- 退会やサービス制限中のユーザーは `403` / `account_restricted`

### 8.2 frontend の認証待ちページ

- `/verify-email` を専用ページとして用意する
- ここでは再送信ボタン、メールアドレス表示、再認証の状態表示を行う
- 一度メール確認済みになったら `/home` に自動遷移させる

### 8.3 境界条件

- `verified` ユーザーのみ通常の利用を許可する
- `pending_verification` は認証完了の案内ページに閉じ込める
- `unauthenticated` は public route のみ利用可能とする
- `restricted` は主機能 API にアクセスさせない

## 9. 設計書への反映

- `backend/docs/auth-design.md` で認証状態と検証トークンの設計を正式化する
- `backend/docs/firestore.yaml` に最小限の `users` / `verification` 構造を追記する
- 実装担当者はこの設計を参照して、#86 以降の API / UI を実装する

## 10. 実装上の注意

- frontend と backend は同じホスト名で動かす
  - 例: `127.0.0.1:3000` と `127.0.0.1:8080`
  - `localhost` と `127.0.0.1` を混在させない

- CORS は `credentials: true` が必要
- `Access-Control-Allow-Origin: *` は使わず、許可 origin を明示する
- middleware の Cookie 判定は UX 改善用であり、最終的な認可は backend が担当する
- `Firebase Auth` の `emailVerified` は必ず真実源として扱い、アプリ側の `auth_status` は補助情報として保持する

## 11. 実務上のメモ

- 今回の issue は「認証基盤の土台を定義する」ことが目的であり、実際のメール送信や UI 実装は #86 以降で分割する
- ここで決めた境界を守ることで、認証系の実装が後続 issue でぶれにくくなる
- 実装時に `verification_token_hash` などの secret 系データを plain text で保存しないよう注意する
