# 調査ログ: frontend-league-season

## Summary

ISSUE-99のLeague rule編集・表示をPR #104のuma modelへ追加する。既存コードは`rule-draft.ts`、`league-rule-editor.tsx`、`league-rule-summary.tsx`へ入力・表示がまとまっており、FE API型はBE契約から取得できる。今回はLeague ruleの新fieldだけを既存UIへ足し、Match入力は下流の`frontend-session-match`へ渡す。

## 調査対象

| 対象 | 確認した資料・実装 | 設計への影響 |
|---|---|---|
| Issue/PR基準 | [Issue #99](https://github.com/sora-tt/jongbo-mahjong-record/issues/99)、[PR #104](https://github.com/sora-tt/jongbo-mahjong-record/pull/104) | チョンボ罰符・卓外供託可否をLeague ruleへ加え、fixed/floatingCount umaとrule lockを維持 |
| Rule draft | `frontend/src/features/league/model/rule-draft.ts` | create/editの共通draftとtyped payload mappingを拡張 |
| Rule UI | `frontend/src/features/league/ui/league-rule-editor.tsx`, `league-rule-summary.tsx` | 既存control/summaryに小さく追加し、画面再構成を避ける |
| Rule source | `backend/src/domain/league/types.ts`, `.kiro/specs/backend-foundation/design.md` | camelCaseのBE DTOとPR #104 discriminated unionを正本として参照 |
| 編集境界 | `.kiro/specs/backend-integrity-lifecycle/design.md` | 最初の正本Match後は追加fieldを含む全ruleがlockされる |

## 主要な発見と設計判断

- League create/editはすでにumaとokaを一つのrule draftから送るため、追加fieldも同じpayload内に含められる。新しいAPI wrapperや依存packageは不要。
- `chomboPenaltyPoints`はpoint単位の0以上整数、`allowOffTableKyotaku`はbooleanとして入力し、League detailで値を表示する。FEは値を計算せず、API型へ変換する。
- 新fieldは既存rule editor末尾と既存summaryへ足す。既存のmain/PR #104のレイアウト、入力部品、余白を維持し、Match画面用のcontrolをこのspecへ持ち込まない。
- 旧League responseにfieldがない場合の0/false defaultはBE mapperの責務である。FE adapterが推測でDTOを書き換えず、正規化済みのAPI値からdraftを作る。

## リスク

- legacy Leagueにfieldがなくても既存Matchのrule lock後は0/falseから変更できない。設定移行が必要な既存Leagueは、本番データ運用の承認済みmigration計画で扱う。
- PR #104前のdevelopへ適用する場合、rule editorとdraftのuma mode/型が異なる可能性があるため、PR #104 headを基準に再確認する。
- `.kiro/settings/templates/specs/design.md`と`research.md`はリポジトリにない。既存specの設計書構成に沿って記録した。
