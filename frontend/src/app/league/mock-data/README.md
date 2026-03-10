# League Mock Data

このディレクトリには、リーグページで使用するmockデータを格納します。

## 使い方

クエリパラメータ `?_mock=<filename>` を使用して、mockデータを動的に読み込むことができます。

### 例

```
http://localhost:3000/league?_mock=league-default
http://localhost:3000/league?_mock=league-1
http://localhost:3000/league?_mock=league-2
```

## ファイル構成

各mockファイルは以下の形式でエクスポートする必要があります：

```typescript
import { League } from "@/types/domain/league";

export const mockLeague: League = {
  // Leagueデータ
};
```

## 新しいmockデータの追加

1. このディレクトリに新しいファイルを作成（例: `league-custom.ts`）
2. `mockLeague`という名前でLeagueデータをエクスポート
3. ブラウザで `?_mock=league-custom` でアクセス

## 利用可能なmockデータ

- `league-default` - デフォルトのリーグデータ（雀望リーグ）
- `league-1` - リーグ1のデータ（雀望リーグ）
- `league-2` - リーグ2のデータ（土田リーグ）

## 注意事項

- クエリパラメータがない場合は、通常のAPI呼び出しが実行されます
- mockファイルが見つからない場合は、エラーメッセージが表示されます
- mockデータは開発・テスト用途のみに使用してください
