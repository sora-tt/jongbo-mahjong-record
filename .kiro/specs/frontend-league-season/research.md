# 調査ログ: frontend-league-season

## Summary

ISSUE-99のLeague rule編集・表示をPR #104のuma modelへ追加する。既存コードは`rule-draft.ts`、`league-rule-editor.tsx`、`league-rule-summary.tsx`へ入力・表示がまとまっており、FE API型はBE契約から取得できる。今回はLeague ruleの新fieldだけを既存UIへ足し、Match入力は下流の`frontend-session-match`へ渡す。Issue #123では作成者の既定表示、連続メンバー追加、League/Season suffix、Header navigation dataも既存feature境界へ追加する。

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

## ISSUE-123 追加調査（2026-10-05）

### 拡張点と確認した実装

- League rule draft、editor、summary、新規/編集hookが既存の入力・表示・payload境界である。backend-foundationに追加するrotateSeatOrderを同じtyped LeagueRuleへ通す。
- `LeagueService.createLeague`は`ownerUserId`と入力member IDをSetで一意化してownerを自動追加する。UIではcreatorを固定選択表示し、memberUserIdsへ重複送信しない形が既存契約に合う。
- create/edit hookのmember追加handlerは現在検索queryと候補を消す。handlerからclearを外し、追加済みIDだけを候補結果から除けば複数人を続けて選択できる。
- League/Seasonの名前欄はstemとsuffixを分けて描画できる。APIへはtrim後にsuffixを一度だけ付けた正規名を送る。編集時は保存名からsuffixを除いてstemを復元する。
- HeaderにはLeague list APIが利用でき、Leagueを開いた時だけ既存Season list APIを呼べる。League navigation用データはfeature hookからfoundationの汎用modelへ渡し、Header本体はfrontend-foundation-uiが所有する。

### 麻雀用語と設定表示

- 日本プロ麻雀連盟の用語説明は「連荘」を親が連続することとしており、席の繰り返し割当の意味とは別である。[日本麻雀連盟・基礎用語](https://www.nihon-majan.org/majyankisoyougo.html)
- 日本麻雀連盟の規定とFFXIVドマ式麻雀の説明は、東・南・西・北の席名を順に割り当てることを説明している。[日本麻雀連盟・規定](https://www.nihon-majan.org/arusiarumajyanruru.html)、[FFXIV ドマ式麻雀](https://jp.finalfantasyxiv.com/lodestone/playguide/contentsguide/goldsaucer/doman-mahjong/)
- UI名称は「連荘」や「東南戦」と混同しない「連戦時に座順をローテーション」とし、選択値はbooleanにする。既存対局後はLeague rule lockが変更を防ぐ。

### 設計判断とリスク

- build vs adopt: 追加依存は使わず、既存Feature API、rule draft、検索hook、Header navigation contractを拡張する。
- navigation season listはLeagueを展開した時に個別取得するため、全League分のAPIを初期表示時に一斉発行しない。失敗は対象League nodeで表示してその一覧だけ再試行する。
- CreatorのID・追加memberの扱いは現行BE owner auto-addと一致させる。BEがowner追加契約を変えた場合はcreate UIとpayloadを再検証する。
- suffix処理はcreate/editの両方で適用し、既存の末尾重複も保存時に一つへ正規化する。
