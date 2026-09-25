# Brief: frontend-league-season

## Problem

リーグ・シーズン画面ではAPIモデルと旧mockモデルが混在し、CRUDの一部や編集ボタンが未接続になっている。ページごとにfetch、状態、エラー、フォーム処理が重複している。

## Current State

ホーム、リーグ作成・詳細・編集、シーズン作成・詳細・編集が存在する。シーズン編集にはmock依存やconsole出力だけのsubmitが残り、active season表示もBEキャッシュの更新タイミングに依存する。

## Desired Outcome

リーグ・シーズンの一覧、詳細、作成、編集がBE APIと一致し、未接続ボタンがなくなる。共通UIとfoundationの型・エラー処理を利用し、mockを実運用のfallbackにしない。

## Approach

リーグとシーズンを一つのfeature領域として、API hooks、forms、display components、route pageを整理する。BEの `rule`、member、active season、standingsをそのまま扱い、編集後は再取得して派生値を表示する。

## Scope

- **In**:
  - ホームのリーグ一覧
  - リーグ作成・詳細・編集
  - シーズン作成・一覧・詳細・編集
  - API未接続ボタンとconsole出力の修正
  - mock依存の除去
  - empty/loading/error状態
- **Out**:
  - Session・Match入力
  - 統計チャートの詳細
  - 新しいメンバー管理仕様の追加

## Boundary Candidates

- league API/UI
- season API/UI
- form validationとsubmit
- active season/standing表示

## Out of Boundary

- BEのactive season整合性は `backend-integrity-lifecycle` が担当する。
- 共通UIは `frontend-foundation-ui` を利用する。

## Upstream / Downstream

- **Upstream**: `backend-foundation`、`backend-integrity-lifecycle`、`frontend-foundation-ui`
- **Downstream**: `frontend-session-match`、`frontend-statistics-quality`

## Existing Spec Touchpoints

- **Extends**: なし
- **Adjacent**: `frontend/src/app/` のleague/season配下、league/season components

## Constraints

BEの派生値をFEで再計算しない。APIに存在しない更新機能は勝手にmockで実装せず、未対応として明示するか、別途BE仕様へ追加する。
