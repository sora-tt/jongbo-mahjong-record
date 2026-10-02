# 実装タスク: frontend-statistics-quality

## 1. 統計契約と保存基盤

- [x] 1.1 統計query・投影・snapshot・responseの契約を定義する
  - overall/league/season、期間、ゲーム形式、viewer/target identity、未計算/empty/ready、cursorを区別する契約を定義する。
  - Matchの確定順位・素点・最終pointと順序を保ち、算出できない値はnullで表現する。
  - 型からAPI・投影・snapshot間の不整合を検出でき、三麻/四麻や本人/他人の対象条件を明示できる。
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.2, 8.3, 9.1_
  - _Boundary: Statistics Domain Contracts_

- [x] 1.2 user-match投影の保存repositoryを実装する
  - user・league・season・session・matchの組から決定的IDを作り、投影を冪等に保存する。
  - season単位の置換、古い投影のprune、season/league単位の削除を提供する。
  - 同じ再構築を繰り返しても重複せず、更新・削除後に対象外の投影が残らない。
  - _Requirements: 5.5, 8.1, 8.2_
  - _Boundary: UserMatchStatisticsRepository_

- [x] 1.3 user-match投影の絞り込み検索とcursor pageを実装する
  - target user、scope、日時、game typeを使って投影を検索する。
  - 履歴sortをplayedAt、sessionId、matchIndex、matchIdの降順で固定し、opaque cursorを扱う。
  - 条件を維持した複数ページに欠落・重複がなく、指定したlimit以内の結果だけを返す。
  - _Depends: 1.2_
  - _Requirements: 1.2, 1.4, 5.5, 6.2, 6.3, 8.1_
  - _Boundary: UserMatchStatisticsRepository_

- [x] 1.4 UserStatsへbounded snapshotとreadiness versionを追加する
  - 既存scope documentに固定長の全体・三麻・四麻snapshotとpersonal statistics versionを保存する。
  - 旧documentのversion未設定を未計算として読み、summaryとversionを同じdocumentに書く。
  - 既存stats APIのresponseを保ったまま、新snapshotを1 document readで取得できる。
  - _Depends: 1.1_
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 7.1, 7.2, 7.3, 8.1, 8.3_
  - _Boundary: UserStats Snapshot Repository_

- [x] 1.5 viewer/target向けleague・season membership lookupを追加する
  - League member subcollectionとseason document内membersから、指定されたviewer/target IDの所属を判定する。
  - 参加者全体や対局・統計projectionを走査せず、対象scopeのmembershipだけを確認する。
  - 既存の参加者一覧APIは閲覧可能なviewerに候補一覧を返し、FEが選択肢を利用できる。
  - _Depends: 1.1_
  - _Requirements: 9.8, 10.1_
  - _Boundary: League and Season Membership Repositories_

- [ ] 1.6 statistics target access policyを実装する
  - viewerとtargetが同じIDなら本人の閲覧を許可する。
  - 異なるIDではleague/seasonに限り、両者が同じscopeの参加者の場合だけ許可する。
  - overallの他人指定またはscope外のtargetを403で拒否する。
  - _Depends: 1.1, 1.5_
  - _Requirements: 9.8, 10.1, 10.2_
  - _Boundary: StatisticsTargetAccessService_

- [ ] 1.7 user-match schemaとFirestore複合indexを追加する
  - user-match collectionとUserStats snapshotの保存項目をFirestore schema定義へ反映する。
  - analysis/historyのscope、game type、日時、cursor sortに必要なindexを既存設定へ追加する。
  - emulatorと既存firebase設定が同じindex定義を参照する。
  - _Depends: 1.1, 1.2_
  - _Requirements: 5.5, 6.2, 6.3, 8.1_
  - _Boundary: Firestore Schema and Indexes_

## 2. 集計・再構築・読み出し

- [ ] 2.1 順位・素点・最終pointの集計を実装する
  - 対局数、総point、平均順位、形式別順位回数・率、トップ率、連対率、ラス率、ラス回避率を算出する。
  - 素点と最終pointを分け、平均・高低・中央値・母標準偏差・プラス/マイナス/同点分布・順位別平均を算出する。
  - 分母、null、0件、三麻の4位項目なしを設計規則どおりに返す。
  - _Depends: 1.1_
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  - _Boundary: Statistics Aggregation Module_

- [ ] 2.2 対局推移・暦別集計・自己記録を実装する
  - 対局順の累計point、日/月/年・曜日・時間帯の成績、直近10/20/50戦を算出する。
  - 最高・最低記録と現在/最長のトップ・ラス・連対・プラス・マイナスstreakを対局順に算出する。
  - 日付境界をAsia/Tokyoにそろえ、同時刻・同一session内でも順序が再現される。
  - _Depends: 1.1, 2.1_
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.1, 7.2, 7.3_
  - _Boundary: Statistics Aggregation Module_

- [ ] 2.3 席・対戦相手・session別集計を実装する
  - 席ごとに対局数、平均順位、トップ率、平均最終pointを形式別に算出する。
  - 相手ごとに同卓数、同順位数、上位率、平均/累計point差を算出する。
  - sessionごとに対局数、総point、形式別平均順位、トップ回数を返し、各割合に分母を付ける。
  - _Depends: 1.1, 2.1_
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - _Boundary: Statistics Aggregation Module_

- [ ] 2.4 確定Match結果からuser-match投影を構築する
  - 各参加者につき1対局1投影を作り、順位・席・素点・最終point・日時・形式・チョンボ・相手情報を保持する。
  - ゲーム形式は記録済みresults件数から決め、現在のリーグ設定で過去対局を再分類しない。
  - 同じMatchから常に同じ投影を生成し、正本にない局単位情報を補わない。
  - _Depends: 1.1, 1.2_
  - _Requirements: 5.5, 5.6, 6.2, 7.1, 8.2_
  - _Boundary: UserMatchStatistics projection_

- [ ] 2.5 bounded personal statistics snapshotを組み立てる
  - 基本集計、形式別順位、スコア、record、streak、直近成績、参加session数、順位前後差を固定scope snapshotへまとめる。
  - overall/三麻/四麻のsliceを作り、全推移・可変長の相手/session行・履歴をsnapshotへ格納しない。
  - 既存UserStats値と同じ確定Match入力から再現可能なsnapshotを生成する。
  - _Depends: 1.1, 1.4, 2.1, 2.2, 2.3_
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 7.1, 7.2, 7.3, 8.3_
  - _Boundary: PersonalStatisticsSnapshot Builder_

- [ ] 2.6 通常のMatch再構築にprojectionとsnapshotを統合する
  - Match create/update/deleteで影響するscopeを先にversion 0へ無効化し、projection生成と既存rollup/snapshot再構築を段階別helperとして実行する。
  - 各scopeのprojectionとrollupが成功した後にだけ、そのscopeのsnapshotとversion 1を公開する。
  - 途中失敗したscopeはversion 0を保ち、再試行で同じprojectionとsnapshotに収束する。
  - _Depends: 1.2, 1.4, 2.4, 2.5_
  - _Requirements: 8.1, 8.3_
  - _Boundary: StatsRebuilder Lifecycle Integration_

- [ ] 2.7 全件repairをprojection-firstで再構築する
  - repair開始時に全対象scopeをversion 0へ無効化し、通常再構築のprojection/rollup helperを再利用する。
  - すべてのseason/league projectionを作り終えてから、scope rollupとsnapshotを再構築・公開する。
  - 失敗したscopeをreadyにせず、全件repairを繰り返しても同じ結果に収束する。
  - _Depends: 2.6_
  - _Requirements: 8.1, 8.3_
  - _Boundary: Statistics rebuild integration_

- [ ] 2.8 League/Season削除時に関連する統計read modelを消去する
  - League/Season削除経路から対象projectionとUserStats scope snapshotを削除する。
  - Season削除時は残るLeague/overall scopeを再構築し、League削除時は削除対象のscope以外を維持する。
  - 削除後に履歴・統計APIが孤立したprojectionやscopeを返さない。
  - _Depends: 1.2, 1.4, 2.6_
  - _Requirements: 8.1, 8.3_
  - _Boundary: Statistics rebuild integration_

- [ ] 2.9 固定scope・任意期間のsummary readerを実装する
  - summary取得の最初にtarget access policyを確認し、許可後にsnapshotまたはprojectionを読む。
  - 日付指定なしでは固定scope snapshotを使い、任意期間だけprojectionから同じ集計を作る。
  - ready/empty/uncomputedを区別し、固定scope本人表示の統計readをUserStats 1 documentに抑える。
  - _Depends: 1.3, 1.4, 1.6, 2.1, 2.5_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 7.1, 7.2, 8.3, 9.1_
  - _Boundary: PersonalStatisticsSummary Reader_

- [ ] 2.10 選択dimensionのanalysis readerを実装する
  - analysis前にtarget access policyを確認し、許可後に対象scopeのprojectionを読む。
  - 選択された期間/曜日/時間帯/席/相手/session内訳と直近windowの推移を一つのresponseで返す。
  - readiness、分母、相手/sessionのcursorを維持し、他targetの結果を返さない。
  - _Depends: 1.3, 1.6, 2.1, 2.2, 2.3_
  - _Requirements: 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 8.3, 9.1_
  - _Boundary: PersonalStatisticsAnalysis Reader_

- [ ] 2.11 cursor付き対局履歴readerを実装する
  - 履歴取得前にtarget access policyを確認し、許可後にtarget・scope・日時・形式でprojectionを読む。
  - 既定50/最大100件とopaque cursorを使い、ページ順とfilterを継続する。
  - ready/empty/uncomputedを区別し、記録済み対局情報だけを返す。
  - _Depends: 1.3, 1.6, 2.4_
  - _Requirements: 1.2, 1.4, 5.5, 5.6, 8.3, 9.1_
  - _Boundary: StatisticsMatchHistory Reader_

## 3. 認証付き統計API

- [ ] 3.1 statistics queryのscope・期間・dimension・page validationを実装する
  - overall/league/seasonそれぞれのID条件、日時順、game type、dimension、groupBy、window、limit、cursorを検証する。
  - 期間をfrom込み/toなしとし、履歴は既定50/最大100、推移windowは10/20/50に制限する。
  - 不正queryが統計repositoryへ届く前に共通validation errorになる。
  - _Depends: 1.1_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.2, 5.5, 6.4, 8.3_
  - _Boundary: Statistics Query Schemas_

- [ ] 3.2 統計service/repositoryをHTTP composition rootへ接続する
  - target access、summary/analysis/history reader、既存repositoryをサービス構成に登録する。
  - Hono routeから認証利用者IDとpathのtarget IDを別々に利用できる依存契約にする。
  - Composition rootから各readerへ同じ共有repository/access serviceが渡される。
  - _Depends: 1.6, 2.9, 2.10, 2.11_
  - _Requirements: 8.1, 9.8, 10.2_
  - _Boundary: Statistics Service Composition_

- [ ] 3.3 認証付きsummary/analysis/history endpointsを登録する
  - 3つのstatistics endpointでpath user IDをtarget、auth uidをviewerとしてreaderへ渡す。
  - 他人のtarget access checkはreader内で統一し、統計データ読取前に実行する。routeで二重のmembership policyを実装しない。
  - success envelope、validation/error envelope、403/404とready/empty/uncomputedを契約どおり返す。
  - _Depends: 3.1, 3.2_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.3, 9.1, 9.2, 9.8, 10.2_
  - _Boundary: Statistics HTTP Routes_

- [ ] 3.4 OpenAPIとAppTypeへ統計API契約を公開する
  - summary/analysis/historyのquery・response・error statusをOpenAPIへ登録する。
  - FEからHono AppType経由でrequest/response型を導出できる。
  - dimension union、status、cursor、target pathの契約がendpoint定義と一致する。
  - _Depends: 3.3_
  - _Requirements: 2.3, 5.5, 6.5, 9.2_
  - _Boundary: OpenAPI and AppType_

## 4. 個人成績画面

- [ ] 4.1 AppType由来のtyped API wrapperとview adapterを整備する
  - summary/analysis/historyと既存league/season members APIを共通client経由で呼ぶ。
  - nullable、status、対象ID、配列順、cursorをview modelへ保つ。
  - FEに順位・point・割合・集計の再計算を追加しない。
  - _Depends: 3.4_
  - _Requirements: 1.2, 1.3, 2.3, 8.2, 8.3, 9.1, 10.1_
  - _Boundary: Statistics API Client and Adapter_

- [ ] 4.2 statistics hookへ対象者選択とquery lifecycleを実装する
  - viewer/target、scope、期間、game type、active tabを保持し、cache keyにviewer/target IDと統計条件を含める。
  - target切替では期間・game typeを維持し、summaryと表示中viewを取得してhistory cursorをリセットする。古い応答を破棄する。
  - members候補はscopeごとに初回取得してcacheし、一覧取得失敗時も本人の成績を表示してselector再試行を可能にする。
  - _Depends: 4.1_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.4, 9.1, 9.2, 9.3, 10.1, 10.2, 10.3_
  - _Boundary: Statistics Page Hook and Query Cache_

- [ ] 4.3 (P) scope/期間/ゲーム形式filterを実装する
  - 全体/league/season、期間、全て/三麻/四麻を共通filterとして表示する。
  - filter変更はすべての統計領域へ同じscope条件を適用する。
  - 既存mainのSelect/Buttonとdesign tokenで選択中条件を表示する。
  - _Depends: 4.2_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.4, 8.4_
  - _Boundary: Statistics Scope Filter UI_

- [ ] 4.4 (P) league/season参加者の表示対象selectorを実装する
  - league/season時だけ既存members APIの候補を表示し、本人を初期選択にする。
  - target名を識別でき、候補一覧のloading/error/retryと本人表示を扱う。
  - overallでは他人を選べず、選択targetがscope外になった時は本人に戻す。
  - _Depends: 4.1, 4.2_
  - _Requirements: 2.1, 8.4, 9.6, 9.7, 9.8, 10.1, 10.2, 10.3_
  - _Boundary: StatisticsSubjectSelector_

- [ ] 4.5 (P) summaryと順位成績のoverviewを実装する
  - 対局数、総合point、平均順位、トップ率を優先KPIとして表示する。
  - 順位回数・率、形式別順位、scope順位と直上/直下との差を表示する。
  - 指標名・単位・集計対局数を示し、三麻の4位や未確定順位を実績として表示しない。
  - _Depends: 4.1_
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_
  - _Boundary: Statistics Summary and Rank UI_

- [ ] 4.6 (P) score指標と自己記録を表示する
  - 素点/最終pointの統計、順位別平均、符号分布、チョンボを区別して表示する。
  - 高低recordに記録日時・対象・同卓者を付け、連続指標の現在数と最長数を別に示す。
  - null、0、対象外を区別し、単位と分母を表示する。
  - _Depends: 4.1_
  - _Requirements: 2.1, 2.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 7.1, 7.2, 7.3_
  - _Boundary: Score Breakdown and Personal Records UI_

- [ ] 4.7 (P) 推移・暦別・直近成績のanalysis viewを実装する
  - 累計point、日/月/年、曜日、時間帯、日別順位分布と直近10/20/50戦を表示する。
  - 直近windowを全体成績と区別し、選択期間・形式を特定できる。
  - chartに凡例・単位・値の確認操作を付け、同じ値を表または読み上げ可能なtextでも提供する。
  - _Depends: 4.1_
  - _Requirements: 2.1, 2.3, 5.1, 5.2, 5.3, 5.4, 9.4_
  - _Boundary: Statistics Trend UI_

- [ ] 4.8 (P) 条件別成績のselectorと表を実装する
  - 期間/曜日/時間帯/席/相手/sessionの切り口を一つずつ選べるようにする。
  - 対象名、形式、対局数、割合の分母、相手/sessionの追加読込を表示する。
  - 相手差・席・sessionの行を同じscope/target条件のまま閲覧できる。
  - _Depends: 4.1_
  - _Requirements: 2.1, 2.3, 6.1, 6.2, 6.3, 6.4, 6.5_
  - _Boundary: Statistics Breakdown UI_

- [ ] 4.9 (P) 対局履歴と追加読込を実装する
  - 登録済み日時・league/season・session・形式・同卓者・席・順位・素点・最終pointを最新順に表示する。
  - 追加読込はopaque cursorを使い、重複・欠落なく次ページを追加する。
  - 局単位情報を推測せず、ready/empty/uncomputedを区別する。
  - _Depends: 4.1_
  - _Requirements: 2.1, 2.3, 5.5, 5.6_
  - _Boundary: Statistics Match History UI_

- [ ] 4.10 (P) 概要/分析/対局履歴のaccessible tabsを実装する
  - 3つのトップレベルtabとpanelを結び、選択状態を支援技術へ公開する。
  - キーボードでtabを移動・選択でき、focus位置を視認できる。
  - filterと表示対象者の選択をtab移動後も保持する。
  - _Depends: 4.2_
  - _Requirements: 2.1, 2.2, 2.3, 9.6, 9.7_
  - _Boundary: Statistics View Tabs_

- [ ] 4.11 個人成績pageを既存mainデザインと状態へ統合する
  - 既存AppShell、中央max-w-md、余白、2列KPI、共通Card/Table/Select/Button、色tokenを踏襲する。
  - 全領域を3 tabsと共通filterへ配置し、選択中target名を識別できるようにする。
  - loading/error/empty/uncomputed/ready、320px表示、各操作のkeyboard focus、全指標名・値の読み上げを成立させる。
  - _Depends: 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_
  - _Requirements: 2.1, 2.2, 2.3, 9.1, 9.2, 9.3, 9.5, 9.6, 9.7_
  - _Boundary: Statistics Page Integration_

## 5. acceptance criteriaと性能の検証

- [ ] 5.1 (P) 集計規則のunit testsを追加する
  - 三麻/四麻、分母、中央値、母標準偏差、符号分布、直近window、timezone、record/streak、席/相手/sessionの境界を検証する。
  - 0/1/2件、同時刻・session順、同順位、三麻のラスを含む期待値が固定される。
  - 既存node:test実行経路から対象suiteを実行できる。
  - _Depends: 2.1, 2.2, 2.3, 2.5_
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3_
  - _Boundary: Statistics Aggregation Tests_

- [ ] 5.2 Firestore emulatorでprojection/rebuild/repair/deleteを検証する
  - repositoryのupsert/prune/cursorとMatch create/update/delete後の結果を確認する。
  - 通常rebuildはscopeを先にversion 0にし、成功時だけversion 1を公開する。
  - full repairは全projection後にscope summaryを公開し、削除後に孤立scope/projectionが残らない。
  - _Depends: 2.6, 2.7, 2.8_
  - _Requirements: 5.5, 8.1, 8.3_
  - _Boundary: Projection Repository and Lifecycle Tests_

- [ ] 5.3 API validation・response・target access testsを追加する
  - scope/date/dimension/pageの不正値、404、uncomputed/empty/ready、共通ErrorEnvelopeを検証する。
  - 同scopeのviewer/targetを許可し、overall他人とscope外targetを403で拒否する。
  - access拒否時にUserStats/projection repositoryが呼び出されないことを確認する。
  - _Depends: 1.6, 2.9, 2.10, 2.11, 3.3, 3.4_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.3, 9.1, 9.2, 9.8, 10.1, 10.2_
  - _Boundary: Statistics Service and Route Contract Tests_

- [ ] 5.4 frontend request flow・accessibility・responsive表示を検証する
  - 初回summary、analysis/historyのlazy load、scope roster cache、target変更時のfilter維持と古い結果破棄を確認する。
  - selectorの失敗時に本人表示と再試行が使え、scope外へ移動したtargetが本人へ戻る。
  - 320px、keyboard操作、chartの表/text代替、tabsの読み上げ、指標名と値を既存frontend build/dev環境で確認する。
  - _Depends: 4.11_
  - _Requirements: 1.2, 1.4, 2.1, 8.4, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 10.1, 10.2, 10.3_
  - _Boundary: Statistics Frontend Contract and Accessibility Tests_

- [ ] 5.5 read数・response bytes・p95を経路別に測定する
  - self fixed summary、他人のsummaryとmembership read、任意期間/analysis、history、初回roster fetchを同じ再現データで比較する。
  - Firestore document read数、response bytes、p95を別々に記録し、固定scope snapshotとprojection scanの負荷を区別する。
  - 数値SLOは新設せず、測定結果を性能判断に使える形で残す。
  - _Depends: 2.9, 2.10, 2.11, 3.3_
  - _Requirements: 1.2, 8.1, 10.1_
  - _Boundary: Statistics API Performance Validation_
