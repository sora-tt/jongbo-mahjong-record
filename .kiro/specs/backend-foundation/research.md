# 調査ログ: backend-foundation

## Summary

現行BEはHono、Zod、Firebase Admin SDK、Firestoreを使ったCRUDと集計の途中実装を持つ。主な不整合は、旧文書が独立 `rules` コレクションを示す一方で、現行Domain・seed・repositoryがリーグ内の埋め込み `rule` を使うこと、認証文書がJSON bodyを示す一方で実装が `x-id-token` を読むこと、Firestore Rulesが全許可であること、`user_stats` のseedキーとrepositoryの自動IDが異なることである。

## 調査対象

| 対象 | 確認した資料 | 設計への影響 |
|---|---|---|
| プロジェクト方針 | `.kiro/steering/roadmap.md`, `backend-foundation/brief.md` | BE正本を先に固定し、後続BE/FEへ契約を引き渡す |
| 実装 | `backend/src/domain`, `backend/src/application`, `backend/src/infrastructure/firestore`, `backend/src/presentation` | 既存の層構成とDTOを活かし、mapperとHTTP境界を正本化する |
| 永続定義 | `backend/docs/firestore.yaml`, `backend/firestore.indexes.json`, `backend/firestore.rules` | snake_case、埋め込みrule、複合index、Rulesの再定義が必要 |
| 公開契約 | `backend/docs/api-design.md`, `backend/docs/api-reference.md`, `backend/docs/auth-design.md`, `backend/src/presentation/openapi.ts` | runtime/staticドキュメントと実装の同時更新が必要 |
| 基準データ | `backend/src/scripts/seedFirestore.ts` | seedを独立スキーマにせず正本契約の検証入力にする |

## 主要な発見

1. `LeagueDetail`、`LeagueRepository`、league schema、seedは `rule.gameType/uma/oka` をリーグ文書へ埋め込む構造で一致している。旧 `rules` コレクションを正本として残す根拠は現在のbriefにない。
2. `POST /api/auth/session` は実装上 `x-id-token` ヘッダーを必須とし、通常の保護APIは `jongbo_session` Cookieを検証するべきだが、middlewareは保護APIでも `x-id-token` を受け付けている。交換専用に制限する。
3. `user_stats` repositoryは複合whereで自動ID文書を検索し、seedは `overall_{userId}`、`league_{leagueId}_{userId}`、`season_{leagueId}_{seasonId}_{userId}` の決定的IDを使う。一意性契約を明示して書き込み方式とindexを揃える必要がある。
4. `firestore.indexes.json` はmembersのcollection group indexだけで、`firestore.rules` は全ドキュメントのread/writeを許可している。API-only構成の本番では直接アクセス拒否を初期方針にする。
5. Honoの `AppType` はすでに `createApp` から推論できる。別の手書きAPI型を増やさず、route schema、response envelope、OpenAPIを同じ契約検証で保つ方がFE連携に適する。
6. ユーザー確認により、`rule.uma` は三麻では非null3値、四麻では4値の合計を厳密に0とするBE不変条件を追加する。FEは同じ対象値を表示検証し、点数計算は `uma` を自動補正せず、`oka` とraw scoreの不変条件を分離して扱う。

## 設計判断

### 正本の選択

- 採用: リーグ文書内の `rule` を正本とし、保存はsnake_case、Domain/APIはcamelCaseとする。
- 却下: 独立 `rules` コレクションを追加してリーグから参照する方式。briefの明示方針と現行Domain/seed/API DTOに反し、二重更新を生む。

### 認証方式

- 採用: session交換時だけ `x-id-token`、保護APIは `jongbo_session` HttpOnly Cookie。
- 採用理由: `auth-design.md` のCookie方針、FEのsame-origin/CORS要件、Next middlewareの存在が一致する。

### Rule invariant

- 採用: League create/updateの永続化前に `rule.uma` の合計0を検証し、違反は `validation_error` とfield/expected/actual detailsで拒否する。
- FEはBEの権威性を置き換えず、同じ三麻・四麻判定を入力表示時にミラーする。
- `uma` はrank bonusのゼロサム成分、`oka` は別補正、raw score合計は別の点数計算前提とする。無効なumaの丸め・再配分は行わない。

### 一意性と移行

- 採用: `user_stats` の論理キーを `userId + scopeType + (leagueId|seasonId)` とし、新規書き込みは決定的文書IDへ寄せる。
- 既存の自動ID文書を無承認で削除・改名しない。バックアップと互換読み取りまたは承認済みbackfillをリリース前条件にする。

### build vs adopt

- 既存のHono route、Zod validator、Firebase Admin SDK、Firestore repositoryを採用し、独自HTTPフレームワークや独自認証トークンを追加しない。
- 契約検証は既存TypeScript環境で実行可能なNode test/tsxを利用する想定とし、新規テストフレームワークは導入しない。

## リスクと緩和策

- rule変更後の既存Match再計算は本仕様では決めず、`backend-integrity-lifecycle` の開始条件として明示する。
- 既存 `user_stats` の自動IDが残る場合は重複し得るため、データ検査を先に行い、canonical keyが一意であることを確認してから切り替える。
- Rulesを直接拒否にすると、将来FEがFirestore SDKを直接使う場合に動かなくなる。直接アクセスを導入する場合は認可行列を別仕様で定義する。
- OpenAPIを手書きで更新し続けると再び差異が生じるため、route schemaと契約テストで差分を検出する。

## 未解決だが本仕様を阻害しない事項

- Match作成後のrule更新可否と履歴のrule固定は後続BE仕様で決める。
- `scoreCalculation` は現行の公開Domain/API契約に含まれないため本仕様では採用しない。可変丸め方式を導入する場合は要件を再開する。
- productionでの既存データ移行手順は、データ量とバックアップ運用を確認した別計画で決める。
