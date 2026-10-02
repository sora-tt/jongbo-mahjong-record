# 実装タスク: frontend-session-match

## 1. Session/Match API境界と表示model

- [ ] 1.1 (P) Session feature APIとDTO adapterを整備する
  - `GET/POST /api/leagues/:leagueId/seasons/:seasonId/sessions` と `GET/PATCH .../:sessionId` の型をfoundationのAppTypeから導出する。
  - Session members、memberCount、totalMatchCount、startedAt、endedAt、tableLabel、createdByをnullable/ISO semanticsを壊さずview modelへ渡す。
  - 完了時、Session list/create/detail/endが手書きresponse型や直接fetchなしで同じtyped wrapperから利用できる。
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.1, 6.2_
  - _Boundary: Session Feature API_

- [ ] 1.2 (P) Match feature APIとBE結果adapterを整備する
  - Match list/create/detail/update/deleteのrequest/response型をAppTypeから導出し、共通client/parserを利用する。
  - `matchIndex`、`rank`、`point`、`rawScore`、wind、userName、playedAtに加え、`chomboEvents`と`offTableKyotakuCount`をrequest/response adapterで別fieldとして保持する。
  - 完了時、Match list/detail/create/edit/deleteが同じfeature API境界で型検証され、rank/pointと記録済み外卓項目がBE response由来になる。
  - _Requirements: 3.4, 3.7, 3.8, 4.1, 4.2, 4.3, 4.4, 4.5, 5.2, 6.1, 6.2_
  - _Boundary: Match Feature API_

## 2. Participant modelとSessionフロー

- [ ] 2.1 (P) gameType別participant constraintを実装する
  - League ruleとSeason membersからsanma/yonmaのrequiredWinds、人数、候補を導出し、重複userId・候補外・northの不正使用を早期検出する。
  - Session作成後は返却されたSession membersを固定候補として扱い、別参加者は新しいSessionが必要であることをform stateへ反映する。
  - 完了時、三麻はeast/south/westの3枠、四麻はeast/south/west/northの4枠だけが有効で、不正な選択を送信できない。
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.2, 4.1, 4.4_
  - _Boundary: Participant Model_

- [ ] 2.2 Session作成とPlayer selectを接続する
  - Season詳細から候補を読み込み、loading/empty/error/401/403/404を表示し、参加者確定からSession createのone-shot guardへ接続する。
  - Session create成功時はreturned membersを次のMatch formへ渡し、失敗時は選択値を保持して再送できるようにする。
  - 完了時、参加者確定操作は一度のSession作成へつながり、Session作成前に初回Matchが送信されない状態が確認できる。実装開始時に確定したSession作成タイミングが異なる場合は同じone-shot/fixed-member契約を保つ。
  - _Depends: 1.1, 2.1_
  - _Requirements: 1.1, 1.4, 1.6, 2.1, 2.5, 6.3, 6.4_
  - _Boundary: Session Hooks and UI, Participant Model_

## 3. Session一覧・詳細と画面状態

- [ ] 3.1 Session一覧をSeason detailへ接続する
  - Session list APIを呼び出し、startedAt、endedAt、memberCount、totalMatchCount、tableLabel、fixed membersを表示する。
  - 正常な空配列はempty stateと新規Session導線へ、取得失敗はErrorStateとretryへ渡し、Seasonの現在membersでsnapshotを上書きしない。
  - 完了時、Season detailから既存Sessionの結果画面と新規Session開始へ遷移でき、Session一覧のloading/error/emptyが区別される。
  - _Depends: 1.1, 2.1, 2.2_
  - _Requirements: 2.2, 2.3, 2.5, 5.1, 5.3, 6.3, 6.4_
  - _Boundary: Session Hooks and UI, Route Integration_

- [ ] 3.2 Session detailと終了mutationを接続する
  - 既存results routeをSession detail/resultの表示入口としてSession DTOとMatch listを読み込み、endedAt/tableLabelの更新と成功後refetchを実装する。
  - 401/403/404/409/validation/transport errorを区別し、終了中の二重操作を防ぎ、失敗時の状態を保持する。
  - 完了時、Session detailのmembers、memberCount、totalMatchCount、開始/終了状態がBE responseから表示され、終了後に一覧・詳細が最新になる。
  - _Depends: 1.1, 3.1_
  - _Requirements: 2.3, 2.4, 2.5, 4.5, 5.1, 5.3, 6.3, 6.4_
  - _Boundary: Session Hooks and UI, Route Integration_

## 4. 共通Matchフォームとmutation

- [ ] 4.1 (P) initial/additional/editの共通form modelを実装する
  - mode、fixed Session members、gameType別wind、playedAt、raw score、チョンボ発生行、供託有無/本数、submitting/errorを共通form stateへまとめる。
  - edit modeではparticipant/windと既存外卓値をread-onlyにし、チョンボ行・供託欄は既存UIに沿って必要な範囲だけ追加する。
  - 完了時、初回・追加・編集で同じform契約を使い、同一userのチョンボ複数行を保持でき、editから参加者・外卓値を変更できない。
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 3.8, 3.9, 4.4, 5.2_
  - _Boundary: Common Match Form, Participant Model_

- [ ] 4.2 raw score validationとBE入力mappingを接続する
  - startingPointsとplayerCountに基づく整数・必須・合計制約を表示し、供託1本ごとにraw score合計の期待値を1000減らす。チョンボ回数はraw score合計を変えない。
  - チョンボ行のoffenderはSession memberに限定し、同じuserの複数発生を許可する。供託入力はLeague ruleが許可する時だけ表示し、ありの場合は正の整数を要求する。
  - rank/pointをform stateや表示用計算で生成せず、AppTypeが要求する入力だけをtyped APIへ渡し、BEのvalidation errorを最終結果として表示する。
  - 完了時、外卓入力とraw score合計がBE契約どおりmappingされ、入力不正時は送信されず、FEがrank/pointを決めない。
  - _Depends: 1.2, 2.1, 4.1_
  - _Requirements: 3.3, 3.4, 3.5, 3.7, 3.8, 4.1, 4.4, 6.2, 6.4_
  - _Boundary: Common Match Form, Match Feature API_

- [ ] 4.3 初回・追加・編集のsubmitと再取得を接続する
  - initial/additionalはSession membersと完全一致するresultsと別fieldのchomboEvents/offTableKyotakuCountをPOSTし、editはplayedAt/raw scoreだけをPATCHして外卓fieldを省略する。
  - mutation中の二重submitを防ぎ、成功後にSession detail、Match list、必要なMatch detailを取得してからroute表示を確定する。失敗時は入力を保持する。
  - 完了時、外卓項目がMatch DTOに別々に保存され、edit requestでは既存値を保持したままBE算出結果を再取得して表示する。
  - _Depends: 1.2, 2.2, 4.1, 4.2_
  - _Requirements: 3.5, 3.6, 3.7, 3.8, 4.1, 4.4, 4.5, 5.1, 6.3, 6.4_
  - _Boundary: Common Match Form, Match Feature API, Route Integration_

- [ ] 4.4 初回Match作成失敗時に今回のSessionだけをrollbackする
  - 初回Match用に同じ送信で作成したSessionの後、Match createが失敗した場合はそのSessionだけをDELETEする。
  - 既存SessionやMatchを削除せず、Match失敗と入力値を利用者へ保持して表示する。
  - 完了時、新規Sessionを使う初回Match失敗で作成Sessionだけが消え、既存Session利用時はrollback deleteが発生しない。
  - _Depends: 2.2, 4.3_
  - _Requirements: 2.6_
  - _Boundary: Session Feature API, Match Feature API, Route Integration_

## 5. Match一覧・詳細・結果・削除

- [ ] 5.1 Match一覧とBE結果表示を実装する
  - Session detail/resultでMatch DTOのplayedAt、matchIndex、participant、wind、rawScore、BE rank、BE pointを表示する。
  - BEが返すchomboEventsの発生回数と各offender、offTableKyotakuCountを同じMatch記録の外卓項目として表示する。
  - API配列と`matchIndex`をそのまま扱い、削除後の欠番を詰めず、pointの合算やFE順位で表示値を上書きしない。
  - 完了時、Match一覧・詳細にBE返却のrank/pointと外卓記録が表示され、正常な空配列は未対局emptyとして表示される。
  - _Depends: 1.2, 3.2_
  - _Requirements: 4.2, 4.3, 5.2, 5.3, 6.2, 6.3_
  - _Boundary: Match Views_

- [ ] 5.2 Match一覧内の詳細展開とedit初期値を接続する
  - 専用Match detail routeは新設せず、既存resultsのMatch行または結果カードを展開してBE responseのSession members、wind、rawScore、playedAt、rank、point、chomboEvents、offTableKyotakuCountを表示する。
  - 編集操作だけは既存の`matches/[matchId]/edit`へ遷移し、外卓項目はread-only表示に留め、PATCHから省略する。initial valuesはBE responseから作り、rank/pointは編集入力にしない。
  - 完了時、対象Matchが見つからない場合はsuccess/emptyとせずnot_found ErrorStateを表示し、editでparticipant集合とmatchIndexが変わらない。
  - _Depends: 1.2, 4.1, 4.3_
  - _Requirements: 3.1, 3.2, 4.2, 4.4, 5.1, 5.3, 6.2, 6.4_
  - _Boundary: Match Views, Route Integration_

- [ ] 5.3 Match delete、一覧再取得、未接続操作を整理する
  - 既存削除確認をtyped DELETEへ接続し、成功後にMatch listとSession detailを再取得する。失敗時は確認状態とErrorStateを保持する。
  - add/edit/delete/back/session-endの各buttonをroute/API/retry/disabled explanationへ接続し、console-only submitやmock fallbackを対象routeから除去する。
  - 完了時、削除後も既存MatchのmatchIndexは変わらず、主要buttonが見た目だけで停止せず、stats/旧コード全削除を取り込まない。
  - _Depends: 3.2, 5.1, 5.2_
  - _Requirements: 4.3, 4.5, 5.1, 5.3, 5.4, 7.3_
  - _Boundary: Match Views, Route Integration, Validation Handoff_

## 6. 共通状態・route境界・handoff

- [ ] 6.1 foundation stateとAPI error mappingを対象featureへ適用する
  - AsyncState、Loading/Error/Empty、retry、Auth boundary、safe messageをSession/Matchのlist/detail/formへ接続する。
  - 401だけをloginへ委譲し、403/404/409/validation/internal/transport/decodeを画面状態として区別し、内部detailsを表示しない。
  - 完了時、route parameter変更やunmount後に古いrequestの結果が適用されず、正常なempty/nullとerrorが区別される。
  - _Requirements: 1.6, 2.5, 3.5, 3.6, 6.1, 6.3, 6.4_
  - _Boundary: Session Hooks and UI, Match Views, Validation Handoff_

- [ ] 6.2 Season detail、旧recording flow、shared UIの境界を再検証する
  - Season detailのSession list/start導線、AppShell/UI primitives、既存storeとの互換接続を確認し、Session/Match featureからtransport・primitive・BE計算を再実装しない。
  - recording-flowの一時状態がSession/MatchのAPI正本を上書きしないこと、対象routeがmock/domain fallbackを参照しないことを確認する。
  - 完了時、frontend-league-seasonとfrontend-statistics-qualityへのownership差分、Session作成タイミング、rankをrequestから除外する契約の再検証点が明示される。
  - _Depends: 3.1, 4.3, 5.3, 6.1_
  - _Requirements: 5.4, 6.1, 6.2, 7.1, 7.3_
  - _Boundary: Route Integration, Validation Handoff_

## 7. 契約・品質検証

- [ ] 7.1 API contract、participant、form stateの検証を追加する
  - Session/Matchのendpoint、status、`{ data }`、ErrorEnvelope、fixed members、sanma/yonma wind、raw score validation、BE rank/point、matchIndex gapを検証する。
  - 401/403/404/409/validation/transport error、empty/null、二重submit、stale response、edit participant lock、delete後refetchを確認する。
  - 完了時、契約不一致時に対象route、入力状態、表示値を特定でき、FEでrank/point/aggregateを再計算する変更を検出できる。
  - _Depends: 2.1, 4.2, 5.3, 6.1_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.2, 6.2, 6.3, 6.4, 7.1_
  - _Boundary: Validation Handoff_

- [ ] 7.2 typecheck、lint、buildと対象route静的スキャンを完了する
  - `pnpm typecheck`、`pnpm lint`、`pnpm build`を実行し、AppType変更、React/Next route、shared UI、import境界の違反を確認する。
  - 対象routeのdirect fetch、mock fallback、console-only button、FE rank/point/aggregate計算、matchIndex補正、stats実装の混入をスキャンする。
  - 完了時、Season detailからSession list/start、初回/追加/edit/result/detail/backまでがcompile/build可能で、後続仕様の再検証項目が記録される。
  - _Depends: 6.2, 7.1_
  - _Requirements: 5.1, 5.3, 5.4, 6.1, 7.1, 7.2, 7.3_
  - _Boundary: Validation Handoff_
