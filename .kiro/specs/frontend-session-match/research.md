# 調査ログ: frontend-session-match

## Summary

ISSUE-99のMatch入力は、チョンボeventと卓外供託を別々に編集し、AppTypeのMatch契約へ渡す。現行画面には共通の`match-form.ts`と`MatchForm.tsx`があるため、raw score行の後へ小さな入力群を加えられる。供託UIはLeague ruleで許可された場合だけ表示し、点数計算はBEに委ねる。Issue #123ではSession終了成功後のSeason遷移と、最大matchIndexの保存済みseat assignmentを基準にする追加Matchの座順rotationを既存routeへ接続する。Issue #150ではSeason詳細のSession一覧に削除確認を追加し、既存のcascade削除APIの後に一覧とSeason集計を再取得する。

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

## ISSUE-123 追加調査（2026-10-05）

### 拡張点

- Session終了actionは`frontend/src/app/league/[leagueId]/season/[seasonId]/sessions/[sessionId]/results/hooks/index.ts`にあり、成功後に同routeのloadを呼んでいる。route paramsからSeason detail pathを構成できるため、更新成功後に遷移先を差し替えられる。
- 追加Match hookはLeague detailとSession detailを読み、members配列順を初期seat assignmentに使う。Match listは別APIから取得可能で、最大matchIndexの実windを次の初期値に使える。
- Match DTOのresultsには保存済みの各userId/windがある。rotation用API fieldや座順の別正本は不要。既存の新規フォームseat selectorで利用者の保存前修正を保持できる。
- Match editはseat assignment read-onlyのため、要件の手修正は追加Match formでのPOST前に限定する。次回はPOSTで保存されたwindから回転し、未保存draftは参照しない。

### 麻雀用語調査

- 検索した日本麻雀連盟用語説明では「連荘」は親が連続すること、一荘は東南西北の四風戦が一巡することと説明される。この設定は一荘戦の場風進行や連荘処理を変えない。[日本麻雀連盟・基礎用語](https://www.nihon-majan.org/majyankisoyougo.html)
- 日本麻雀連盟の規定とFFXIVのドマ式麻雀説明は、席風を東・南・西・北の順で割り当てることを記述している。[日本麻雀連盟・規定](https://www.nihon-majan.org/arusiarumajyanruru.html)、[FFXIV ドマ式麻雀](https://jp.finalfantasyxiv.com/lodestone/playguide/contentsguide/goldsaucer/doman-mahjong/)
- 対局間でプレイヤーの席風を1つずらす操作には統一された競技用語を確認できなかったため、UIは説明的な「座順ローテーション」とする。「連荘」は親継続の意味なのでラベルには使わない。

### 設計判断

- 採用: 同SessionのMatch配列からmatchIndex最大値を選ぶ。playedAtと配列順に依存しないため、削除後のindex gapや時刻同値でも直前対局を決定できる。
- 採用: yonmaは東→南→西→北→東、sanmaは東→南→西→東にseat windを1段移す。前Matchの結果が保存正本で、userが新formで修正し保存した場合は、その修正後結果を次回rotationの基準とする。
- 採用: DTOのwind集合が不正ならmembers順で黙って補わず、契約エラーを表示する。無効設定またはMatchなしの場合のみ既存members順の初期値を使う。
- Session endの更新が成功した時だけSeason detailへ遷移する。失敗時は現在routeでerrorとretryを示す。

## ISSUE-150 Session削除調査（2026-10-18）

### 調査対象

| 対象 | 確認した資料・実装 | 設計への影響 |
|---|---|---|
| Season detail UI | `frontend/src/app/league/[leagueId]/season/[seasonId]/page.tsx`、`hooks/index.ts` | Session行は結果画面へのLinkで、hookがSeason・Session一覧・League名を取得する。hook/pageに削除対象と再取得状態を追加する |
| Session Feature API | `frontend/src/features/session/api/index.ts` | 型付きの`deleteSession({ leagueId, seasonId, sessionId })`が既にあり、`204`を扱う。互換性のある削除wrapperを再利用する |
| Backend lifecycle | `backend/src/presentation/routes/sessions.ts`、`.kiro/specs/backend-integrity-lifecycle/design.md` | DELETE routeはSessionと配下Matchの削除後にSeason/League/overall集計を再構築する。BE変更は不要 |
| 確認ダイアログ | `frontend/src/app/league/[leagueId]/season/[seasonId]/sessions/[sessionId]/results/page.tsx` | Match削除にinline `role="dialog"`、キャンセル、送信中disableの既存パターンがある。共通Dialog導入は不要 |

### 設計判断

- 採用: 削除対象Sessionの開始日時、参加者名、対局数と配下Matchの削除を確認画面に表示する。確認前にmutationを行わず、キャンセルは対象を一覧に残す。
- 採用: Season detailの結果画面Linkと削除buttonは兄弟要素にして、Link内へbuttonをネストしない。
- 採用: 既存の`deleteSession` typed wrapperを利用し、Session削除専用のAPI層や新しいUI primitiveを作らない。Hookが対象・mutation・safe error状態を持つ。
- 採用: DELETE成功時にSession listとSeason detailを再取得する。失敗時もsafe errorを保ったまま両方を再取得し、対象が残る場合は再確認から再試行を許す。再取得後に対象が消えていれば確認対象を解除し、DELETEの結果を成功扱いに変換しない。
- 境界: 初回Match作成失敗時のrollbackは、その同じ送信内で作成されたSessionのみが対象。Season detailの削除操作は必ず利用者確認を通り、既存のBE cascade契約に委譲する。

### Synthesis

- Generalization: 削除後の再取得はSession一覧とSeason detailに限定した既存のload責務であり、Session全般の削除フレームワークへ一般化しない。Requirement 2.10/2.11の必要範囲だけをhookへ追加する。
- Build vs. adopt: API、Auth、共通error処理、inline confirmation patternを再利用する。新規依存、BE route、共有Dialog primitiveを導入する理由はない。
- Simplification: route hook/pageへ削除対象・確認・再取得を加えるだけにし、新しいfeature hookや共通mutation層を作らない。削除操作とrollbackは同一API wrapperを共有するが、呼出元の状態・確認方針を分ける。

### リスク

- cascade削除や集計再構築が失敗した場合、BEは標準エラーを返す。FEは成功扱いにせず、エラーを残して一覧・Seasonの現状を読み直す。削除後の再構築失敗に対するrepair処理はBEの既存責務である。
- `.kiro/settings/templates/specs/design.md`と`research.md`がリポジトリになく、既存specの構成を維持して追記した。
