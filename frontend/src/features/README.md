# FE feature境界

新しい画面は次の責務で配置します。

- `src/app`: route entryとURLパラメータの受け渡し
- `src/features/<feature>/api`: feature APIの呼び出しとDTOからのadapter
- `src/features/<feature>/model`: feature固有のview modelとデータ変換
- `src/features/<feature>/hooks`: feature固有の画面状態と操作
- `src/features/<feature>/ui/v2`: v2のfeature固有の表示部品
- `src/components/v2/ui`: 業務知識を持たないv2共通部品
- `src/components/v2/layout`: v2のAppShell、認証フォームなどのlayout
- `src/lib`: API transport、Firebase、横断的なutility

APIの正本は`src/lib/api/contracts.ts`のBE `AppType`由来型です。pageから直接`fetch`、Firestore、手書きresponse型、mock fallbackを追加しません。API DTOを表示用へ変換する場合は`src/lib/api/adapter.ts`のadapter境界を使い、BEが返した`rank`、`point`、集計値、`null`をそのまま保持します。

移行中は旧画面との互換性のため、従来の`src/app/**/hooks`からfeatureのhookを再exportします。新しいv2画面はfeatureから直接参照し、移行完了後に旧画面側の再exportを取り除きます。
