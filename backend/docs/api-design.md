# backend API設計

## 1. 目的

- `backend/docs/firestore.yaml` を唯一の正として、麻雀記録アプリの API を `Hono` で再実装する。
- 現在の `backend/src` にある途中実装は参考程度とし、Firestore 定義と不整合なものは削除または置換する。
- `mockRepository` ベースの設計は採用せず、実行環境によって Firestore 本番環境とローカル Emulator を切り替える。
- `frontend` の既存 UI で必要になる一覧・詳細・記録入力・個人成績表示を支える API を先に定義する。

## 2. 前提

- DB スキーマの正本は `backend/docs/firestore.yaml`。
- 参考実装は `/Users/tatsuya/dev/study/react/mahjong-record-app/packages/backend/src`。
- UI 参照元は `./frontend/src`。
- 認証は今回の初期実装では簡易化し、将来的に Firebase Auth などを差し込める構成にする。
- API パスは `/api` プレフィックスを付ける。

## 3. Firestore モデル対応

### 3.1 ルートコレクション

- `users`
  - ユーザー基本情報。
- `rules`
  - ルールマスタ。
- `leagues`
  - リーグ本体。
- `user_stats`
  - ユーザー単位の集計結果キャッシュ。

### 3.2 サブコレクション

- `leagues/{leagueId}/members`
  - リーグ参加メンバー。
- `leagues/{leagueId}/seasons`
  - シーズン。
- `leagues/{leagueId}/seasons/{seasonId}/sessions`
  - 対局セッション。
- `leagues/{leagueId}/seasons/{seasonId}/sessions/{sessionId}/matches`
  - 試合正本。

### 3.3 設計上の重要ポイント

- シーズン順位表は `season.standings` を正として返す。
- ポイント推移は `season.point_progressions` を正として返す。
- リーグの歴代記録は `league.league_records` を正として返す。
- 個人成績画面は `user_stats` を主読取元にする。
- `match` 作成・更新・削除時に、影響する `season`, `league`, `user_stats` の集計を再計算する。

## 4. API の責務分割

### 4.1 レイヤ構成

- `src/app.ts`
  - Hono アプリ生成、共通ミドルウェア、ルート登録。
- `src/server.ts`
  - Node 起動。
- `src/routes`
  - ルーティング定義。
- `src/handlers`
  - HTTP 入出力変換。
- `src/usecase`
  - ユースケース単位の業務処理。
- `src/domain`
  - 型、バリデーション、集計ロジック。
- `src/repository`
  - Firestore 読み書きのインターフェース。
- `src/infra/firestore`
  - Admin SDK 初期化、パス解決、トランザクション補助。
- `src/shared`
  - エラー、レスポンス、日時変換。

### 4.2 今ある `backend/src` の扱い

- `controller`, `infra/http` 配下の旧 `league` 実装は削除候補。
- `core/domain/service/leaguePointCalculator.ts` は、ルール計算と整合するなら流用候補。
- `core/application`, `core/domain`, `infra/repository` は全面見直し対象。
- `mockRepository` は導入しない。

## 5. 環境切替方針

### 5.1 Firestore 接続

- 共通で Firebase Admin SDK を利用する。
- `USE_FIRESTORE_EMULATOR=true` のとき `FIRESTORE_EMULATOR_HOST` に接続する。
- それ以外は Application Default Credentials またはサービスアカウントで本番接続する。

### 5.2 想定環境変数

- `PORT`
- `USE_FIRESTORE_EMULATOR`
- `FIRESTORE_EMULATOR_HOST`
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_APPLICATION_CREDENTIALS`

### 5.3 方針

- アプリコード上で mock データに分岐しない。
- Repository 実装は Firestore のみ。
- ローカル開発は Emulator を立てて同一コードを使う。

## 6. 初期実装対象 API

優先度順に以下を実装する。

### 6.1 ヘルスチェック

- `GET /api/health`
  - サーバ稼働確認。

### 6.2 ルール

- `GET /api/rules`
  - ルール一覧取得。
- `GET /api/rules/:ruleId`
  - ルール詳細取得。

### 6.3 ユーザー

- `GET /api/users/:userId`
  - ユーザー基本情報取得。
- `GET /api/users/:userId/stats`
  - `scopeType`, `leagueId`, `seasonId` を条件に個人成績取得。

### 6.4 リーグ

- `GET /api/leagues`
  - リーグ一覧取得。
  - 認証ユーザーの所属リーグのみ返す。
- `POST /api/leagues`
  - リーグ作成。
- `GET /api/leagues/:leagueId`
  - リーグ詳細取得。
  - 返却にはメンバー一覧、アクティブシーズン要約、歴代記録を含める。
- `PATCH /api/leagues/:leagueId`
  - リーグ名更新などの軽微変更。

### 6.5 シーズン

- `GET /api/leagues/:leagueId/seasons`
  - シーズン一覧取得。
- `POST /api/leagues/:leagueId/seasons`
  - シーズン作成。
- `GET /api/leagues/:leagueId/seasons/:seasonId`
  - シーズン詳細取得。
  - 返却には `standings`, `pointProgressions`, `seasonRecords` を含める。
- `PATCH /api/leagues/:leagueId/seasons/:seasonId`
  - 名称変更、`status` 変更。

### 6.6 セッション

- `GET /api/leagues/:leagueId/seasons/:seasonId/sessions`
  - セッション一覧取得。
- `POST /api/leagues/:leagueId/seasons/:seasonId/sessions`
  - セッション作成。
- `GET /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId`
  - セッション詳細取得。
- `PATCH /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId`
  - 終了時刻、卓名更新。

### 6.7 試合

- `GET /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches`
  - 試合一覧取得。
- `POST /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches`
  - 試合記録作成。
- `GET /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches/:matchId`
  - 試合詳細取得。
- `PATCH /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches/:matchId`
  - 試合更新。
- `DELETE /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches/:matchId`
  - 試合削除。

## 7. レスポンス設計

### 7.1 共通方針

- JSON のキーは `camelCase` で統一する。
- Firestore 上の `snake_case` は API 層で変換する。
- 日時は ISO 8601 文字列で返す。
- 数値キャッシュはそのまま返し、フロントで再計算しない前提にする。

### 7.2 共通レスポンス

```json
{
  "data": {},
  "meta": {}
}
```

エラー:

```json
{
  "error": {
    "code": "validation_error",
    "message": "rank must be unique",
    "details": {}
  }
}
```

### 7.3 リーグ一覧

`GET /api/leagues`

```json
{
  "data": [
    {
      "id": "league_001",
      "name": "社内リーグ",
      "rule": {
        "id": "rule_yonma_001",
        "name": "Mリーグ風ルール"
      },
      "memberCount": 8,
      "totalMatchCount": 120,
      "activeSeason": {
        "id": "season_2026_spring",
        "name": "2026春"
      },
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-10T10:00:00.000Z"
    }
  ]
}
```

### 7.4 リーグ詳細

`GET /api/leagues/:leagueId`

```json
{
  "data": {
    "id": "league_001",
    "name": "社内リーグ",
    "rule": {
      "id": "rule_yonma_001",
      "name": "Mリーグ風ルール"
    },
    "memberCount": 8,
    "totalMatchCount": 120,
    "members": [
      {
        "id": "member_001",
        "userId": "user_001",
        "userName": "田中"
      }
    ],
    "activeSeason": {
      "id": "season_2026_spring",
      "name": "2026春"
    },
    "leagueRecords": {
      "winStreak": {
        "value": 7,
        "userId": "user_001",
        "userName": "田中"
      },
      "loseStreak": null,
      "highestScore": null,
      "lowestScore": null
    },
    "createdAt": "2026-03-01T10:00:00.000Z",
    "updatedAt": "2026-03-10T10:00:00.000Z"
  }
}
```

### 7.5 シーズン詳細

`GET /api/leagues/:leagueId/seasons/:seasonId`

```json
{
  "data": {
    "id": "season_2026_spring",
    "leagueId": "league_001",
    "name": "2026春",
    "status": "active",
    "memberCount": 8,
    "totalMatchCount": 32,
    "members": [
      {
        "userId": "user_001",
        "userName": "田中"
      }
    ],
    "standings": [
      {
        "rank": 1,
        "userId": "user_001",
        "userName": "田中",
        "totalPoints": 120.4,
        "matchCount": 16,
        "firstCount": 6,
        "secondCount": 5,
        "thirdCount": 3,
        "fourthCount": 2
      }
    ],
    "pointProgressions": [
      {
        "userId": "user_001",
        "userName": "田中",
        "points": [
          {
            "matchIndex": 1,
            "totalPoints": 45.2
          }
        ]
      }
    ],
    "seasonRecords": {
      "highestScore": null,
      "avoidLastRate": null,
      "top2Rate": null
    },
    "createdAt": "2026-03-01T10:00:00.000Z",
    "updatedAt": "2026-03-10T10:00:00.000Z"
  }
}
```

### 7.6 セッション詳細

`GET /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId`

```json
{
  "data": {
    "id": "session_001",
    "leagueId": "league_001",
    "seasonId": "season_2026_spring",
    "startedAt": "2026-03-14T04:00:00.000Z",
    "endedAt": null,
    "tableLabel": "A卓",
    "memberCount": 4,
    "totalMatchCount": 3,
    "members": [
      {
        "userId": "user_001",
        "userName": "田中"
      }
    ],
    "createdBy": "user_999",
    "createdAt": "2026-03-14T04:00:00.000Z",
    "updatedAt": "2026-03-14T04:30:00.000Z"
  }
}
```

### 7.7 試合

`POST /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches`

```json
{
  "playedAt": "2026-03-14T04:10:00.000Z",
  "results": [
    {
      "userId": "user_001",
      "userName": "田中",
      "wind": "east",
      "rank": 1,
      "rawScore": 42000
    },
    {
      "userId": "user_002",
      "userName": "佐藤",
      "wind": "south",
      "rank": 2,
      "rawScore": 31000
    },
    {
      "userId": "user_003",
      "userName": "鈴木",
      "wind": "west",
      "rank": 3,
      "rawScore": 18000
    },
    {
      "userId": "user_004",
      "userName": "高橋",
      "wind": "north",
      "rank": 4,
      "rawScore": 9000
    }
  ]
}
```

レスポンス:

```json
{
  "data": {
    "id": "match_001",
    "matchIndex": 4,
    "playedAt": "2026-03-14T04:10:00.000Z",
    "results": [
      {
        "userId": "user_001",
        "userName": "田中",
        "wind": "east",
        "rank": 1,
        "rawScore": 42000,
        "point": 45.2
      }
    ],
    "createdAt": "2026-03-14T04:11:00.000Z",
    "updatedAt": "2026-03-14T04:11:00.000Z"
  }
}
```

## 8. バリデーション

### 8.1 リーグ作成

- `name` 必須。
- `ruleId` 必須。
- `memberUserIds` は 1 件以上。

### 8.2 シーズン作成

- `name` 必須。
- `members` はリーグ所属ユーザーのみ許可。
- 同一リーグ内で `active` は 1 件のみ。

### 8.3 セッション作成

- `members` は 3 人または 4 人。
- `members` は対象シーズン所属ユーザーのみ許可。
- `startedAt` 必須。

### 8.4 試合作成・更新

- `results.length` は `session.memberCount` と一致。
- `wind` は重複不可。
- `rank` は重複不可。
- `rawScore` 合計はルールの `oka.starting_points * memberCount` と一致させるか、少なくとも入力方式を明示する。
- `point` はクライアント入力不可、サーバ計算。
- `matchIndex` はサーバ採番。

## 9. 集計更新方針

### 9.1 更新対象

試合作成・更新・削除時に以下を再構築する。

- `sessions.total_match_count`
- `seasons.total_match_count`
- `seasons.standings`
- `seasons.point_progressions`
- `seasons.season_records`
- `leagues.total_match_count`
- `leagues.active_season_id`
- `leagues.active_season_name`
- `leagues.league_records`
- `user_stats`

### 9.2 実装方針

- 初期実装では「対象 season の全 match 再集計」を採用する。
- Firestore Transaction または Batch を使い、正本更新と集計更新を同一ユースケースで行う。
- 最適化は後回しにし、まず整合性を優先する。

## 10. 画面対応の想定

### 10.1 `frontend/src/app/home`

- 必要データ
  - ユーザー名
  - 所属リーグ一覧
  - リーグ名、総試合数、最終更新日時、進行中シーズン要約

### 10.2 `frontend/src/app/league`

- 必要データ
  - リーグ歴代記録
  - シーズン一覧

### 10.3 `frontend/src/app/record-match`

- 必要データ
  - シーズンまたはセッション参加メンバー
  - ルール情報
  - 試合作成 API

### 10.4 `frontend/src/app/personal-record`

- 必要データ
  - ユーザーの参加シーズン候補
  - `user_stats` ベースの個人成績

## 11. 実装順

1. アプリ骨格を再構成する。
2. Firestore 初期化と Emulator 切替を実装する。
3. `rules`, `leagues`, `seasons`, `sessions`, `matches`, `users/stats` の型を定義する。
4. Repository を Firestore 専用で実装する。
5. 読取 API を先に作る。
6. `match` 作成と再集計処理を作る。
7. `PATCH`, `DELETE` を追加する。
8. OpenAPI または zod スキーマを整備する。

## 12. 今後の実装時の明示ルール

- Firestore ドキュメント名と API 型名は 1 対 1 で対応させる。
- API 返却用 DTO と Firestore 保存型を分ける。
- snake_case を domain 層へ持ち込まない。
- `mockRepository` は作らない。
- DB 定義と衝突する既存型は削除する。
- 参考実装を流用する場合も、`database.ts` など旧スキーマ前提の定義は採用しない。

## 13. frontend ページごとの API 対応

### 13.1 対象ページ一覧

- `frontend/src/app/home/page.tsx`
- `frontend/src/app/league/page.tsx`
- `frontend/src/app/league/season/page.tsx`
- `frontend/src/app/league/new/page.tsx`
- `frontend/src/app/league/season/new/page.tsx`
- `frontend/src/app/player-select/page.tsx`
- `frontend/src/app/record-match/page.tsx`
- `frontend/src/app/personal-record/page.tsx`

### 13.2 Home ページ

対象:

- `frontend/src/app/home/page.tsx`
- `frontend/src/app/home/hooks/index.ts`
- `frontend/src/components/pages/home/league-card/index.tsx`
- `frontend/src/components/pages/home/league-card/hooks/index.ts`

用途:

- ログインユーザー名表示
- 所属リーグ一覧表示
- 各リーグの参加人数、総試合数、自分の順位表示

使用エンドポイント:

- `GET /api/users/:userId`
- `GET /api/leagues`

推奨レスポンス:

```json
{
  "data": [
    {
      "id": "league_001",
      "name": "雀望リーグ",
      "memberCount": 8,
      "totalMatchCount": 242,
      "myStanding": {
        "rank": 1,
        "totalPoints": 100.5
      },
      "activeSeason": {
        "id": "season_2026_spring",
        "name": "2026春"
      },
      "updatedAt": "2026-03-14T09:00:00.000Z"
    }
  ]
}
```

補足:

- `LeagueCard` は現在 `userId`, `leagueId` を props で受けても未使用なので、API 導入時はカードに必要な表示データをそのまま props で渡す。
- 一覧の各要素に `myStanding` を含めると、カード側で追加 fetch が不要になる。

### 13.3 League 一覧ページ

対象:

- `frontend/src/app/league/page.tsx`
- `frontend/src/app/league/hooks/index.ts`

用途:

- リーグ全体の歴代記録表示
- シーズン一覧表示

使用エンドポイント:

- `GET /api/leagues/:leagueId`
- `GET /api/leagues/:leagueId/seasons`

推奨レスポンス:

`GET /api/leagues/:leagueId`

```json
{
  "data": {
    "id": "league_001",
    "name": "雀望リーグ",
    "leagueRecords": {
      "winStreak": { "value": 5, "userId": "u1", "userName": "岩田" },
      "loseStreak": { "value": 3, "userId": "u2", "userName": "富田" },
      "highestScore": { "value": 48000, "userId": "u1", "userName": "岩田" },
      "lowestScore": { "value": -12000, "userId": "u3", "userName": "野口" }
    }
  }
}
```

`GET /api/leagues/:leagueId/seasons`

```json
{
  "data": [
    {
      "id": "season1",
      "name": "2024春シーズン",
      "memberCount": 8,
      "totalMatchCount": 32,
      "status": "active"
    },
    {
      "id": "season2",
      "name": "2024冬シーズン",
      "memberCount": 6,
      "totalMatchCount": 24,
      "status": "archived"
    }
  ]
}
```

補足:

- UI 側では `text` を使っているが、API は数値を返し、表示文字列化は frontend で行う。
- これによりソートやフォーマット変更に強くなる。

### 13.4 Season 詳細ページ

対象:

- `frontend/src/app/league/season/page.tsx`
- `frontend/src/app/league/season/hooks/index.ts`

用途:

- シーズン概要表示
- 順位表表示
- pt 推移グラフ表示
- タイトル表示

使用エンドポイント:

- `GET /api/leagues/:leagueId/seasons/:seasonId`
- 必要なら `GET /api/leagues/:leagueId`

推奨レスポンス:

```json
{
  "data": {
    "id": "season_001",
    "leagueId": "league_001",
    "name": "2026シーズン春夏",
    "status": "active",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "latestPlayedAt": "2026-03-10T12:00:00.000Z",
    "rule": {
      "id": "rule_001",
      "name": "Mリーグ風ルール"
    },
    "totalMatchCount": 242,
    "standings": [
      {
        "rank": 1,
        "userId": "0001",
        "userName": "水島",
        "totalPoints": 100,
        "matchCount": 20,
        "firstCount": 36,
        "secondCount": 30,
        "thirdCount": 28,
        "fourthCount": 20
      }
    ],
    "pointProgressions": [
      {
        "userId": "0001",
        "userName": "水島",
        "points": [
          { "matchIndex": 1, "totalPoints": 12.5 },
          { "matchIndex": 2, "totalPoints": 18.3 }
        ]
      }
    ],
    "seasonRecords": {
      "highestScore": { "value": 87800, "userId": "0001", "userName": "水島" },
      "avoidLastRate": { "value": 85.71, "userId": "0002", "userName": "梶本" },
      "top2Rate": { "value": 57.89, "userId": "0003", "userName": "川上" }
    }
  }
}
```

補足:

- 既存 UI の `league.members` 形式は Firestore 正本とずれているため、API 導入時は `standings` を直接描画する実装へ寄せる。
- `titles` という frontend 名称は `seasonRecords` に合わせて見直す。

### 13.5 League 作成ページ

対象:

- `frontend/src/app/league/new/page.tsx`
- `frontend/src/app/league/new/hooks/index.ts`

用途:

- ルール候補取得
- メンバー候補取得
- リーグ作成

使用エンドポイント:

- `GET /api/rules`
- `GET /api/users?query=:keyword`
- `POST /api/leagues`

推奨リクエスト:

```json
{
  "name": "Mリーグ",
  "ruleId": "rule_001",
  "memberUserIds": ["0001", "0002", "0003", "0004"]
}
```

推奨レスポンス:

```json
{
  "data": {
    "id": "league_001",
    "name": "Mリーグ",
    "rule": {
      "id": "rule_001",
      "name": "Mリーグ風ルール"
    },
    "memberCount": 4,
    "totalMatchCount": 0,
    "activeSeason": null
  }
}
```

補足:

- UI は現在「複数ルール追加」に見えるが、Firestore 正本は `league.rule_id` が単一なので、フロントは単一選択 UI に寄せる前提にする。
- メンバー検索は `memberQuery` 直入力よりサジェスト検索のほうが自然。

### 13.6 Season 作成ページ

対象:

- `frontend/src/app/league/season/new/page.tsx`
- `frontend/src/app/league/season/new/hooks/index.ts`

用途:

- リーグ所属メンバー取得
- シーズン作成

使用エンドポイント:

- `GET /api/leagues/:leagueId/members`
- `POST /api/leagues/:leagueId/seasons`

推奨リクエスト:

```json
{
  "name": "2026シーズン",
  "memberUserIds": ["0001", "0002", "0003", "0004"],
  "status": "active"
}
```

推奨レスポンス:

```json
{
  "data": {
    "id": "season_001",
    "leagueId": "league_001",
    "name": "2026シーズン",
    "status": "active",
    "memberCount": 4,
    "totalMatchCount": 0
  }
}
```

### 13.7 Player Select ページ

対象:

- `frontend/src/app/player-select/page.tsx`
- `frontend/src/app/player-select/hooks/index.ts`

用途:

- セッション参加プレイヤー選択

使用エンドポイント:

- `GET /api/leagues/:leagueId/seasons/:seasonId/members`
- `POST /api/leagues/:leagueId/seasons/:seasonId/sessions`

推奨リクエスト:

```json
{
  "startedAt": "2026-03-14T10:00:00.000Z",
  "memberUserIds": ["0001", "0002", "0003", "0004"],
  "tableLabel": "A卓"
}
```

推奨レスポンス:

```json
{
  "data": {
    "id": "session_001",
    "leagueId": "league_001",
    "seasonId": "season_001",
    "memberCount": 4,
    "members": [
      { "userId": "0001", "userName": "田中" }
    ],
    "startedAt": "2026-03-14T10:00:00.000Z"
  }
}
```

補足:

- ここは「対局前の参加者確定」として session 作成に寄せると、record-match 側と責務分離しやすい。

### 13.8 Record Match ページ

対象:

- `frontend/src/app/record-match/page.tsx`
- `frontend/src/app/record-match/hooks/index.ts`

用途:

- セッション参加者取得
- 点数入力
- 試合作成

使用エンドポイント:

- `GET /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId`
- `POST /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches`

推奨リクエスト:

```json
{
  "playedAt": "2026-03-14T10:15:00.000Z",
  "results": [
    { "userId": "0001", "wind": "east", "rank": 1, "rawScore": 42000 },
    { "userId": "0002", "wind": "south", "rank": 2, "rawScore": 31000 },
    { "userId": "0003", "wind": "west", "rank": 3, "rawScore": 18000 },
    { "userId": "0004", "wind": "north", "rank": 4, "rawScore": 9000 }
  ]
}
```

推奨レスポンス:

```json
{
  "data": {
    "id": "match_001",
    "matchIndex": 1,
    "playedAt": "2026-03-14T10:15:00.000Z",
    "results": [
      {
        "userId": "0001",
        "userName": "田中",
        "wind": "east",
        "rank": 1,
        "rawScore": 42000,
        "point": 45.2
      }
    ]
  }
}
```

補足:

- `point` はサーバ計算に固定する。
- フロントが順位を送れない場合は `rawScore` からサーバで順位決定してもよいが、同点処理の責務が増えるため初期実装では `rank` も受けるほうが明快。

### 13.9 Personal Record ページ

対象:

- `frontend/src/app/personal-record/page.tsx`
- `frontend/src/app/personal-record/hooks/index.ts`
- `frontend/src/components/pages/personal-record/*`

用途:

- ユーザーが参加したシーズン候補の表示
- 選択シーズンでの個人成績表示

使用エンドポイント:

- `GET /api/users/:userId/joining-seasons`
- `GET /api/users/:userId/stats?scopeType=season&leagueId=:leagueId&seasonId=:seasonId`

推奨レスポンス:

`GET /api/users/:userId/joining-seasons`

```json
{
  "data": [
    {
      "leagueId": "league_001",
      "leagueName": "雀望リーグ",
      "seasonId": "season_001",
      "seasonName": "2026春"
    }
  ]
}
```

`GET /api/users/:userId/stats?...`

```json
{
  "data": {
    "userId": "0001",
    "scopeType": "season",
    "leagueId": "league_001",
    "seasonId": "season_001",
    "totalPoints": 100,
    "totalMatchCount": 20,
    "averageRank": 2.15,
    "currentRank": 1,
    "firstCount": 6,
    "secondCount": 5,
    "thirdCount": 4,
    "fourthCount": 5,
    "firstRate": 30,
    "secondRate": 25,
    "thirdRate": 20,
    "fourthRate": 25,
    "highestScore": 54.2,
    "lowestScore": -48.7,
    "averageScore": 5,
    "winStreak": 3,
    "loseStreak": 2
  }
}
```

補足:

- 既存 frontend の `LeagueSeasonMember` 依存は `user_stats` 構造とずれているため、API 導入時に `selectedLeagueSeasonMember` ではなく `selectedStats` に置き換える。
- 表示カードは `user_stats` のフィールドに直接対応できる。

## 14. 参考 backend 実装レビュー

参照対象:

- `/Users/tatsuya/dev/study/react/mahjong-record-app/packages/backend/src`

### 14.1 主な問題点

- `MockRepository` と Firestore 実装が混在しており、起動環境によってレスポンスや挙動が変わる。
- Firestore 正本では `sessions` が存在するのに、参考実装では `season` 配下に直接 `matches` をぶら下げている。
- レスポンス DTO が `firestore.yaml` と一致していない。
- ハンドラごとに Repository と AppService を `new` しており、依存関係の初期化箇所が分散している。
- エラー判定を `error.message.includes(...)` に依存しており壊れやすい。
- `app.ts` で `startServer()` まで呼んでおり、アプリ生成と起動が分離されていない。
- `GET /seasons/:seasonId`, `GET /matches/:matchId` のようなトップレベル参照は、Firestore パスと整合させにくい。
- スキーマ上は `snake_case` と `camelCase` の変換方針が曖昧で、型の責務が混ざっている。
- OpenAPI を使っているが、レスポンス共通化と実装の型安全性が中途半端。

### 14.2 Hono 観点でずれている点

- `createApp()` と `serve()` を同一ファイルで実行するより、`app.ts` は pure にして `server.ts` で起動するほうが扱いやすい。
- `app.openapi(route, handler)` 自体は推奨寄りだが、route 定義と handler 実装が肥大化しており、ユースケースと DTO 変換が分離し切れていない。
- ハンドラ内で直接 `console.error` と分岐を書くのではなく、`HTTPException` または共通エラーミドルウェアへ寄せるほうが見通しが良い。
- 依存解決は request ごとに都度 `new` せず、`createDependencies()` のような構成関数で一元化するほうが綺麗。

### 14.3 Next.js 連携観点で気になる点

- ページごとに必要な DTO が薄く定義されておらず、frontend が余計な整形を強いられる。
- 一覧画面向け DTO と詳細画面向け DTO が明確に分かれていない。
- 数値を文字列にして返す設計が混ざると、Next.js 側で再利用しにくい。
- 認証ユーザーを `X-User-Id` ヘッダで仮置きしているが、将来的に Firebase Auth やセッションを使うならミドルウェア境界で吸収すべき。

### 14.4 今後採用する実装方針

- `src/app.ts` は Hono アプリ生成だけを担当する。
- `src/server.ts` は起動専用にする。
- `src/context/dependencies.ts` で Firestore, Repository, UseCase をまとめて組み立てる。
- `src/routes/*` は path と zod schema のみを書く。
- `src/handlers/*` は `c.req.valid()` と `presenter` 呼び出しだけに絞る。
- `src/usecase/*` に業務処理を寄せる。
- `src/presenter/*` で Firestore 型から API DTO への変換を行う。
- 例外は独自エラークラスで表現し、HTTP ステータス変換は共通ハンドラで行う。

### 14.5 綺麗なコードのための判断基準

- 1つの関数で「Firestore 読取」「ビジネス判定」「HTTP 整形」を同時にやらない。
- 命名は `listLeagueSummaries`, `getSeasonDetail`, `createSession` のように画面目的に近い単位にする。
- DTO はページ単位で過不足なく返す。
- 集計値は backend が責任を持ち、frontend では再計算しない。
- 参照系 API と更新系 API で入力・出力モデルを分ける。
- route schema を先に決め、その shape に合わせて handler と presenter を実装する。
