# backend

Hono + Firestore で動く麻雀記録 API です。

## ローカル開発

依存関係を入れます。

```bash
cd /Users/tatsuya/dev/study/react/jongbo-mahjong-record-poc/backend
npm install
```

### 1. Firestore Emulator を起動

```bash
npm run emulator
```

- Auth: `127.0.0.1:9099`
- Firestore: `127.0.0.1:8081`
- Emulator UI: `http://127.0.0.1:4000`

### 2. seed データを投入

`frontend/src/mocks` を元にした初期データを Firestore Emulator に投入します。

```bash
npm run seed
```

seed では Auth Emulator にもテストユーザーを投入します。共通パスワードは `password123` です。

### 3. API サーバを起動

```bash
npm run dev:emulator
```

- API: `http://127.0.0.1:8080`


## 動作確認

```bash
curl http://127.0.0.1:8080/api/health
curl http://127.0.0.1:8080/api/rules
```

認証付きで試す場合は、先に Auth Emulator から `id_token` を取得します。seed で投入されるユーザーの共通パスワードは `password123` です。

例: `iwata@mail` で `id_token` を取得

```bash
curl -s "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "iwata@mail",
    "password": "password123",
    "returnSecureToken": true
  }'
```

レスポンス JSON の `idToken` を使います。`jq` がある場合は次のように変数へ入れられます。

```bash
TOKEN=$(curl -s "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "iwata@mail",
    "password": "password123",
    "returnSecureToken": true
  }' | jq -r '.idToken')

echo "$TOKEN"
```

Swagger UI を使う場合は、`http://127.0.0.1:8080/ui` の右上 `Authorize` に以下の形式で入れてください。

```text
Bearer $TOKEN
```

`curl` で試す場合は、以下のように `Authorization` を付けます。

```bash
curl http://127.0.0.1:8080/api/users/me \
  -H "Authorization: Bearer $TOKEN"

curl http://127.0.0.1:8080/api/leagues \
  -H "Authorization: Bearer $TOKEN"

curl "http://127.0.0.1:8080/api/leagues/000000/seasons/0001" \
  -H "Authorization: Bearer $TOKEN"
```

## 補足

- backend は Admin SDK を使うため、Firestore rules の制約は受けません。
- `firestore.rules` は Emulator を含むローカル検証向けの緩い設定です。本番用にそのまま使わないでください。
- Swagger UI は `http://127.0.0.1:8080/ui`、OpenAPI JSON は `http://127.0.0.1:8080/doc` です。
- `firebase-tools` は Node 20 / 22 / 24 を想定しています。現在の Node `v23` では `DEP0040` などの警告が出やすいため、ローカルでは Node 22 LTS を推奨します。
- `npm run emulator` では既知の deprecation warning を避けるために `NODE_NO_WARNINGS=1` を付けています。
