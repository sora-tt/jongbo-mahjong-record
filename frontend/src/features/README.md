# FE feature境界

新しい画面は次の責務で配置します。

- `src/app`: route entryとURLパラメータの受け渡し
- `src/features/<feature>/api`: feature APIの呼び出しとDTOからのadapter
- `src/features/<feature>/model`: feature固有のview modelとhook
- `src/features/<feature>/ui`: feature固有の表示部品
- `src/components/ui`: 業務知識を持たない共通primitive
- `src/components/layout`: AppShell、Header、認証フォームなどのlayout
- `src/lib`: API transport、Firebase、横断的なutility

APIの正本は`src/lib/api/contracts.ts`のBE `AppType`由来型です。pageから直接`fetch`、Firestore、手書きresponse型、mock fallbackを追加しません。API DTOを表示用へ変換する場合は`src/lib/api/adapter.ts`のadapter境界を使い、BEが返した`rank`、`point`、集計値、`null`をそのまま保持します。
