# 調査ログ: frontend-session-match

## Summary

ISSUE-99のMatch入力は、チョンボeventと卓外供託を別々に編集し、AppTypeのMatch契約へ渡す。現行画面には共通の`match-form.ts`と`MatchForm.tsx`があるため、raw score行の後へ小さな入力群を加えられる。供託UIはLeague ruleで許可された場合だけ表示し、点数計算はBEに委ねる。

## 調査対象

| 対象 | 確認した資料・実装 | 設計への影響 |
|---|---|---|
| Issue/PR基準 | [Issue #99](https://github.com/sora-tt/jongbo-mahjong-record/issues/99)、[PR #104](https://github.com/sora-tt/jongbo-mahjong-record/pull/104) | PR #104の既存Match UI・uma基準を引き継ぎ、既存見た目を保つ |
| Form state/validation | `frontend/src/features/session-match/model/match-form.ts` | rawScore total validationとpayload mappingにevent/countを追加 |
| Match UI | `frontend/src/features/match/ui/MatchForm.tsx`, `MatchList.tsx` | 既存の席別raw score行の後と展開詳細にだけ追加 |
| Rule source | League/Season hookが返すLeague rule、`frontend/src/features/league/model/rule-draft.ts` | `allowOffTableKyotaku`と罰符をLeague ruleから受け取る。FE内に別設定を持たない |
| BE calculation | `backend/src/domain/shared/scoring.ts`, `.kiro/specs/backend-integrity-lifecycle/design.md` | kyotaku棒数だけraw total期待値を調整し、chombo penaltyはBE点数結果の後段で適用 |

## 主要な発見と設計判断

- `MatchForm`は`initial`/`additional`/`edit`共通で、既存raw score入力を100点単位の文字列として保持する。新fieldも同じform valuesへ追加し、Match editではresponse DTOから初期化する。
- チョンボは発生回数入力と発生者選択を別々の不整合値にせず、1発生=1行の配列で表現する。行の重複userIdを許すため、同一ユーザーの複数回発生を個別に記録できる。
- 卓外供託は「あり/なし」と正の棒数をform stateに持たせる。ruleでfalseならcontrolを一切表示し、送信時は0本とする。raw score合計のFE事前検証だけが`startingPoints × playerCount - 1000 × count`を利用する。
- chomboはraw score、rank、PR #104のfloatingCountに影響させず、FEは罰符適用やpoint totalを計算しない。BE responseを再取得して結果詳細へ表示する。
- 承認済みRequirement 4.4はMatch editで変更する入力をplayedAt/rawScoreに限定しているため、edit modeでは外卓項目をread-only表示してPATCHで省略し、BEの更新省略時保持契約を利用する。chombo/供託の入力欄は初回・追加Matchの記録に適用する。
- `MatchForm`既存コンテナ、タイポグラフィ、色、ボタン配置を維持し、外卓欄を既存UIに沿って追加する。新画面、共通UI primitive、外部依存は不要。

## リスク

- League ruleのlegacy fallbackが`allowOffTableKyotaku=false`なら、既存Match画面の供託欄は表示されない。対象Leagueの有効化はrule lockに従い別途運用判断する。
- PR #104前のdevelopへ差分を移す場合、共通form・raw score validation・ruleの型を再baseする必要がある。
- `.kiro/settings/templates/specs/design.md`と`research.md`はリポジトリにない。既存specの構成を参考に記録した。
