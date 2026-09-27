# Brief: backend-foundation

## Problem

Firestore定義、API設計、認証設計、実装、seed、Swaggerの正本が一致していない。特に `rules` コレクションを前提とする文書と、リーグ内に `rule` を埋め込む実装が併存している。認証もJSON bodyの `idToken` と `x-id-token` ヘッダーが混在している。

## Current State

現行BEはHono、Zod、Firebase Admin、Firestoreを使い、基本CRUDと `{ data }` / `{ error }` レスポンスを実装している。しかしFirestore schema、runtime OpenAPI、Swagger、API reference、auth designに差異がある。`user_stats` の一意性や複合index、Firestore Rulesも本番利用を前提に確定していない。

## Desired Outcome

DB保存型、Domain型、API DTO、認証方式、エラー形式、OpenAPI、Swagger、seedが同じ契約で動作する。FEが一つのAPI clientと型を信頼して実装できる。

## Approach

現行実装を活かし、当面はリーグ内に `rule` を埋め込む方式を正本とする。session交換時だけ `x-id-token` を使い、交換後の保護APIは `jongbo_session` Cookieを使う方針を基本とする。Firestore保存はsnake_case、API DTOはcamelCaseに統一し、ID・統計一意キー・index・Rules・seedも同じ正本から整備する。

## Scope

- **In**:
  - Firestoreコレクション・フィールドの正本化
  - `rule` 保存方式、ID、member、user_stats一意性の確定
  - index、seed、Emulator/本番Rulesの整合
  - session認証、Cookie、CORS、middleware
  - API DTO、成功・エラー・204レスポンス
  - OpenAPI、Swagger、API reference、auth design
  - Hono RPC型と契約テストの方針
- **Out**:
  - 試合点数計算や集計アルゴリズム
  - FEの型・画面移行
  - 新しいルールマスタ機能
  - 既存本番データの無計画な移行

## Boundary Candidates

- Firestore正本とRepository mapper
- 認証ライフサイクル
- HTTP DTO・エラー・ステータス
- ドキュメント・seed・index・Rules

## Out of Boundary

- Session/Matchの業務制約と集計更新は `backend-integrity-lifecycle` が担当する。
- FEのAPI adapterと共通UIは `frontend-foundation-ui` が担当する。

## Upstream / Downstream

- **Upstream**: 現行Firestore repository、Hono routes、Firebase Auth、`backend/docs/`
- **Downstream**: `backend-integrity-lifecycle`、`frontend-foundation-ui`

## Existing Spec Touchpoints

- **Extends**: なし
- **Adjacent**: `backend/docs/`、`backend/src/presentation/`、`backend/src/infrastructure/firestore/`、`docs/swagger/`

## Constraints

認証情報をログへ出さない。本番Rulesを全許可にしない。既存データがある場合はバックアップと移行方針を先に定め、破壊的変更を実行しない。
