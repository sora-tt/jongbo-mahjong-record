# Brief: frontend-foundation-ui

## Problem

FEにはBE由来のAPI型、旧domain型、mock型、手書きresponse型が併存し、API client、認証、エラー処理、フォルダ構成、UIコンポーネントにもばらつきがある。Button、Input、Table、Card、Header、Loading/Errorの見た目もページごとに異なる。

## Current State

一部APIはHono RPCの `AppType` を利用するが、統計などには手書きfetchと手書き型が残る。`src/types/domain`、Redux、mock、個別Tailwind classが混在し、Headerやnavigation、route、Chartの色指定にも不整合がある。

## Desired Outcome

BE APIを正としてFEの型・API client・adapter・認証・エラー処理を統一し、新しい画面を同じfeature構成で追加できる。共通UIとデザイントークンが統一され、ページ固有実装との境界が明確になる。

## Approach

API境界とUI基盤を一つの段階で整備する。Hono RPC/API DTOを基準に共通client、ApiError、認証redirect、loading/error hooks、ID・日時型を整理し、その上にButton/Input/Select/Card/Table/Headerなどの共通UIを再構成する。

## Scope

- **In**:
  - API client、response/error型、adapter方針
  - 認証状態、middleware、401処理
  - featureフォルダ、import、命名規約
  - Tailwindデザイントークン
  - Button、Input、Select、Card、Table、Loading、Error、EmptyState
  - Header、navigation、AuthFormShell
  - 共通UIへの既存ページ置換
- **Out**:
  - 個別画面の業務ロジック
  - BE APIの仕様変更
  - 旧型・mockの完全削除

## Boundary Candidates

- API clientとfeature API
- auth/error/loading共通処理
- UI primitivesと複合UI
- layout/navigationとページ固有UI

## Out of Boundary

- 画面固有のCRUDやMatch入力は後続FE仕様が担当する。
- BEの正しさはBE仕様が担当する。

## Upstream / Downstream

- **Upstream**: `backend-foundation`、`backend-integrity-lifecycle`
- **Downstream**: `frontend-league-season`、`frontend-session-match`、`frontend-statistics-quality`

## Existing Spec Touchpoints

- **Extends**: なし
- **Adjacent**: `frontend/src/lib/api/`、`frontend/src/types/`、`frontend/src/store/`、`frontend/src/components/`、`frontend/src/app/layout.tsx`

## Constraints

APIレスポンスをFEで再計算しない。mockを本番fallbackにしない。共通化のために過剰な汎用propsを作らず、アクセシビリティとdisabled/loading状態を共通仕様に含める。
