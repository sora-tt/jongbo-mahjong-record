# 要件定義: backend-integrity-lifecycle

## プロジェクト説明

BEを利用するFE実装者、運用者、対局記録を扱う利用者は、Session・Match の入力制約、点数・順位、試合後の集計、削除後の状態が複数のサービスと画面で異なるため、同じ対局を登録しても表示や個人成績が一致しないリスクを抱えている。現行BEは点数計算と基本CRUDを持つが、Sessionの固定参加者、三麻・四麻、同時登録時のmatch index、active season、削除後の集計、user_statsの重複・stale record、途中失敗からの復旧を一つのライフサイクルとして保証していない。この仕様では、backend-foundation が定めた DB/API/auth 契約を再定義せず、Session・Matchを正本として決定的な点数計算と冪等な派生集計・削除・repair/rebuildを提供する。

## スコープと境界

### 対象

- League rule に対応した Session の人数、メンバー、wind、固定性
- Match 参加者、raw score、rank、point、同点処理、match index
- Match を正本とした Session・Season・League・overall の集計
- Match、Session、Season、League の作成・更新・削除後の派生値更新
- active season の一意性とキャッシュ整合
- backend-foundation の logical key に従う user_stats の upsert と stale cleanup
- transaction/batch、冪等 rebuild、repair、失敗時のエラーと再実行
- 後続の frontend-session-match / frontend-statistics-quality が利用する BE 計算結果と再検証トリガー

### 対象外

- Firestore collection/path、公開 API DTO、ErrorEnvelope、status、認証 Cookie、OpenAPI/Hono RPC の再設計
- FEの入力フォーム、Session/Match画面、統計画面、FE側の点数・順位・統計再計算
- 新しいルールマスタ、`scoreCalculation` の公開、可変丸め方式の追加
- リアルタイム同期、本格的な複数端末同時編集、承認なしの既存本番データ移行

### 上流・下流との契約

- `backend-foundation` の embedded `rule`（`gameType`、`uma`、`oka`）、camelCase DTO、既存 route/status、`{ data }` と ErrorEnvelope、session cookie、AppType、user_stats logical keyを入力契約として利用する。
- `frontend-session-match` は Session の固定メンバー、三麻/四麻の許容 wind、BEが返す `matchIndex`・`rank`・`point`を利用する。FEは同じ計算を複製しない。
- `frontend-statistics-quality` は Season/League/UserStats の再構築結果、削除後の stale stats cleanup、sanma の fourth 系 `null` を利用する。

## 要件

### Requirement 1: Session と参加者の整合性

1.1 When Sessionを作成するとき, the Backend Integrity Lifecycle shall leagueの`gameType`に応じて三麻を3人、四麻を4人に限定し、SessionのmembersをSeasonに所属するユーザーの一意なスナップショットとして保存する。

1.2 If Session作成入力に同一userId、Season外のuserId、またはgameTypeと異なる人数が含まれる場合, the Backend Integrity Lifecycle shall 正本Sessionを書き込む前にvalidation errorとして拒否する。

1.3 While Sessionが存在する状態でMatchを登録または更新するとき, the Backend Integrity Lifecycle shall Sessionのmembersを変更せず、別の参加者で対局する要求には新しいSessionの作成を要求する。

1.4 When Matchを登録または更新するとき, the Backend Integrity Lifecycle shall Matchの参加userId集合をSessionのmember userId集合と完全一致させる。

### Requirement 2: Match入力と決定的な点数計算

2.1 When Match入力を検証するとき, the Backend Integrity Lifecycle shall 三麻では`east`・`south`・`west`、四麻では`east`・`south`・`west`・`north`を一度ずつ要求し、raw scoreの合計を`startingPoints × playerCount`と一致させる。

2.2 If Match入力のuserId、wind、raw score、関連Sessionが契約に適合しない場合, the Backend Integrity Lifecycle shall 正本Matchを書き込まずvalidation errorを返す。

2.3 When raw scoreからMatch結果を確定するとき, the Backend Integrity Lifecycle shall requestのrankを受け取らず、raw scoreの降順からcompetition rankingを決定し、同点順位帯のumaを平均配分する。

2.4 When Matchのpointを計算するとき, the Backend Integrity Lifecycle shall League ruleのoka・uma、playerCount、returnPointsに基づいてpointを算出し、小数第1位へ丸め、同じruleと入力に対して同じ結果を返す。

2.5 When Match結果を保存または返却するとき, the Backend Integrity Lifecycle shall BEが計算したrankとpointを提供し、計算されたpointの合計が許容される丸め誤差内で0になることを検証する。

### Requirement 3: Rule lifecycle と match index

3.1 While Leagueに正本Matchが一件も存在しない状態, the Backend Integrity Lifecycle shall League ruleの更新を許可し、最初のMatch登録時点のruleをそのMatchの計算に使用する。

3.2 If Leagueに一度でも正本Matchが登録された後にruleを更新しようとする場合, the Backend Integrity Lifecycle shall conflictとして拒否し、既存Matchの結果を再計算または書き換えない。

3.3 When同じSessionへMatchを同時登録するとき, the Backend Integrity Lifecycle shall Session内で重複しない正のmatchIndexを割り当て、既存の最大値より大きい値を返す。

3.4 When Matchが削除されるとき, the Backend Integrity Lifecycle shall 残存MatchのmatchIndexを詰めず、Match更新でmatchIndexを変更せず、欠番を許容する。

### Requirement 4: 正本Matchとライフサイクル更新

4.1 When Matchの作成、更新、削除が成功するとき, the Backend Integrity Lifecycle shall Match本体を正本として保持し、対象Session、Season、League、関連user_statsの派生値を再構築対象にする。

4.2 When Sessionが削除されるとき, the Backend Integrity Lifecycle shall 配下のMatchを含めて削除し、削除後のSeason、League、overallの集計とSession scopeの派生値を正本Match集合から再構築する。

4.3 When Seasonが削除されるとき, the Backend Integrity Lifecycle shall 配下のSessionとMatchを含めて削除し、Season scopeのuser_statsを削除して、League・active season・overallの派生値を再構築する。

4.4 When Leagueが削除されるとき, the Backend Integrity Lifecycle shall 配下のSeason、Session、MatchとLeague/Season scopeのuser_statsを削除し、残存LeagueのMatchだけからoverallの派生値を再構築する。

### Requirement 5: 派生集計の一貫性

5.1 When Seasonの集計を再構築するとき, the Backend Integrity Lifecycle shall 正本MatchからtotalMatchCount、standings、pointProgressions、seasonRecords、各SessionのtotalMatchCountを同じ計算規則で更新する。

5.2 When Leagueの集計を再構築するとき, the Backend Integrity Lifecycle shall 全Seasonの正本MatchからtotalMatchCount、leagueRecords、activeSeason cacheを更新する。

5.3 When userのoverall集計を再構築するとき, the Backend Integrity Lifecycle shall 残存する全Leagueの正本Matchからscope全体のpoint、順位、成績指標を再計算する。

5.4 When同じ正本Match集合、member snapshot、rule、集計設定でrebuildを繰り返すとき, the Backend Integrity Lifecycle shall 同じ派生値を生成し、同じlogical keyの重複user_statsを作成しない。

5.5 When集計対象Matchを並べ替えるとき, the Backend Integrity Lifecycle shall `playedAt`、Session識別子、matchIndex、Match識別子の順で決定的に順序付け、同点のstandingはtotalPoints、表示名、userIdの順で安定させる。

### Requirement 6: active season と member lifecycle

6.1 When Seasonをactiveへ変更またはactiveとして作成するとき, the Backend Integrity Lifecycle shall Leagueごとにactive Seasonを最大1件に保ち、別のactive Seasonが存在する場合はconflictとして拒否する。

6.2 When active Seasonがarchived化または削除されるとき, the Backend Integrity Lifecycle shall LeagueのactiveSeason cacheをnullへ更新し、別のarchived Seasonを自動的にactiveへ昇格しない。

6.3 When League memberが変更されるとき, the Backend Integrity Lifecycle shall 過去のSession、Match、計算済み結果を削除または参加者変更せず、以後のSession作成では現在のLeague/Season membershipだけを許可する。

### Requirement 7: user_stats の論理キーと stale cleanup

7.1 When user_statsをupsertするとき, the Backend Integrity Lifecycle shall `overall_{userId}`、`league_{leagueId}_{userId}`、`season_{leagueId}_{seasonId}_{userId}`のlogical keyを正本IDとして使用する。

7.2 When sanmaのuser_statsまたはstandingを返すとき, the Backend Integrity Lifecycle shall fourthCount、fourthRateなどの四麻専用値をnullとし、四麻では対応する実績値を計算結果から返す。

7.3 When scopeの正本Matchが削除またはscope自体が削除されるとき, the Backend Integrity Lifecycle shall sourceが存在しないstale user_statsを削除し、正本Matchや他scopeの履歴を削除しない。

7.4 When user_statsを再構築するとき, the Backend Integrity Lifecycle shall totalPoints、averageRank、各順位回数・率、score、streakを同じ正本Match集合から計算し、対象scopeの現在値と一致させる。

### Requirement 8: 失敗、repair、後続仕様への引き渡し

8.1 When正本Matchの保存後に派生集計の更新が失敗するとき, the Backend Integrity Lifecycle shall 標準internal errorを返し、保存済みの正本Matchを重複作成せず、repair/rebuildで再実行できる状態を残す。

8.2 When repair/rebuildが実行されるとき, the Backend Integrity Lifecycle shall canonical Match、Session member snapshot、League ruleから対象scopeを再計算し、途中まで成功した過去の派生値に依存せず収束させる。

8.3 When frontend-session-matchまたはfrontend-statistics-qualityが結果を利用するとき, the Backend Integrity Lifecycle shall backend-foundationのroute、DTO、status、ErrorEnvelope、AppTypeを維持し、FEが点数・順位・統計を再計算せずに利用できる結果を提供する。

## 仮定と運用上の注意

- Match indexはSession内で現在の最大値+1をtransactionで割り当てる。削除時に既存値を詰めないが、別途公開されていない高水位カウンタの契約は追加しない。
- Matchの同点処理は現行 scoring の competition ranking とuma平均配分を正本とする。Match requestにはrankを含めず、計算結果だけをresponseへ返す。
- League member変更は履歴を保持する。current membershipは新規Sessionの認可に使い、過去Matchの参加者を置換しない。
- active Season削除後の自動昇格は行わない。activeが存在しない状態は正常な状態として扱う。
- repair/rebuildの運用起動方法は公開APIではなく、既存のbackend運用スクリプトまたは内部application serviceとする。公開routeの追加は本仕様に含めない。
