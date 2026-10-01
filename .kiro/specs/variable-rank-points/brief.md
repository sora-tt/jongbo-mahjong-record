# Brief: variable-rank-points

## Problem

リーグ管理者は、現在の固定ウマとオカだけでは、終局時の浮き人数に応じて順位点が変わるルールをリーグに設定できない。日本プロ麻雀連盟公式ルールの説明では、この種の配点は「浮き沈み方式」の順位点として説明されている。一般的な「変動式ウマオカ」より、画面・仕様では「浮き人数別順位点」と呼ぶ。

## Current State

League rule は `gameType`、固定4順位分の `uma`、`oka` を持つ。BEの `calculateMatchPoints` は素点から順位を決め、固定umaとokaからpointを計算する。League作成・編集画面も固定umaの入力のみを提供する。既存League文書にはumaのmode識別子がない。

## Desired Outcome

四麻リーグで固定順位点か浮き人数別順位点を選択できる。浮き人数別の場合、返し点を超える終了素点を持つ人数に応じた1〜4位の順位点を使ってBEがpointを計算し、FEはルールを設定・表示する。既存の固定ルールと既存Match結果は変化しない。

## Approach

固定順位点と浮き人数別順位点を区別し、0〜4人分の順位点テーブルをLeague ruleに保持してBEが計算する。提示テーブルを初期値としてリーグごとに編集可能にする。浮き人数は各参加者のraw scoreが `oka.returnPoints` を厳密に上回る人数とする。オカは現在と同様に別計算とする。

## Scope

- **In**: yonmaの固定/浮き人数別モード、0〜4人別の編集可能な順位点テーブル、BEの決定的計算と入力検証、FEの作成/編集/詳細表示、既存ruleの後方互換。
- **Out**: sanmaの浮き人数別テーブル、個別Matchのルール上書き、既存Matchの再計算・一括移行。

## Boundary Candidates

- League ruleの保存/API契約と既存データ読み取り互換。
- raw scoreから順位点・オカを合成するBE計算。
- League ruleを編集・閲覧するFE画面。
- Match/Season/Leagueの既存集計と過去結果の保持。

## Out of Boundary

- 連盟公式ルール全体のプリセット化（点数、役、局進行など）。
- 三麻の浮き人数別順位点。
- 既存Matchや集計済み履歴の書き換え。

## Upstream / Downstream

- **Upstream**: `backend-foundation` のLeague rule/API/storage契約、`backend-integrity-lifecycle` のMatch計算・rule lock、`frontend-league-season` のLeague作成・編集・詳細。
- **Downstream**: `frontend-session-match` のMatch結果表示、`frontend-statistics-quality` の既存BE集計表示。FEで順位点を再計算しない。

## Existing Spec Touchpoints

- **Extends**: `backend-foundation`、`backend-integrity-lifecycle`、`frontend-league-season`。
- **Adjacent**: `frontend-session-match`、`frontend-statistics-quality`。

## Constraints

- FEはBEが返すrank/pointを正本として表示する。
- 現在のMatch登録開始後のLeague rule lockを維持する。
- 日本プロ麻雀連盟は[公式解説](https://www.ma-jan.or.jp/class_2/35023.html)で「浮き沈み方式」の順位点と表現し、提示された1〜3人浮きの配点を掲載している。画面名称は機能が伝わる「浮き人数別順位点」とする。
- ISSUE #98の例に従い、0人浮き・4人浮きは全員0、浮き判定は返し点を厳密に超えた場合とする。
