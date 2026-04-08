# backend

Hono + Firebase Admin SDK + Firestore で動く麻雀記録 API です。

## ローカル開発

依存関係を入れます。

```bash
cd /Users/tatsuya/dev/study/react/jongbo-mahjong-record/backend
npm install
```

### 1. Firebase Emulator を起動

```bash
npm run emulator
```

- Auth: `127.0.0.1:9099`
- Firestore: `127.0.0.1:8081`
- Emulator UI: `http://127.0.0.1:4000`

### 2. seed データを投入

```bash
npm run seed
```

seed では Auth Emulator にもテストユーザーを投入します。共通パスワードは `password123` です。

### 3. API サーバを起動

```bash
npm run dev:emulator
```

- API: `http://127.0.0.1:8080`

## 認証方式

この backend は Firebase ID Token を受け取って `session cookie` を発行し、その後の認証は Cookie で行います。

- session 作成: `POST /api/auth/session`
- session 削除: `DELETE /api/auth/session`
- 認証必須 API: `jongbo_session` Cookie が必要

重要:

- frontend と backend は同じホスト名で開いてください
- 例: frontend を `http://127.0.0.1:3000` で開くなら backend も `http://127.0.0.1:8080`
- `localhost` と `127.0.0.1` を混在させると Cookie を共有できず、Next middleware から認証状態を見失います

## 動作確認

```bash
curl http://127.0.0.1:8080/api/health
```

### 1. Auth Emulator から ID Token を取得

例: `iwata@mail` でサインインします。

```bash
curl -s "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "iwata@mail",
    "password": "password123",
    "returnSecureToken": true
  }'
```

`jq` がある場合:

```bash
TOKEN=$(curl -s "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "iwata@mail",
    "password": "password123",
    "returnSecureToken": true
  }' | jq -r '.idToken')
```

### 2. session cookie を作成

```bash
curl -i http://127.0.0.1:8080/api/auth/session \
  -X POST \
  -H "Content-Type: application/json" \
  -d "{\"idToken\":\"$TOKEN\"}" \
  -c cookie.txt
```

### 3. cookie 付きで API を叩く

```bash
curl http://127.0.0.1:8080/api/users/me \
  -b cookie.txt

curl http://127.0.0.1:8080/api/leagues \
  -b cookie.txt

curl "http://127.0.0.1:8080/api/leagues/000000/seasons/0001" \
  -b cookie.txt
```

### 4. session cookie を削除

```bash
curl -X DELETE http://127.0.0.1:8080/api/auth/session \
  -b cookie.txt
```

## 環境変数

- `CORS_ALLOWED_ORIGINS`
  - カンマ区切りで許可 origin を指定
  - 省略時は `http://127.0.0.1:3000,http://localhost:3000`
- `SESSION_COOKIE_MAX_AGE_SECONDS`
  - session cookie の寿命
  - 省略時は `432000` 秒 = 5 日
- `GOOGLE_CLOUD_PROJECT`
  - Firebase project id

## 補足

- backend は Admin SDK を使うため、Firestore rules の制約は受けません
- `firestore.rules` は Emulator を含むローカル検証向けの緩い設定です。本番用にそのまま使わないでください
- Swagger UI は `http://127.0.0.1:8080/ui`、OpenAPI JSON は `http://127.0.0.1:8080/doc` です
- `firebase-tools` は Node 20 / 22 / 24 を想定しています。ローカルでは Node 22 LTS を推奨します
- `npm run emulator` では既知の deprecation warning を避けるために `NODE_NO_WARNINGS=1` を付けています
