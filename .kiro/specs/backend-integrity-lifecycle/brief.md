# Brief: backend-integrity-lifecycle

## Problem

Session・Matchの入力制約、三麻/四麻、順位・点数、match indexの整合性と、試合後の集計・削除ライフサイクルが複数箇所に分散している。途中失敗や削除後に、画面ごとに異なる集計を表示する可能性がある。

## Current State

点数と順位はBEで再計算されるが、Sessionの重複・人数・gameTypeとの関係が十分に検証されていない。match indexは最大値+1で同時登録に弱い。試合登録後のseason、league、session、user_stats更新は独立writeで、Season/League削除やactive season変更後の再集計も不足している。

## Desired Outcome

同じ入力に対して常に同じ試合結果になり、同時登録や不正な参加者でデータが壊れない。試合、Session、Season、Leagueの作成・更新・削除後に、派生集計とuser_statsが整合する。失敗時に再実行できる。

## Approach

Sessionの意味を固定し、三麻/四麻とMatch参加者の許容範囲を明文化する。順位・pointはraw scoreからBEが決定する。正本matchと派生aggregateを分け、Transaction/Batchまたは冪等なrebuild/repairを用いて、登録・更新・削除・active season・member/rule変更の影響を管理する。

## Scope

- **In**:
  - Session人数、重複、所属、gameType検証
  - Match参加者、wind、raw score、rank、point検証
  - match index競合対策
  - season/league/session/user_statsの集計更新
  - 削除後の再集計、active season、stale stats cleanup
  - Transaction/Batch、冪等性、repair/rebuild
  - gameplay・aggregate integration test
- **Out**:
  - Firestoreフィールドや認証契約の再設計
  - FE入力フォーム・統計画面
  - 新しい統計指標やルールマスタ
  - 複数端末同時編集の本格対応

## Boundary Candidates

- Session/Match validation
- scoringと同点処理
- 正本matchと派生aggregate
- 削除・再集計・repair

## Out of Boundary

- API DTOや認証は `backend-foundation` が担当する。
- FEはBEの計算結果を表示し、同じ計算を複製しない。

## Upstream / Downstream

- **Upstream**: `backend-foundation`
- **Downstream**: `frontend-foundation-ui`、`frontend-session-match`、`frontend-statistics-quality`

## Existing Spec Touchpoints

- **Extends**: なし
- **Adjacent**: `backend/src/domain/shared/scoring.ts`、`backend/src/domain/shared/aggregation.ts`、`backend/src/application/services/`、`backend/src/infrastructure/firestore/repositories/`

## Constraints

既存の点数計算結果を不用意に変えない。三麻、四麻、同点、重複、合計点不一致、同時登録、削除後再集計をテスト対象にする。既存データを失わない。
