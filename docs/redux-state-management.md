# Redux State Management

このプロジェクトでは、Redux Toolkit を使用して状態管理を実装しています。

## 構造

```
src/store/
├── index.ts                    # ストアの設定
├── hooks.ts                    # 型付きフック
├── slices/                     # Redux スライス
│   ├── league-slice
│   │   └── index.ts
│   ├── user-slice
│   │   └── index.ts
│   ├── match-slice
│   │   └── index.ts
│   └── rule-slice
│       └── index.ts
└── selectors/                  # セレクター
    ├── league-selectors
    │   └── index.ts
    ├── user-selectors
    │   └── index.ts
    ├── match-selectors
    │   └── index.ts
    └── rule-selectors
        └── index.ts
```

## 使い方

### 1. 型付きフックの使用

コンポーネント内で状態を使用する場合は、型付きフックを使用してください。

```tsx
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAllLeagues } from "@/store/selectors/league-selectors";
import { addLeague } from "@/store/slices/league-slice";

function MyComponent() {
  const dispatch = useAppDispatch();
  const leagues = useAppSelector(selectAllLeagues);

  const handleAddLeague = () => {
    dispatch(
      addLeague({
        leagueId: "league-1",
        name: "My League",
        // ... その他のプロパティ
      }),
    );
  };

  return (
    <div>
      {leagues.map((league) => (
        <div key={league.leagueId}>{league.name}</div>
      ))}
    </div>
  );
}
```

### 2. State の取得

各スライスに対応するセレクターを使用して、状態を取得します。

```tsx
// League
import {
  selectAllLeagues,
  selectLeagueById,
  selectSelectedLeague,
} from "@/store/selectors/league-selectors";

const leagues = useAppSelector(selectAllLeagues);
const league = useAppSelector((state) => selectLeagueById(state, "league-id"));
const selectedLeague = useAppSelector(selectSelectedLeague);

// User
import {
  selectAllUsers,
  selectCurrentUser,
} from "@/store/selectors/user-selectors";

const users = useAppSelector(selectAllUsers);
const currentUser = useAppSelector(selectCurrentUser);

// Match
import {
  selectAllMatches,
  selectMatchesByLeagueId,
} from "@/store/selectors/match-selectors";

const matches = useAppSelector(selectAllMatches);
const leagueMatches = useAppSelector((state) =>
  selectMatchesByLeagueId(state, "league-id"),
);

// Rule
import {
  selectAllRules,
  selectRulesByMode,
} from "@/store/selectors/rule-selectors";

const rules = useAppSelector(selectAllRules);
const yonmaRules = useAppSelector((state) => selectRulesByMode(state, "yonma"));
```

### 3. State の更新

各スライスのアクションを使用して、状態を更新します。

```tsx
import { useAppDispatch } from "@/store/hooks";
import {
  addLeague,
  updateLeague,
  deleteLeague,
  setSelectedLeagueId,
  addLeagueMember,
  addLeagueSeason,
} from "@/store/slices/league-slice";

function LeagueManager() {
  const dispatch = useAppDispatch();

  // リーグの追加
  const handleAddLeague = (league: League) => {
    dispatch(addLeague(league));
  };

  // リーグの更新
  const handleUpdateLeague = (league: League) => {
    dispatch(updateLeague(league));
  };

  // リーグの削除
  const handleDeleteLeague = (leagueId: string) => {
    dispatch(deleteLeague(leagueId));
  };

  // 選択中のリーグIDを設定
  const handleSelectLeague = (leagueId: string) => {
    dispatch(setSelectedLeagueId(leagueId));
  };

  // リーグメンバーの追加
  const handleAddMember = (
    leagueId: string,
    userId: string,
    member: LeagueMember,
  ) => {
    dispatch(addLeagueMember({ leagueId, userId, member }));
  };

  // シーズンの追加
  const handleAddSeason = (leagueId: string, season: LeagueSeason) => {
    dispatch(addLeagueSeason({ leagueId, season }));
  };
}
```

### 4. ローディング状態とエラーハンドリング

各スライスには、ローディング状態とエラー状態が含まれています。

```tsx
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectLeagueLoading,
  selectLeagueError,
} from "@/store/selectors/league-selectors";
import { setLoading, setError } from "@/store/slices/league-slice";

function LeagueList() {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectLeagueLoading);
  const error = useAppSelector(selectLeagueError);

  const fetchLeagues = async () => {
    dispatch(setLoading(true));
    try {
      const response = await fetch("/api/leagues");
      const data = await response.json();
      dispatch(setLeagues(data));
    } catch (err) {
      dispatch(setError(err.message));
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>League List</div>;
}
```

## スライス一覧

### leagueSlice

リーグ関連の状態を管理します。

**Actions:**

- `setLeagues`: リーグのリストを設定
- `addLeague`: 新しいリーグを追加
- `updateLeague`: リーグを更新
- `deleteLeague`: リーグを削除
- `setSelectedLeagueId`: 選択中のリーグIDを設定
- `addLeagueMember`: リーグメンバーを追加
- `updateLeagueMember`: リーグメンバーを更新
- `removeLeagueMember`: リーグメンバーを削除
- `addLeagueSeason`: シーズンを追加
- `updateLeagueSeason`: シーズンを更新
- `removeLeagueSeason`: シーズンを削除
- `setLoading`: ローディング状態を設定
- `setError`: エラーを設定

### userSlice

ユーザー関連の状態を管理します。

**Actions:**

- `setUsers`: ユーザーのリストを設定
- `addUser`: 新しいユーザーを追加
- `updateUser`: ユーザーを更新
- `deleteUser`: ユーザーを削除
- `setCurrentUser`: 現在のユーザーを設定
- `setLoading`: ローディング状態を設定
- `setError`: エラーを設定

### matchSlice

試合関連の状態を管理します。

**Actions:**

- `setMatches`: 試合のリストを設定
- `addMatch`: 新しい試合を追加
- `updateMatch`: 試合を更新
- `deleteMatch`: 試合を削除
- `setSelectedMatchId`: 選択中の試合IDを設定
- `setLoading`: ローディング状態を設定
- `setError`: エラーを設定

### ruleSlice

ルール関連の状態を管理します。

**Actions:**

- `setRules`: ルールのリストを設定
- `addRule`: 新しいルールを追加
- `updateRule`: ルールを更新
- `deleteRule`: ルールを削除
- `setSelectedRuleId`: 選択中のルールIDを設定
- `setLoading`: ローディング状態を設定
- `setError`: エラーを設定

## ベストプラクティス

1. **型付きフックを使用する**: `useDispatch`や`useSelector`の代わりに、`useAppDispatch`と`useAppSelector`を使用してください。

2. **セレクターを使用する**: 状態の取得には、常にセレクターを使用してください。これにより、パフォーマンスが向上し、コードの再利用性が高まります。

3. **メモ化されたセレクターを使用する**: 複雑な計算や派生データには、`createSelector`を使用してメモ化されたセレクターを作成してください。

4. **非同期処理**: API呼び出しなどの非同期処理は、コンポーネント内で実行し、結果をアクションで状態に反映させてください。より複雑な非同期ロジックが必要な場合は、Redux Thunk や Redux Saga の導入を検討してください。

5. **イミュータブルな更新**: Redux Toolkit は Immer を内部で使用しているため、reducer 内で直接状態を変更できます。ただし、新しいオブジェクトを返すか、直接変更するかのどちらかを選択してください（混在させないでください）。
