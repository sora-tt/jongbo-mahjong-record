# Brief: frontend-statistics-quality

## Problem

個人成績、順位表、日次記録、ポイント推移が旧型やmock、手書きresponseに依存している。また、画面移行後も旧domain型、Redux、重複hooks、不要コンポーネントが残ると、コードの二重化とバグが再発する。

## Current State

Seasonにはstandings、pointProgressions、seasonRecordsがあり、user_stats APIも存在する。一方、FEにはmock fallback、手書きfetch、旧domain型、Redux、重複UIが残る。チャートの色指定、nullable項目、空データの扱いも統一されていない。

## Desired Outcome

統計画面がBEの `user_stats`、season standings、point progressionsを正しく表示し、FEで再集計しない。画面移行後に不要な旧型・mock・Redux・重複コードを削除し、型チェック・Lint・契約テスト・主要画面スモークテストで回帰を検知できる。

## Approach

統計の取得と表示modelをfoundationのAPI境界に合わせ、ランキング・日次記録・チャートを共通UIで整理する。その後、参照箇所を確認しながら旧型、mock、Redux、重複hooks・コンポーネントを削除し、route・metadata・認証ガードも横断確認する。

## Scope

- **In**:
  - 個人成績、season standings、日次記録、point progression
  - season/league records表示
  - 三麻/四麻のnullable項目、0件、未計算の表示
  - mock fallbackと手書き型の除去
  - 旧 `src/types/domain`、不要Redux、重複hooks/componentsの整理
  - import、React.FC、Prettier/ESLint、route、metadataの統一
  - API契約テスト、unit test、主要画面スモークテスト
- **Out**:
  - BE側の新しい統計指標
  - FEでの集計アルゴリズム
  - リアルタイムチャート
  - 新機能の追加

## Boundary Candidates

- stats API hooksと表示model
- ranking/table/chart表示
- nullable/empty data handling
- legacy retirementとquality gates

## Out of Boundary

- 集計値の正しさは `backend-integrity-lifecycle` が担当する。
- 共通Table/Card/Chart primitiveは `frontend-foundation-ui` を利用する。
- 画面固有のCRUDは前段の画面仕様で完了させる。

## Upstream / Downstream

- **Upstream**: `backend-integrity-lifecycle`、`frontend-foundation-ui`、`frontend-league-season`、`frontend-session-match`
- **Downstream**: 本リファクタ計画の完了後の通常開発

## Existing Spec Touchpoints

- **Extends**: なし
- **Adjacent**: `frontend/src/app/stats/`、season detail、`frontend/src/types/`、`frontend/src/mocks/`、`frontend/src/store/`

## Constraints

BEから返らない値を仮の0として埋めて意味を変えない。削除は参照調査後に行い、ユーザーが使う画面を壊さないことを優先する。
