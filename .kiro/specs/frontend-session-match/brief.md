# Brief: frontend-session-match

## Problem

初回対局画面と追加対局画面で、点数入力、順位表示、参加者切替、submit処理が重複している。三麻・四麻制約やBEの検証と画面の許容範囲も一致していない。

## Current State

Player select、Session作成、Match作成・編集、結果表示の画面が存在する。ページhookとUIに似たロジックが分散し、旧domain型やmockが残っている。BEは点数・順位を計算するが、FE側にも計算や入力前提が残っている。

## Desired Outcome

Session参加者選択からMatch登録・編集・結果確認までを一貫したフローにする。FEはBEが定義した人数・wind・点数制約をフォームへ反映し、登録後はBEの計算結果を表示する。

## Approach

SessionとMatchのAPI hooks、入力フォーム、結果表示、再取得処理をfeature内に整理する。初回・追加・編集を共通フォームへ寄せ、optimistic updateを避けてmutation成功後に再取得する。

## Scope

- **In**:
  - Player select
  - Session作成・一覧・詳細
  - Match作成・編集・一覧・詳細
  - 三麻/四麻、wind、raw scoreの入力制約
  - BE計算済みrank/pointの表示
  - 未実装ボタンとAPI errorの修正
  - 初回/追加/編集フォームの共通化
- **Out**:
  - 点数計算ロジックのFE実装
  - 複数端末同時編集への対応
  - 新しいゲームルールの追加

## Boundary Candidates

- participant selection
- session lifecycle
- match input/edit
- match result presentation

## Out of Boundary

- 試合整合性と計算は `backend-integrity-lifecycle` が担当する。
- 統計グラフと旧コード削除は `frontend-statistics-quality` が担当する。
- 共通フォーム部品は `frontend-foundation-ui` を利用する。

## Upstream / Downstream

- **Upstream**: `backend-integrity-lifecycle`、`frontend-foundation-ui`、`frontend-league-season`
- **Downstream**: `frontend-statistics-quality`

## Existing Spec Touchpoints

- **Extends**: なし
- **Adjacent**: `frontend/src/app/league/**/sessions/`、`frontend/src/app/league/**/matches/`、関連hooks/components

## Constraints

raw score、rank、point、累計値の正しさはBEを信頼する。送信中の二重submitを防止し、削除や更新後は必ず再取得する。
