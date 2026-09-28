# 要件定義: frontend-league-season

## プロジェクト説明

リーグ・シーズン画面を利用する麻雀記録アプリの利用者とFE実装者は、ホーム、リーグ、シーズンの画面でBE APIモデルと旧domain/mockモデルが混在し、画面ごとにfetch、フォーム、エラー、表示状態の扱いが異なっている。現行コードには、シーズン編集のmock依存と`console.log`だけのsubmit、詳細画面の未接続ボタン、誤った旧編集routeが残り、active seasonやBE算出済みのstandingsを一貫して表示できない。この仕様では、共通基盤とBE契約を利用するAPI hooks・adapter・forms・表示コンポーネントへリーグ・シーズン画面を整理し、CRUDと表示を実運用APIへ接続する。

## スコープと境界

### 対象

- `/` のホーム兼リーグ一覧
- リーグ作成、詳細、編集
- リーグ詳細内のシーズン一覧
- シーズン作成、詳細、編集
- BE API契約に基づく`rule`、member、active season、standings、league/season recordsの表示
- API hooks、表示adapter、フォーム送信、loading/error/empty/retry状態
- 未接続button、mock参照、旧シーズン編集route、編集後の派生値表示の整理

### 対象外

- Session・Matchの入力、編集、結果表示の業務ロジック
- 統計チャートの新規仕様、統計画面の詳細、FEでのrank・point・standing・累計値の再計算
- 新しいリーグ/シーズンメンバー管理APIや履歴変更仕様
- 共通API client、共通UI primitive、Header/AppShell、認証Cookie・ErrorEnvelopeの再設計
- BEのFirestore、集計、active season整合性、API DTO/statusの変更

### 隣接仕様との契約

- `frontend-foundation-ui` のHono `AppType`由来型、共通API client、`{ data }`/ErrorEnvelope、Cookie認証、AsyncState、UI primitives、AppShellを利用する。
- `backend-foundation` のcamelCase DTO、ISO 8601日時、opaque ID、league embedded `rule`、`rule.uma`の合計0 invariant、リーグ/シーズンrouteとstatusを正本として利用する。
- `backend-integrity-lifecycle` のactive season一意性、rule lock、BEが計算したstandings/records、削除後の派生値をそのまま表示し、FE側で再計算しない。
- 下流の`frontend-session-match`はシーズン詳細から既存のSession開始routeへ遷移できることだけを受け取り、Session/Match画面の実装は所有しない。

## 要件

### Requirement 1: ホームのリーグ一覧

1.1 When 認証済み利用者がホームを表示するとき, the League-Season Feature shall BEのリーグ一覧を取得し、リーグ名、メンバー数、総対局数、active season、利用者の順位をAPIが返した値のまま表示する。

1.2 While ホームのリーグ一覧を取得している状態, the League-Season Feature shall 対象領域にloading stateを表示し、取得失敗時は安全なメッセージと再試行操作を表示する。

1.3 When 正常なリーグ一覧が空配列を返すとき, the League-Season Feature shall エラーと混同しないempty stateとリーグ作成への導線を表示する。

1.4 When 利用者がホームのリーグまたはactive seasonの導線を操作するとき, the League-Season Feature shall 対応するリーグ詳細またはactive season詳細へ遷移し、active seasonがnullの場合はリーグ詳細へ遷移する。

### Requirement 2: リーグ詳細とシーズン一覧

2.1 When 利用者がリーグ詳細を表示するとき, the League-Season Feature shall リーグ名、rule、メンバー数、総対局数、リーグ記録、active seasonをBEのLeagueDetailから表示する。

2.2 When リーグ記録またはactive seasonがnull、または記録が未計算の状態であるとき, the League-Season Feature shall nullを別の値へ置換せず、未集計または対象なしであることを説明する。

2.3 When リーグ詳細のシーズン一覧を表示するとき, the League-Season Feature shall シーズン名、status、メンバー数、総対局数を表示し、各シーズン詳細とシーズン作成へ遷移できる導線を提供する。

2.4 When シーズン一覧が正常な空配列を返すとき, the League-Season Feature shall シーズン未作成のempty stateとシーズン作成への導線を表示する。

### Requirement 3: リーグ作成フォーム

3.1 When 利用者がリーグ作成画面を表示するとき, the League-Season Feature shall リーグ名、メンバー候補、gameType、okaのstartingPoints/returnPoints、umaの順位別値を入力できるフォームを表示する。

3.2 When 利用者がメンバー検索を実行するとき, the League-Season Feature shall BEのユーザー検索結果だけを候補として表示し、追加済み候補の重複追加を防ぎ、検索中・該当なし・検索失敗を区別する。

3.3 When gameTypeがsanmaまたはyonmaである状態, the League-Season Feature shall sanmaではuma.fourthをnull、yonmaではuma.fourthを入力値として送信し、BE契約にないruleフィールドを追加しない。

3.4 When 利用者がリーグ作成または編集フォームでrule.umaを入力するとき, the League-Season Feature shall `uma.first`、`uma.second`、`uma.third`と、yonmaの場合の`uma.fourth`の合計が0になることを事前検証し、合計が0でない場合はAPIを呼び出さず入力エラーを表示する。

3.5 When 利用者が妥当なリーグ作成フォームを送信するとき, the League-Season Feature shall `POST /api/leagues`を一度だけ実行し、成功時は作成されたリーグ詳細へ遷移し、validation・認可・競合エラー時は入力を保持して再送可能な状態を表示する。

3.6 If リーグ作成または編集APIが`rule.uma`の合計不整合を`validation_error`として返す場合, the League-Season Feature shall BEのエラーメッセージを安全に表示して入力を保持し、FEの事前検証結果でBEの判定を上書きまたは回避しない。

### Requirement 4: リーグ編集フォーム

4.1 When 利用者がリーグ編集画面を表示するとき, the League-Season Feature shall BEのLeagueDetailを読み込み、リーグ名、現在のメンバー、ruleをフォームへ初期表示する。

4.2 When 利用者がリーグ設定を更新するとき, the League-Season Feature shall BEが許可するname、memberUserIds、ruleだけを`PATCH /api/leagues/:leagueId`へ送信し、正本Match後はruleを変更せずnameまたはmemberUserIdsの更新だけを許可する。

4.3 If 正本Match後のrule更新、またはメンバー・rule更新がBEの競合/validation条件に該当する場合, the League-Season Feature shall BEのconflictまたはvalidation errorを安全な利用者向けメッセージとして表示し、mockによる代替更新を行わない。

4.4 When リーグ編集が成功するとき, the League-Season Feature shall 更新レスポンスまたは再取得したLeagueDetailを表示し、派生値とactive seasonを古い状態のまま残さず、送信中の二重送信を防ぐ。

### Requirement 5: シーズン一覧と作成フォーム

5.1 When 利用者がリーグ詳細のシーズン一覧を表示するとき, the League-Season Feature shall `GET /api/leagues/:leagueId/seasons`のSeasonSummaryを表示し、statusをactive/archivedの意味に対応させる。

5.2 When 利用者がシーズン作成画面を表示するとき, the League-Season Feature shall リーグの現在メンバーから参加者を選択でき、nameとstatusを入力または選択できるフォームを表示する。

5.3 When シーズン作成フォームを送信するとき, the League-Season Feature shall 選択したmemberUserIdsを重複なく送信し、参加者が1人未満の場合はAPIを呼び出さず入力エラーを表示する。

5.4 When シーズン作成が成功、または既存active seasonとの競合になるとき, the League-Season Feature shall 成功時は作成されたシーズン詳細へ遷移し、conflict時は現在の入力を保持したままactive seasonが一意であることを説明する。

### Requirement 6: シーズン詳細

6.1 When 利用者がシーズン詳細を表示するとき, the League-Season Feature shall name、status、メンバー数、総対局数、latestPlayedAt、BE算出済みstandings、seasonRecordsを表示する。

6.2 When standings、seasonRecords、pointProgressionsが空またはnullであるとき, the League-Season Feature shall 未対局・未集計のempty stateを表示し、0や推測値を計算して補わない。

6.3 When 利用者がシーズン詳細の編集または対局記録導線を操作するとき, the League-Season Feature shall シーズン編集routeまたは既存のSession開始routeへ遷移し、未接続buttonを残さない。

6.4 If leagueIdまたはseasonIdが欠落、対象が存在しない、または利用者に権限がない場合, the League-Season Feature shall 共通のerror stateまたは認証遷移を表示し、空の詳細画面を成功状態として表示しない。

### Requirement 7: シーズン編集フォーム

7.1 When 利用者がシーズン編集画面を表示するとき, the League-Season Feature shall `GET /api/leagues/:leagueId/seasons/:seasonId`からnameとstatusを初期化し、現在のmembersは読み取り専用のスナップショットとして表示する。

7.2 When 利用者がシーズン編集を送信するとき, the League-Season Feature shall BE契約で許可されたnameまたはstatusだけを`PATCH /api/leagues/:leagueId/seasons/:seasonId`へ送信し、memberUserIdsを更新入力へ含めない。

7.3 When シーズン編集が成功するとき, the League-Season Feature shall 更新後のSeasonDetailを再取得または更新レスポンスから反映し、シーズン詳細へ戻った時にstatus、name、active season表示が最新になる。

7.4 If シーズン編集の取得または更新が失敗するとき, the League-Season Feature shall loading/error、401、403、404、409、validation errorを区別し、送信中の二重送信を防ぎ、mockやconsole出力で完了扱いにしない。

### Requirement 8: API・フォーム・表示状態の共通適用

8.1 When リーグまたはシーズン画面がデータを取得・更新するとき, the League-Season Feature shall `frontend-foundation-ui`のAPI client、Hono由来型、feature API hook、表示adapterを経由し、route componentから直接fetchしない。

8.2 When API DTOを画面へ表示するとき, the League-Season Feature shall camelCase、ISO 8601、nullable値、BE算出済みrank/point/standing/recordsを保持し、FEで再計算・mock補完・暗黙の既定値置換を行わない。

8.3 While API request、mutation、retryが実行されている状態, the League-Season Feature shall 共通Loading/Error/Empty state、safe message、retry、disabled/loading actionを使用し、401はAuth boundaryへ委譲する。

8.4 When route parameterが変化、requestが遅延、または画面がunmountされるとき, the League-Season Feature shall 古い結果で新しい画面を上書きせず、不要なstate updateを発生させない。

### Requirement 9: 境界・未接続操作・再検証

9.1 The League-Season Feature shall Session・Matchの業務ロジック、統計チャートの詳細、BEのactive season/集計整合性、共通UI primitiveの所有権を取り込まない。

9.2 If API契約に存在しない更新・メンバー管理機能が画面要望として現れる場合, the League-Season Feature shall mockで実装せず、未対応表示または別仕様の再要件化対象として扱う。

9.3 When upstreamのAppType、DTO、ErrorCode、status、rule、active season、standings契約が変更されるとき, the League-Season Feature shall 対象featureのAPI hook、adapter、form、表示、契約検証を再確認する。

9.4 When 利用者が画面上の主要な作成、更新、詳細、記録、戻る操作を実行するとき, the League-Season Feature shall API完了または明確なroute遷移を実行し、見た目だけで何も起きないbutton、submit、console出力を残さない。

## 仮定・未決事項

- 現在の`/`をホーム兼リーグ一覧の正規入口とし、独立した`/league`一覧routeは新設しない。Headerのリーグ導線は`frontend-foundation-ui`のAppShellへ`/`を再検証付きで渡す。
- `POST /api/leagues/:leagueId/seasons`のstatus省略時はBEの現行契約どおりactiveとして扱う。別activeがある場合はBEのconflictを表示し、自動archived化や別seasonの自動昇格は行わない。
- `rule.uma`の数値フィールド合計0は、ユーザー確認済みの`backend-foundation`正本契約として扱う。FEは事前検証を行うが、BEのvalidationを最終的な正とし、FEとBEの判定が異なる場合はBEの`validation_error`を表示する。
- リーグにMatchが存在する場合のrule編集はBEのrule lockを正とし、UIでは編集不可またはconflictを説明する。既存Matchの再計算をFEで行わない。
- シーズンメンバーは作成時のBE snapshotであり、編集画面では表示のみとする。メンバー差し替えが必要な場合は別のBE/FE仕様を起こす。
