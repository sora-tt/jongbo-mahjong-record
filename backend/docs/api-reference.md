# API ドキュメント

## 1. 共通

### Base URL

- local: `http://127.0.0.1:8080`

### 認証

- `GET /api/health`
- `GET /doc`
- `GET /ui`
- `POST /api/auth/session`
- `DELETE /api/auth/session`

上記以外は `jongbo_session` Cookie が必要です。

session 作成時だけ Firebase ID Token を使います。

```json
{
  "idToken": "<ID_TOKEN>"
}
```

通常の API 呼び出しでは Cookie が自動送信される前提です。`curl` では `-b cookie.txt` を使ってください。

### Session Cookie API

#### POST /api/auth/session

概要:

- Firebase ID Token を session cookie に交換する

リクエスト:

```json
{
  "idToken": "<ID_TOKEN>"
}
```

レスポンス:

```json
{
  "data": {
    "authenticated": true,
    "expiresAt": "2026-04-08T10:00:00.000Z"
  }
}
```

#### DELETE /api/auth/session

概要:

- session cookie を削除する

レスポンス:

- `204 No Content`

### 共通レスポンス

成功:

```json
{
  "data": {}
}
```

失敗:

```json
{
  "error": {
    "code": "forbidden",
    "message": "forbidden",
    "details": {}
  }
}
```

## 2. Health

### GET /api/health

概要:

- サーバの生存確認。

リクエスト:

- なし

レスポンス:

```json
{
  "data": {
    "status": "ok",
    "timestamp": "2026-03-15T10:00:00.000Z"
  }
}
```

## 3. Rules

### GET /api/rules

概要:

- ルール一覧を取得する。

リクエスト:

- なし

レスポンス:

```json
{
  "data": [
    {
      "id": "0001",
      "name": "Mリーグルール",
      "description": "frontend mock を元にした四麻ルール",
      "gameType": "yonma",
      "uma": {
        "first": 20,
        "second": 10,
        "third": -10,
        "fourth": -20
      },
      "oka": {
        "startingPoints": 25000,
        "returnPoints": 30000
      },
      "scoreCalculation": "decimal",
      "createdAt": "2026-03-15T10:00:00.000Z",
      "updatedAt": "2026-03-15T10:00:00.000Z"
    }
  ]
}
```

### GET /api/rules/:ruleId

概要:

- ルール詳細を取得する。

リクエスト:

- path: `ruleId`

レスポンス:

```json
{
  "data": {
    "id": "0001",
    "name": "Mリーグルール",
    "description": "frontend mock を元にした四麻ルール",
    "gameType": "yonma",
    "uma": {
      "first": 20,
      "second": 10,
      "third": -10,
      "fourth": -20
    },
    "oka": {
      "startingPoints": 25000,
      "returnPoints": 30000
    },
    "scoreCalculation": "decimal",
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:00:00.000Z"
  }
}
```

### POST /api/rules

概要:

- ルールを新規作成する。

リクエスト:

```json
{
  "name": "ラス回避ルール",
  "description": "四麻ルール",
  "gameType": "yonma",
  "uma": {
    "first": 25,
    "second": 10,
    "third": -5,
    "fourth": -30
  },
  "oka": {
    "startingPoints": 25000,
    "returnPoints": 30000
  },
  "scoreCalculation": "decimal"
}
```

レスポンス:

```json
{
  "data": {
    "id": "generated-rule-id",
    "name": "ラス回避ルール",
    "description": "四麻ルール",
    "gameType": "yonma",
    "uma": {
      "first": 25,
      "second": 10,
      "third": -5,
      "fourth": -30
    },
    "oka": {
      "startingPoints": 25000,
      "returnPoints": 30000
    },
    "scoreCalculation": "decimal",
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:00:00.000Z"
  }
}
```

### PATCH /api/rules/:ruleId

概要:

- ルールを更新する。

リクエスト:

```json
{
  "name": "Mリーグルール改",
  "description": "説明更新"
}
```

レスポンス:

```json
{
  "data": {
    "id": "0001",
    "name": "Mリーグルール改",
    "description": "説明更新",
    "gameType": "yonma",
    "uma": {
      "first": 20,
      "second": 10,
      "third": -10,
      "fourth": -20
    },
    "oka": {
      "startingPoints": 25000,
      "returnPoints": 30000
    },
    "scoreCalculation": "decimal",
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:30:00.000Z"
  }
}
```

### DELETE /api/rules/:ruleId

概要:

- ルールを削除する。

リクエスト:

- path: `ruleId`

レスポンス:

- status: `204 No Content`

## 4. Users

### GET /api/users

概要:

- `username` に対するユーザー検索。

リクエスト:

- query: `query`
  - `username` の部分一致で検索する

例:

- `/api/users?query=iwa`
- `/api/users?query=tatsu`

レスポンス:

```json
{
  "data": [
    {
      "id": "firebase-uid",
      "username": "iwata",
      "email": "iwata@mail",
      "name": "岩田",
      "createdAt": "2026-03-15T10:00:00.000Z",
      "updatedAt": "2026-03-15T10:00:00.000Z"
    }
  ]
}
```

### GET /api/users/me

概要:

- 自分自身のプロフィールを取得する。

リクエスト:

- なし

レスポンス:

```json
{
  "data": {
    "id": "firebase-uid",
    "username": "iwata",
    "email": "iwata@mail",
    "name": "岩田",
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:00:00.000Z"
  }
}
```

### PATCH /api/users/me

概要:

- 自分自身のプロフィールを更新する。

リクエスト:

```json
{
  "name": "岩田太郎",
  "username": "iwata_taro"
}
```

レスポンス:

```json
{
  "data": {
    "id": "firebase-uid",
    "username": "iwata_taro",
    "email": "iwata@mail",
    "name": "岩田太郎",
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:30:00.000Z"
  }
}
```

### GET /api/users/:userId

概要:

- 自分自身のプロフィールを path 指定で取得する。
- `userId` がログイン中ユーザーの UID と一致しない場合は `403 forbidden`。

リクエスト:

- path: `userId`

レスポンス:

```json
{
  "data": {
    "id": "firebase-uid",
    "username": "iwata",
    "email": "iwata@mail",
    "name": "岩田",
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:00:00.000Z"
  }
}
```

### GET /api/users/:userId/joining-seasons

概要:

- 自分が参加しているシーズン一覧を取得する。
- `userId` がログイン中ユーザーの UID と一致しない場合は `403 forbidden`。

リクエスト:

- path: `userId`

レスポンス:

```json
{
  "data": [
    {
      "leagueId": "000000",
      "leagueName": "雀望リーグ",
      "seasonId": "0001",
      "seasonName": "2026シーズン春夏"
    }
  ]
}
```

### GET /api/users/:userId/stats

概要:

- 自分の統計情報を取得する。

リクエスト:

- path: `userId`
- query:
  - `scopeType`: `overall | league | season`
  - `leagueId`: `scopeType=league|season` のとき使用
  - `seasonId`: `scopeType=season` のとき使用

例:

- `/api/users/0001/stats?scopeType=overall`
- `/api/users/0001/stats?scopeType=league&leagueId=000000`
- `/api/users/0001/stats?scopeType=season&leagueId=000000&seasonId=0001`

レスポンス:

```json
{
  "data": {
    "id": "season_000000_0001_0001",
    "userId": "0001",
    "userName": "岩田",
    "scopeType": "season",
    "leagueId": "000000",
    "seasonId": "0001",
    "leagueName": "雀望リーグ",
    "seasonName": "2026シーズン春夏",
    "totalPoints": 100,
    "totalMatchCount": 10,
    "averageRank": 2.3,
    "currentRank": 1,
    "firstCount": 3,
    "secondCount": 3,
    "thirdCount": 2,
    "fourthCount": 2,
    "firstRate": 30,
    "secondRate": 30,
    "thirdRate": 20,
    "fourthRate": 20,
    "highestScore": 100,
    "lowestScore": null,
    "averageScore": 10,
    "winStreak": null,
    "loseStreak": null,
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:00:00.000Z"
  }
}
```

## 5. Leagues

### GET /api/leagues

概要:

- 認証ユーザーが所属しているリーグ一覧を取得する。

リクエスト:

- なし

レスポンス:

```json
{
  "data": [
    {
      "id": "000000",
      "name": "雀望リーグ",
      "rule": {
        "id": "0001",
        "name": "Mリーグルール"
      },
      "memberCount": 9,
      "totalMatchCount": 28,
      "activeSeason": {
        "id": "0001",
        "name": "2026シーズン春夏"
      },
      "myStanding": {
        "rank": 1,
        "totalPoints": 100
      },
      "createdAt": "2026-03-15T10:00:00.000Z",
      "updatedAt": "2026-03-15T10:00:00.000Z"
    }
  ]
}
```

### POST /api/leagues

概要:

- リーグを作成する。
- 認証ユーザーは自動的にメンバーへ追加される。

リクエスト:

```json
{
  "name": "新リーグ",
  "ruleId": "0001",
  "memberUserIds": ["0002", "0003", "0004"]
}
```

レスポンス:

```json
{
  "data": {
    "id": "generated-league-id",
    "name": "新リーグ",
    "rule": {
      "id": "0001",
      "name": "Mリーグルール"
    },
    "memberCount": 4,
    "totalMatchCount": 0,
    "activeSeason": null,
    "members": [
      {
        "id": "0001",
        "userId": "0001",
        "userName": "岩田"
      }
    ],
    "leagueRecords": null,
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:00:00.000Z"
  }
}
```

### GET /api/leagues/:leagueId

概要:

- 自分が所属するリーグの詳細を取得する。

リクエスト:

- path: `leagueId`

レスポンス:

```json
{
  "data": {
    "id": "000000",
    "name": "雀望リーグ",
    "rule": {
      "id": "0001",
      "name": "Mリーグルール"
    },
    "memberCount": 9,
    "totalMatchCount": 28,
    "activeSeason": {
      "id": "0001",
      "name": "2026シーズン春夏"
    },
    "members": [
      {
        "id": "0001",
        "userId": "0001",
        "userName": "岩田"
      }
    ],
    "leagueRecords": {
      "winStreak": {
        "value": 5,
        "userId": "0001",
        "userName": "岩田"
      },
      "loseStreak": {
        "value": 3,
        "userId": "0002",
        "userName": "富田"
      },
      "highestScore": {
        "value": 87800,
        "userId": "0006",
        "userName": "水島"
      },
      "lowestScore": {
        "value": -12000,
        "userId": "0003",
        "userName": "野口"
      }
    },
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:00:00.000Z"
  }
}
```

### PATCH /api/leagues/:leagueId

概要:

- リーグ名を更新する。

リクエスト:

```json
{
  "name": "雀望リーグ改"
}
```

レスポンス:

```json
{
  "data": {
    "id": "000000",
    "name": "雀望リーグ改",
    "rule": {
      "id": "0001",
      "name": "Mリーグルール"
    },
    "memberCount": 9,
    "totalMatchCount": 28,
    "activeSeason": {
      "id": "0001",
      "name": "2026シーズン春夏"
    },
    "members": [],
    "leagueRecords": null,
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:30:00.000Z"
  }
}
```

### GET /api/leagues/:leagueId/members

概要:

- リーグメンバー一覧を取得する。

リクエスト:

- path: `leagueId`

レスポンス:

```json
{
  "data": [
    {
      "id": "0001",
      "userId": "0001",
      "userName": "岩田"
    }
  ]
}
```

### DELETE /api/leagues/:leagueId

概要:

- リーグを削除する。

リクエスト:

- path: `leagueId`

レスポンス:

- status: `204 No Content`

## 6. Seasons

### GET /api/leagues/:leagueId/seasons

概要:

- 所属リーグのシーズン一覧を取得する。

リクエスト:

- path: `leagueId`

レスポンス:

```json
{
  "data": [
    {
      "id": "0001",
      "leagueId": "000000",
      "name": "2026シーズン春夏",
      "status": "active",
      "memberCount": 9,
      "totalMatchCount": 10,
      "createdAt": "2026-03-15T10:00:00.000Z",
      "updatedAt": "2026-03-15T10:00:00.000Z"
    }
  ]
}
```

### POST /api/leagues/:leagueId/seasons

概要:

- シーズンを作成する。

リクエスト:

```json
{
  "name": "2027シーズン",
  "memberUserIds": ["0001", "0002", "0003", "0004"],
  "status": "active"
}
```

レスポンス:

```json
{
  "data": {
    "id": "generated-season-id",
    "leagueId": "000000",
    "name": "2027シーズン",
    "status": "active",
    "memberCount": 4,
    "totalMatchCount": 0,
    "members": [
      {
        "userId": "0001",
        "userName": "岩田"
      }
    ],
    "standings": [],
    "pointProgressions": [],
    "seasonRecords": null,
    "latestPlayedAt": null,
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:00:00.000Z"
  }
}
```

### GET /api/leagues/:leagueId/seasons/:seasonId

概要:

- 自分が所属するシーズン詳細を取得する。

リクエスト:

- path:
  - `leagueId`
  - `seasonId`

レスポンス:

```json
{
  "data": {
    "id": "0001",
    "leagueId": "000000",
    "name": "2026シーズン春夏",
    "status": "active",
    "memberCount": 9,
    "totalMatchCount": 10,
    "members": [
      {
        "userId": "0001",
        "userName": "岩田"
      }
    ],
    "standings": [
      {
        "rank": 1,
        "userId": "0001",
        "userName": "岩田",
        "totalPoints": 100,
        "matchCount": 10,
        "firstCount": 3,
        "secondCount": 3,
        "thirdCount": 2,
        "fourthCount": 2
      }
    ],
    "pointProgressions": [
      {
        "userId": "0001",
        "userName": "岩田",
        "points": [
          {
            "matchIndex": 1,
            "totalPoints": 10
          }
        ]
      }
    ],
    "seasonRecords": {
      "highestScore": {
        "value": 100,
        "userId": "0001",
        "userName": "岩田"
      },
      "avoidLastRate": {
        "value": 80,
        "userId": "0001",
        "userName": "岩田"
      },
      "top2Rate": {
        "value": 60,
        "userId": "0001",
        "userName": "岩田"
      }
    },
    "latestPlayedAt": null,
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:00:00.000Z"
  }
}
```

### PATCH /api/leagues/:leagueId/seasons/:seasonId

概要:

- シーズン名または status を更新する。

リクエスト:

```json
{
  "name": "2026シーズン春夏 改",
  "status": "archived"
}
```

レスポンス:

```json
{
  "data": {
    "id": "0001",
    "leagueId": "000000",
    "name": "2026シーズン春夏 改",
    "status": "archived",
    "memberCount": 9,
    "totalMatchCount": 10,
    "members": [],
    "standings": [],
    "pointProgressions": [],
    "seasonRecords": null,
    "latestPlayedAt": null,
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:30:00.000Z"
  }
}
```

### GET /api/leagues/:leagueId/seasons/:seasonId/members

概要:

- シーズンメンバー一覧を取得する。

リクエスト:

- path:
  - `leagueId`
  - `seasonId`

レスポンス:

```json
{
  "data": [
    {
      "userId": "0001",
      "userName": "岩田"
    }
  ]
}
```

### DELETE /api/leagues/:leagueId/seasons/:seasonId

概要:

- シーズンを削除する。

リクエスト:

- path:
  - `leagueId`
  - `seasonId`

レスポンス:

- status: `204 No Content`

## 7. Sessions

### GET /api/leagues/:leagueId/seasons/:seasonId/sessions

概要:

- シーズン配下のセッション一覧を取得する。

リクエスト:

- path:
  - `leagueId`
  - `seasonId`

レスポンス:

```json
{
  "data": [
    {
      "id": "demo-session",
      "leagueId": "000000",
      "seasonId": "0001",
      "startedAt": "2026-01-01T00:00:00.000Z",
      "endedAt": null,
      "members": [
        {
          "userId": "0001",
          "userName": "岩田"
        }
      ],
      "memberCount": 4,
      "totalMatchCount": 0,
      "tableLabel": "A卓",
      "createdBy": "0001",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/leagues/:leagueId/seasons/:seasonId/sessions

概要:

- セッションを作成する。

リクエスト:

```json
{
  "startedAt": "2026-03-15T10:00:00.000Z",
  "endedAt": null,
  "memberUserIds": ["0001", "0002", "0003", "0004"],
  "tableLabel": "B卓"
}
```

レスポンス:

```json
{
  "data": {
    "id": "generated-session-id",
    "leagueId": "000000",
    "seasonId": "0001",
    "startedAt": "2026-03-15T10:00:00.000Z",
    "endedAt": null,
    "members": [
      {
        "userId": "0001",
        "userName": "岩田"
      }
    ],
    "memberCount": 4,
    "totalMatchCount": 0,
    "tableLabel": "B卓",
    "createdBy": "0001",
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:00:00.000Z"
  }
}
```

### GET /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId

概要:

- セッション詳細を取得する。

リクエスト:

- path:
  - `leagueId`
  - `seasonId`
  - `sessionId`

レスポンス:

```json
{
  "data": {
    "id": "demo-session",
    "leagueId": "000000",
    "seasonId": "0001",
    "startedAt": "2026-01-01T00:00:00.000Z",
    "endedAt": null,
    "members": [
      {
        "userId": "0001",
        "userName": "岩田"
      }
    ],
    "memberCount": 4,
    "totalMatchCount": 0,
    "tableLabel": "A卓",
    "createdBy": "0001",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

### PATCH /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId

概要:

- セッション終了時刻や卓名を更新する。

リクエスト:

```json
{
  "endedAt": "2026-03-15T12:00:00.000Z",
  "tableLabel": "A卓"
}
```

レスポンス:

```json
{
  "data": {
    "id": "demo-session",
    "leagueId": "000000",
    "seasonId": "0001",
    "startedAt": "2026-01-01T00:00:00.000Z",
    "endedAt": "2026-03-15T12:00:00.000Z",
    "members": [],
    "memberCount": 4,
    "totalMatchCount": 0,
    "tableLabel": "A卓",
    "createdBy": "0001",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-03-15T12:00:00.000Z"
  }
}
```

### DELETE /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId

概要:

- セッションを削除する。

リクエスト:

- path:
  - `leagueId`
  - `seasonId`
  - `sessionId`

レスポンス:

- status: `204 No Content`

## 8. Matches

### GET /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches

概要:

- セッション配下の試合一覧を取得する。

リクエスト:

- path:
  - `leagueId`
  - `seasonId`
  - `sessionId`

レスポンス:

```json
{
  "data": [
    {
      "id": "match-001",
      "leagueId": "000000",
      "seasonId": "0001",
      "sessionId": "demo-session",
      "matchIndex": 1,
      "playedAt": "2026-03-15T10:00:00.000Z",
      "results": [
        {
          "userId": "0001",
          "userName": "岩田",
          "wind": "east",
          "rank": 1,
          "rawScore": 42000,
          "point": 32
        }
      ],
      "createdAt": "2026-03-15T10:00:00.000Z",
      "updatedAt": "2026-03-15T10:00:00.000Z"
    }
  ]
}
```

### POST /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches

概要:

- 試合を作成する。
- `point` は backend がルールから計算する。

リクエスト:

```json
{
  "playedAt": "2026-03-15T10:00:00.000Z",
  "results": [
    {
      "userId": "0001",
      "wind": "east",
      "rank": 1,
      "rawScore": 42000
    },
    {
      "userId": "0002",
      "wind": "south",
      "rank": 2,
      "rawScore": 31000
    },
    {
      "userId": "0003",
      "wind": "west",
      "rank": 3,
      "rawScore": 18000
    },
    {
      "userId": "0004",
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
    "id": "generated-match-id",
    "leagueId": "000000",
    "seasonId": "0001",
    "sessionId": "demo-session",
    "matchIndex": 1,
    "playedAt": "2026-03-15T10:00:00.000Z",
    "results": [
      {
        "userId": "0001",
        "userName": "岩田",
        "wind": "east",
        "rank": 1,
        "rawScore": 42000,
        "point": 32
      }
    ],
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:00:00.000Z"
  }
}
```

### GET /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches/:matchId

概要:

- 試合詳細を取得する。

リクエスト:

- path:
  - `leagueId`
  - `seasonId`
  - `sessionId`
  - `matchId`

レスポンス:

```json
{
  "data": {
    "id": "match-001",
    "leagueId": "000000",
    "seasonId": "0001",
    "sessionId": "demo-session",
    "matchIndex": 1,
    "playedAt": "2026-03-15T10:00:00.000Z",
    "results": [
      {
        "userId": "0001",
        "userName": "岩田",
        "wind": "east",
        "rank": 1,
        "rawScore": 42000,
        "point": 32
      }
    ],
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T10:00:00.000Z"
  }
}
```

### PATCH /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches/:matchId

概要:

- 試合を更新する。

リクエスト:

```json
{
  "playedAt": "2026-03-15T11:00:00.000Z",
  "results": [
    {
      "userId": "0001",
      "wind": "east",
      "rank": 1,
      "rawScore": 39000
    },
    {
      "userId": "0002",
      "wind": "south",
      "rank": 2,
      "rawScore": 33000
    },
    {
      "userId": "0003",
      "wind": "west",
      "rank": 3,
      "rawScore": 18000
    },
    {
      "userId": "0004",
      "wind": "north",
      "rank": 4,
      "rawScore": 10000
    }
  ]
}
```

レスポンス:

```json
{
  "data": {
    "id": "match-001",
    "leagueId": "000000",
    "seasonId": "0001",
    "sessionId": "demo-session",
    "matchIndex": 1,
    "playedAt": "2026-03-15T11:00:00.000Z",
    "results": [
      {
        "userId": "0001",
        "userName": "岩田",
        "wind": "east",
        "rank": 1,
        "rawScore": 39000,
        "point": 29
      }
    ],
    "createdAt": "2026-03-15T10:00:00.000Z",
    "updatedAt": "2026-03-15T11:00:00.000Z"
  }
}
```

### DELETE /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches/:matchId

概要:

- 試合を削除する。

リクエスト:

- path:
  - `leagueId`
  - `seasonId`
  - `sessionId`
  - `matchId`

レスポンス:

- status: `204 No Content`
