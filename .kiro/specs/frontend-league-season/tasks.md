# 実装タスク: frontend-league-season

## 1. League/Season API境界と表示model

- [x] 1.1 (P) League featureの型付きAPI入口とadapterを整備する
  - `GET /api/leagues`、`GET/PATCH /api/leagues/:leagueId`、`GET /members`、`POST`のrequest/response型をfoundationの`AppType`から導出する。
  - LeagueSummary/Detail、rule、activeSeason、myStanding、leagueRecords、memberのnullableとISO日時をview modelへ明示的に変換する。
  - 完了時、League featureが手書きresponse型・旧rule型・mockを参照せず、BE DTOの変更がtypecheckで検出される。
  - _Requirements: 1.1, 2.1, 3.1, 3.2, 3.3, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 8.1, 8.2, 9.3_
  - _Boundary: League Feature API, League Adapter_

- [x] 1.2 (P) Season featureの型付きAPI入口とadapterを整備する
  - `GET/POST /api/leagues/:leagueId/seasons`、`GET/PATCH /api/leagues/:leagueId/seasons/:seasonId`、league members取得のrequest/response型を`AppType`から導出する。
  - SeasonSummary/Detail、members、standings、pointProgressions、seasonRecords、latestPlayedAt、statusのnull/ISO semanticsを保持する。
  - 完了時、Season edit payloadにmemberUserIdsが存在せず、BE算出値の再計算・0埋め・mock補完がない。
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.4, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 9.2, 9.3_
  - _Boundary: Season Feature API, Season Adapter_

## 2. HomeとLeague読み取り画面

- [x] 2.1 ホームのリーグ一覧をAPI表示へ移行する
  - ホームhookとpageをLeagueSummary取得、loading/error/retry/empty state、カード導線の構成へ置き換える。
  - activeSeasonがnullのカードはリーグ詳細へ、存在するカードはactive season詳細へ遷移できる状態にする。
  - 完了時、ホームにはAPIのmemberCount、totalMatchCount、myStanding以外のmock値が表示されず、空一覧でも作成導線が表示される。
  - _Depends: 1.1_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.3, 8.4, 9.4_
  - _Boundary: League UI and Forms, Request Hooks_

- [x] 2.2 リーグ詳細とシーズン一覧をAPI表示へ移行する
  - LeagueDetailとSeasonSummary[]を取得し、rule、records、active season、シーズン状態・人数・対局数を表示する。
  - null record/activeSeason、空season listをerrorと混同しないempty表示にし、detail/edit/createの導線を接続する。
  - 完了時、リーグ詳細から全シーズン詳細とシーズン作成へ遷移でき、BEが返した派生値が古いmock値で上書きされない。
  - _Depends: 1.1, 1.2_
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.4, 8.3, 8.4, 9.4_
  - _Boundary: League UI and Forms, Season UI and Forms, Request Hooks_

## 3. Leagueフォームとmutation

- [x] 3.1 League create/edit共通フォームの入力境界を実装する
  - name、member search/selection、gameType、oka、umaを共通フォームで扱い、検索中・該当なし・追加済み重複・入力エラーを表示する。
  - sanmaではfourthをnull、yonmaではnumberとしてpayloadへ変換し、API契約にないruleフィールドやFE独自の点数計算を追加しない。
  - umaのfirst/second/thirdとyonmaのfourthの合計が0であることをcreate/edit共通でFE事前検証し、sanmaのnull fourthは合計対象から除外する。これはUX向上のためであり、BE検証を置き換えない。
  - 完了時、create/editの初期値と送信payloadが同じcanonical rule/member shapeになり、API未対応のmock操作が存在しない。
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 8.2, 9.2_
  - _Boundary: League UI and Forms, League Adapter_

- [x] 3.2 League作成submitと成功後遷移を接続する
  - client validation後に`POST /api/leagues`を一度だけ実行し、送信中disabled/loading、validation・forbidden・conflict・transport errorを入力保持付きで表示する。
  - FE事前検証でuma合計が0でない場合はAPIを呼ばず入力エラーを表示し、BEが`validation_error`を返した場合はBEのmessage/detailsを最終結果として安全に表示し、入力を保持する。
  - 作成成功後は返却されたleagueIdの詳細へ遷移し、一覧や詳細でcanonical LeagueDetailを再取得できる状態にする。
  - 完了時、作成ボタンを連打してもrequestが重複せず、失敗後に同じ入力を修正して再送できる。
  - _Depends: 1.1, 3.1_
  - _Requirements: 3.4, 3.5, 3.6, 8.3, 8.4, 9.4_
  - _Boundary: League UI and Forms, Request Hooks_

- [x] 3.3 League編集submit、rule lock、再取得を接続する
  - LeagueDetailでフォームを初期化し、BEが許可するname/memberUserIds/ruleだけを`PATCH /api/leagues/:leagueId`へ送信する。
  - Match存在後のrule lockやmember/validation errorをsafe messageへ変換し、uma合計の`validation_error`を含むBE結果を最終的な正として表示する。必要に応じてruleをread-only表示し、mock更新を行わない。
  - 成功後はLeagueDetailを再取得してrecords、activeSeason、memberCount、totalMatchCountを最新化し、詳細へ戻る。
  - _Depends: 1.1, 2.2, 3.1_
  - _Requirements: 3.6, 4.1, 4.2, 4.3, 4.4, 8.3, 8.4, 9.2, 9.4_
  - _Boundary: League UI and Forms, Request Hooks_

## 4. Seasonフォームと表示画面

- [x] 4.1 Season作成フォームとactive conflict処理を接続する
  - League membersをAPIから読み込み、name、member selection、statusをフォームへ表示し、status省略時のactive既定値をBE契約と一致させる。
  - 参加者0人の送信をclientで拒否し、重複のないmemberUserIdsで`POST /api/leagues/:leagueId/seasons`を一度だけ実行する。
  - 完了時、作成成功後にSeasonDetailへ遷移し、既存active seasonとの409では入力と選択状態を保持して再試行またはstatus変更を促す。
  - _Depends: 1.2, 2.2_
  - _Requirements: 5.2, 5.3, 5.4, 8.2, 8.3, 8.4, 9.2, 9.4_
  - _Boundary: Season UI and Forms, Request Hooks_

- [x] 4.2 Season detailとBE算出結果の表示を接続する
  - SeasonDetailのname、status、memberCount、totalMatchCount、latestPlayedAt、standings、seasonRecordsを表示する。
  - standings/records/pointProgressionsの空・nullを未対局/未集計として表示し、rank、point、順位、recordsを再計算しない。
  - 編集導線を正規season edit routeへ、記録導線を既存Session開始routeへ接続し、欠落params・403・404・401を共通状態へ渡す。
  - 完了時、更新buttonと記録buttonが見た目だけで停止せず、対応するroute遷移が確認できる。
  - _Depends: 1.2, 2.2_
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 8.2, 8.3, 8.4, 9.4_
  - _Boundary: Season UI and Forms, Season Adapter, Route Integration_

- [x] 4.3 Season編集をname/status限定のAPI mutationへ移行する
  - 正規`/league/[leagueId]/season/[seasonId]/edit`でSeasonDetailを初期表示し、membersは読み取り専用、編集可能項目はname/statusだけにする。
  - `PATCH /api/leagues/:leagueId/seasons/:seasonId`へmemberUserIdsを送らず、401/403/404/409/validation/transport errorを区別して入力保持付きで表示する。
  - 成功後にSeasonDetailを再取得し、name、status、activeSeason表示を最新化する。旧mock hook、`console.log`、leagueIdのない旧routeを本番導線から除去する。
  - _Depends: 1.2, 4.2_
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.2, 8.3, 8.4, 9.2, 9.4_
  - _Boundary: Season UI and Forms, Request Hooks, Route Integration_

## 5. ISSUE-99リーグrule項目

- [ ] 5.1 チョンボ罰符と卓外供託設定をLeague ruleへ追加する
  - backend-foundationのIssue #99 API契約とAppTypeからrule fieldを導出し、League作成フォームに非負整数のchomboPenaltyPointsと卓外供託可否を追加する。
  - League detailのrule表示にも両値を追加し、legacy Leagueに値がない場合は0/falseとして表示する。既存画面の構成を保ち、必要な入力・表示だけを既存UIに沿って加える。
  - 完了時、作成payloadとLeague detailが同じ型の値を扱い、FE独自rule DTOや点数計算を持たない。
  - _Requirements: 2.1, 3.1, 3.3, 4.1, 8.2, 9.3_
  - _Depends: 1.1_
  - _Boundary: League UI and Forms_

- [ ] 5.2 初回Match後のrule lockを外卓項目にも適用する
  - LeagueのMatch件数が0より大きい場合、チョンボ罰符・卓外供託可否をread-onlyにし、League PATCHには許可されたname/memberUserIdsだけを含める。
  - BEのconflict/validation errorを安全に表示して入力を保持し、rule fieldをmockやlocal stateで更新しない。
  - 完了時、rule lock後のLeague更新が外卓項目を送信せず、BEのrule値をそのまま表示する。
  - _Requirements: 3.5, 3.6, 4.2, 4.3, 4.4, 8.3, 9.2, 9.4_
  - _Depends: 5.1_
  - _Boundary: League UI and Forms, Request Hooks_

## 6. Route移行とshared boundary接続

- [x] 6.1 旧route、mock参照、未接続操作を対象範囲から除去する
  - Home、League、Seasonの本番routeから旧domain/mockを正本として読むimport、season editのconsole出力、未接続submit/buttonを除去する。
  - season editをleagueIdを含む正規routeへ統一し、旧URLは安全なredirectまたは到達不能な移行対象として二重実装を残さない。
  - 完了時、主要操作はAPI完了または明確なroute遷移を持ち、Session/Match・統計画面の実装や旧資産の全削除を取り込んでいない。
  - _Depends: 2.1, 2.2, 3.2, 3.3, 4.1, 4.2, 4.3_
  - _Requirements: 6.3, 7.2, 8.1, 9.1, 9.2, 9.4_
  - _Boundary: Route Integration, Migration Validation_

- [x] 6.2 AppShell、共通UI、下流Session導線を再検証する
  - foundationのAppShell/Header、UI primitives、AsyncState、Auth boundaryを対象画面へ接続し、feature側で共通transport・primitive・認証を再実装しない。
  - Headerのleague導線がホーム`/`へ到達し、Season detailの記録導線が既存Session開始routeへ渡ることを確認する。
  - 完了時、共通UIのloading/error/empty、focus、disabled/loading actionが対象画面で一貫し、foundationまたは下流仕様へ必要な再検証差分が明示される。
  - _Depends: 2.1, 4.2, 6.1_
  - _Requirements: 1.4, 6.3, 8.3, 9.1, 9.3, 9.4_
  - _Boundary: Route Integration, Migration Validation_



## 7. Issue #123 League/Seasonフォームとnavigation data

- [x] 7.1 League rule editorに座順ローテーション設定を追加する
  - create/editフォームとLeagueのrule表示で`rotateSeatOrder`を扱い、新規作成時の初期値をfalseにする。
  - Match作成後は既存rule lockに合わせてread-onlyとし、更新payloadに変更不可のruleを含めない。
  - 完了時、設定値がBE型で作成・取得・編集へ反映され、既存MatchがあるLeagueでは変更できない。
  - _Depends: backend-foundation 6.2, backend-foundation 6.3_
  - _Requirements: 2.3, 3.1, 3.3, 4.2_
  - _Boundary: League UI and Forms, League Feature API_

- [x] 7.2 (P) League/Season名のsuffix正規化modelを用意する
  - 入力stemと表示専用suffixを分離し、既存の末尾suffixを編集フォーム初期値から除いて重複付与を防ぐ。
  - 前後空白を整理し、保存値には対象suffixを一度だけ付ける。
  - 完了時、空白、suffixなし、suffix付き既存値を与えたとき正規化後のnameが常にsuffix一つで終わる。
  - _Requirements: 3.9, 4.1, 4.2, 5.2, 5.3, 7.1, 7.2_
  - _Boundary: Name Suffix Model_

- [ ] 7.3 League作成者の固定選択と継続メンバー検索を表示する
  - 認証ユーザーを選択済みの作成者として明示し、ownerを重複memberとして追加しない既存API契約を保つ。
  - 検索結果の追加後も検索UIを開いたままにし、候補の連続追加と追加済みmemberの識別・削除を可能にする。
  - 完了時、作成者表示を確認しながら検索候補から複数人を連続で追加でき、追加操作のたびに検索UIが閉じない。
  - _Requirements: 3.7, 3.8_
  - _Boundary: League UI and Forms, Request Hooks_

- [ ] 7.4 League create/editに固定「リーグ」suffixを接続する
  - 作成・編集のname入力欄の後ろに固定表示の「リーグ」を置き、編集時は保存済みsuffixを入力stemへ含めない。
  - submit時にstemを正規化し、League APIへsuffixが一度だけ付いたcanonical nameを送る。
  - 完了時、create/editを続けて開いて保存してもnameが「OOリーグリーグ」にならず、suffixは利用者が編集できない。
  - _Depends: 7.2_
  - _Requirements: 3.9, 4.1, 4.2_
  - _Boundary: League UI and Forms_

- [ ] 7.5 (P) Season create/editに固定「シーズン」suffixを接続する
  - Season作成・編集欄の後ろに固定表示の「シーズン」を置き、既存Season nameはsuffixを除いてstemへ初期化する。
  - submit時はnameへsuffixを一度だけ付け、status更新と既存member snapshotのAPI契約を維持する。
  - 完了時、作成・編集を繰り返してもSeason nameの末尾に「シーズン」が一度だけ保存される。
  - _Depends: 7.2_
  - _Requirements: 5.2, 5.3, 7.1, 7.2_
  - _Boundary: Season UI and Forms_

- [ ] 7.6 Header向けLeague navigation dataを遅延取得する
  - League一覧を取得し、Leagueが展開されたときだけそのLeagueのSeason一覧を取得してHeader Navigation Modelへ変換する。
  - Season取得のloading/empty/errorをLeagueごとに保持し、retryは該当Leagueだけを再取得して詳細・Season詳細routeを提供する。
  - 完了時、HeaderからLeagueを展開するまでSeason APIを呼ばず、展開後は該当LeagueのSeason linkと個別retryが表示される。
  - _Depends: frontend-foundation-ui 6.1_
  - _Requirements: 1.1, 2.3, 8.1, 8.3, 8.4, 9.1_
  - _Boundary: League Navigation Data, League/Season Feature API_

## 8. Issue #123フォーム・navigationの回帰確認

- [ ] 8.1 Rule、creator、member search、suffixの実装境界をsource reviewする
  - rotateSeatOrderのfalse初期値と保存payload、初回Match後のread-only分岐をform stateからAPI payloadまで確認する。
  - 作成者表示とmember searchの選択状態を追い、追加後も検索UIが開いたまま次の候補を選べることを確認する。
  - 完了時、LeagueとSeasonのsuffixは固定表示され、create/editいずれもcanonical nameへ一度だけ保存する処理を確認できる。
  - _Depends: 7.1, 7.2, 7.3, 7.4, 7.5, backend-foundation 6.2, backend-foundation 6.3_
  - _Requirements: 3.1, 3.3, 3.7, 3.8, 3.9, 4.1, 4.2, 5.2, 5.3, 7.1, 7.2_
  - _Boundary: League/Season Forms_

- [ ] 8.2 Header向けSeason lazy-loadとnavigation状態をsource reviewする
  - League一覧から各Leagueの展開callbackまでを追い、展開時だけSeason listを取得して既存のLeague/Season詳細routeを返すことを確認する。
  - loading、空、失敗、League単位retry stateがfoundationのHeader Navigation Modelへ渡ることを確認する。
  - 完了時、navigation hookに直接Header UI/API transportの再実装がなく、lazy-loadと個別retryの型付き接続を確認できる。
  - _Depends: 7.6, frontend-foundation-ui 6.1, frontend-foundation-ui 6.3, frontend-foundation-ui 6.4_
  - _Requirements: 1.1, 2.3, 8.1, 8.3, 8.4, 9.1_
  - _Boundary: League Navigation Data, Validation Handoff_

## 9. 契約・品質検証

- [ ] 9.1 API型、adapter、既存form payloadのsource reviewを行う
  - League/Seasonのendpoint request/response、status、`{ data }`、ErrorEnvelope、rule fourth nullability、Season updateのname/status限定、BE派生値の型とmappingを確認する。
  - uma合計0の事前検証、BE `validation_error`の表示・入力保持、empty/null、active conflict、401/403/404/409、stale request、二重submitのsource stateを追跡する。
  - 完了時、直接fetchや手書きAPI DTO、FE独自のrank/point/standing計算がなく、境界違反の発生画面を特定できる。
  - _Depends: 3.3, 4.3, 6.1_
  - _Requirements: 2.2, 3.4, 3.6, 4.3, 5.4, 6.2, 6.4, 7.2, 7.4, 8.2, 8.3, 8.4, 9.2, 9.3_
  - _Boundary: Migration Validation, League Feature API, Season Feature API_

- [ ] 9.2 typecheck、lint、buildと対象routeの静的スキャンを完了する
  - `pnpm typecheck`、`pnpm lint`、`pnpm build`を実行し、AppType変更、React/Next構成、import境界、共通UI利用、route解決を確認する。
  - 対象routeに対するmock import、`console.log`、直接fetch、未接続button、旧season edit pathをスキャンし、Session/Match・統計の境界外変更がないことを確認する。
  - 完了時、ホームからLeague/Seasonのcreate/detail/edit、HeaderのLeague/Season/Stats linkとSession開始導線までの主要routeがcompile/build可能である。
  - _Depends: 6.2, 8.1, 8.2, 9.1_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.1, 4.2, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.3, 7.1, 7.2, 7.3, 8.1, 8.3, 8.4, 9.1, 9.3, 9.4_
  - _Boundary: Migration Validation_
