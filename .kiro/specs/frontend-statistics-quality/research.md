# 調査記録: frontend-statistics-quality

## 要約

- 既存の`/api/users/:userId/stats`、`UserStats`、`StatsRebuilder`を拡張点として利用できる。対局の登録・更新・削除後にシーズン、リーグ、全体の再集計が同期的に呼び出されている。
- `user_stats`には対局数、総ポイント、平均順位、順位別回数/率、素点の最高/最低/平均、チョンボ、streak、現在順位が既にscopeごとに保存される。今回追加する固定scope summaryもこの既存のmaterialized read pathに載せられる。
- 正本の対局記録には日時、セッション内順序、席、順位、素点、最終ポイント、参加者、チョンボがある。局単位の牌譜データはない。
- 現行`user_stats`は要件で必要な中央値、ばらつき、条件別比較、期間別記録、対局履歴を持たず、期間・形式・席・対戦相手・セッションによる検索も提供しない。
- 個人成績画面は`/stats`にあり、シーズン選択、4つの指標カード、順位回数表までを表示する。`Recharts`と既存の統計カード、API client、状態コンポーネントを再利用できる。
- 表示対象者の候補には既存のleague/season members APIを使える。いずれも認証利用者が対象scopeの参加者か確認し、参加者一覧を返す。
- 既存統計APIは本人専用である。他参加者へ切り替えるにはstatistics routeでviewer/targetを分け、両者が同一league/seasonに属することをbackendで確認する必要がある。
- 要件は記録済み対局を基にしたサーバー集計とUI拡充を含む。最終ポイント計算、順位決定、対局管理の責務は現行機能に残す。

## 要件と現行資産の対応

| 要件領域 | 現行資産 | 状態 | 不足・制約 |
|---|---|---|---|
| 全体・リーグ・シーズン集計 | `StatsRebuilder`, `UserStatsRepository`, `user_stats` | 一部あり | 基本指標のみ。全体の順位指標は三麻・四麻の混在を避ける別集計が必要 |
| 対局登録後の反映 | `MatchService`が作成・更新・削除後に`rebuildSeason`をawait | 一部あり | 拡張した派生データの再構築・削除・修復手順を追加する必要がある |
| 得点分布、中央値、標準偏差 | `buildUserStats`、`MatchResult` | 不足 | 素点の一部基本集計だけ。最終ポイント側の記録・中央値・標準偏差、分布、順位別平均がない |
| 日時・期間・直近推移 | `Match.playedAt`, `matchIndex`, `sortMatches`, Seasonの`pointProgressions` | 一部あり | 個人向け日時系列・期間集計・曜日・時間帯・直近N戦のAPIがない |
| 席・相手・セッション比較 | `MatchResult.wind`, `Match.results`, `Match.sessionId` | 不足 | user単位で検索できる投影データと集計APIがない。対局正本はリーグ/シーズン/セッション配下 |
| 対局履歴 | `MatchRepository.list*`, match一覧UI | 一部あり | 個人履歴用の全体スコープ、ページング、条件絞り込みがない |
| 認証・エラー | `users` routeの本人ID照合、`requireAuth`, 共通ErrorEnvelope | 一部あり | 現行stats routeは本人専用。新statistics routeではviewer/targetを分け、他人は同じleague/seasonの参加者に限定する |
| 参加者選択 | `GET /api/leagues/:leagueId/members`, `GET /api/leagues/:leagueId/seasons/:seasonId/members`, FE contracts | あり | 候補取得に再利用できる。target切替で一覧を再取得しないようscope単位でFE cacheする |
| 画面構成・状態 | `frontend/src/app/stats`, `features/statistics`, 共通Loading/Error/Empty | 一部あり | 既存ページを置き換え、指標別セクションと条件切り替えを追加する |

## 統合上の調査結果

- `UserStats`はoverall/league/season単位の単一文書で、履歴や対戦相手別配列を詰める用途には向かない。Firestore文書サイズと更新頻度を考慮し、概要値と対局粒度データの保管境界を分ける必要がある。
- `MatchRepository.listAll()`は全リーグ・全シーズンの対局を列挙する既存処理である。`results`は配列内オブジェクトなので、現在の正本だけから特定ユーザーの対局を効率的にFirestore検索できない。
- 一人一対局の検索投影を持てば、ユーザー・期間・ゲーム形式で対象を絞り、履歴をカーソルページングできる。推移や条件別集計は対象ユーザーの投影からサーバー側で作れる。
- `gameType`はリーグルールにあり、全体集計では複数形式が混在し得る。各対局の結果行数から実際の参加人数（三人または四人）を確認できる。順位率・ラス・席比較は形式別に返す必要がある。履歴の形式判定には対局時の結果行数を使い、後から変更されたリーグルールで過去対局を再分類しない。
- `statsRebuilder.ts`は現在、各match write後にシーズン結果、リーグ統計、全体user statsを再構築する。新しい投影も同じ再構築境界でupsertし、シーズン削除・リーグ削除・既存repair経路から古い投影を除去・再生成する必要がある。
- 現在の`UserStatsRepository.get`は決定的document IDによる単一文書取得で、既存個人成績APIは一回のdocument readで基本集計を返せる。`StatsRebuilder`は既に変更時にscope集計を同期再構築するため、拡張summaryを同一`user_stats` documentに加えれば、画面表示時の再走査を避けられる。summary専用documentを別collectionへ複製する必要はない。
- `backend/firebase.json`は`firestore.indexes.json`を参照し、現行ファイルにはmembersとuser_statsの複合indexが定義されている。新しいuser-match queryで必要な複合indexをこのファイルに追加する。
- 画面は`/stats`、APIはHono `AppType`、FE型は`InferResponseType`から導出する。新しいライブラリを追加する必要はない。既存のRecharts、共通カード・テーブル・状態表示を利用できる。
- `backend/src/presentation/routes/leagues.ts`と`seasons.ts`にmembers routeがあり、`LeagueService.listLeagueMembers`と`SeasonService.listSeasonMembers`が認証利用者の参加を確認している。FEの`frontend/src/lib/api/contracts.ts`にも両方のresponse型が定義済みで、新しい候補APIは不要。
- `backend/src/presentation/routes/users.ts`の既存`/:userId/stats`は認証uidとpath userIdの一致を要求する。新statistics routeはpath userIdをtargetとして扱い、認証uidをviewerとして渡す必要がある。既存routeの本人チェックをそのまま流用すると対象者切替を拒否するため、統計専用のscope access serviceへ認可を分離する。
- Leagueの参加者は`leagues/{leagueId}/members` subcollection、Seasonの参加者はseason document内の`members`に保存される。候補一覧APIは既存形式を再利用し、stats requestの認可ではleague member subcollectionをviewer/target IDで絞り、season documentのmembers内で両IDを確認する。全対局や統計projectionを認可のために読む必要はない。
- 他人のsummary/analysis/history request前にmembershipを検証する追加readが発生する。leagueではviewer/target user IDのmember document lookup、seasonではseason document readが認可readの単位になる。固定scope summaryの`user_stats` 1 readとは分けてread countとp95を測る。
- Core steeringの`product.md`、`tech.md`、`structure.md`とspec templateのdesign/researchファイルはこのcheckoutにない。プロジェクトの`AGENTS.md`、現行コード、既存spec形式を文脈として使う。

## 実装案の比較

### 案A: 既存`user_stats`だけを拡張する

- 既存の集計再構築、repository、stats APIを最小変更で利用する。
- 累積指標には適するが、対局履歴、相手・席・曜日・期間の任意絞り込みを単一文書へ保存できない。複合比較を固定フィールドとして増やし続けることになり、履歴保持にも適さない。

### 案B: API取得時に正本のmatchを全件走査する

- Firestoreの保存形式を変更せず、対局情報から都度集計できる。
- 個人成績取得のたびに全リーグ・全シーズンを読む可能性がある。ユーザー履歴のページングと期間絞り込みを正本の構造だけでは効率化しにくい。既存の`listAll`依存を読取APIにも持ち込む。

### 案C: user-match投影から毎回集計する

- 各参加者・各対局に対する検索用read modelを冪等に再構築し、新しい統計APIはユーザーの投影を条件で取得して集計する。任意期間や分析dimensionに柔軟に対応できる一方、summary requestごとに対象match数に比例してdocumentを読み、responseごとに集計する。
- 対局1件につき最大4件の投影書き込みとFirestore複合indexが増える。再構築失敗・古い投影・バックフィルの扱いを明示する必要がある。

### 案D: user-match投影と既存UserStatsの事前集計を併用する

- 固定scopeの追加成績を既存`user_stats` documentへ保存する。overview summaryは1 document readで返し、既存APIとフィールドの互換を保つ。
- 対局別projectionは履歴、選択されたanalysis dimension、任意期間summaryに使う。可変長データをsummary documentへ埋め込まない。
- 読取負荷を表示時から対局変更時の同期rebuildへ移せる。既存`StatsRebuilder`の計算と書き込みが増え、任意期間とanalysisでは対象match数に比例する読み取りが残る。

## 設計判断へ反映した調査事項

- 案Dを採用し、既存`UserStats`をscope別snapshotとして拡張する。projection更新とsummary再構築は`StatsRebuilder`内で同期し、固定summaryとon-demand analysis/historyを分け、必要な複合indexを既存設定へ追加する。
- 統計の日時区切りは既存UIの`ja-JP`表示に合わせて`Asia/Tokyo`に固定する。日付期間はISO datetimeの半開区間とし、期間・曜日・時間帯の分類境界を同じzoneにそろえる。
- 再構築中の失敗で正本とread modelがずれる可能性があるため、version 0で対象scopeを未計算にし、同期再構築成功時だけversion 1を公開する。既存repair経路を復旧境界として使う。

## デザイン統合メモ

### 一般化

期間、曜日、時間帯、席、相手、セッションは個別の固定集計モデルに分けず、共通の対象スコープ（全体/リーグ/シーズン/期間/ゲーム形式）を受けるbreakdown queryとして扱う。UIも共通の条件表示と対象別行テーブルを再利用し、指標計算はサーバー側に限定する。

### 採用と自作

- チャート: 既存のRechartsを採用し、ポイント推移に利用する。機能要件のための新規可視化依存は追加しない。
- API型: 既存Hono `AppType`と`InferResponseType`を採用する。
- 集計: mahjong-specificな順位・ラス・同卓差の定義が必要で、既存のドメイン計算と一貫させるため、専用のドメイン関数を実装する。汎用分析ライブラリは追加しない。
- 履歴検索: 正本の結果配列をユーザー単位で検索できないため、既存の集計文書だけでは不足する。ユーザー対局read modelを採用候補とする。

### 簡素化

- summary専用の新collectionは追加せず、既存`user_stats`へbounded aggregateを保存する。履歴や任意条件の行は同じdocumentへ格納せず、match粒度のprojectionから求める。
- APIはsummary、推移と選択dimensionをまとめたanalysis、ページング履歴の3つの応答責務に分ける。overviewは初期取得し、analysis/historyはタブ選択時に取得して画面内cacheで再利用する。
- 新しい汎用分析フレームワーク、レーティングモデル、リアルタイム同期、牌譜解析は導入しない。

### UI/UX design search

- `ui-ux-pro-max`のresponsive UX検索では、mobile-first、狭い幅のtableを内部scrollまたはcard rowにする指針を確認した。画面設計に反映し、ページ全体の横overflowを避ける。
- chart検索では、時間推移にline chart、少数カテゴリ比較にbar chartを推奨し、色だけに依存しない表/テキスト代替とkeyboard focus時の値確認を求めていた。既存Rechartsを利用する。
- Next.js検索結果はNext.js 16.2向けで、画像・Server Component取得など本画面に直接当たらない内容だった。実行環境はNext.js 15.5.19のため、その指針は採用しない。
- `frontend/src`には再利用可能なTabs primitiveまたは既存のtablist実装が見当たらないため、画面固有の`StatisticsViewTabs`を追加し、標準的なtablist/tab/tabpanelとkeyboard操作を実装する。
- mainブランチの`frontend/src/app/stats/page.tsx`は`AppShell`、中央寄せ`max-w-md`、`px-4 py-8`と縦方向`gap-6`、2列KPIで構成される。既存の`StatisticsMetricCard`、`Card`、`Table`、`Select`、`Button`、design tokenを再利用し、今回の追加で独自の広幅レイアウト・色・タイポグラフィを持ち込まない。
- [GOV.UK Design Systemのタブ指針](https://design-system.service.gov.uk/components/tabs/)は、関連する内容で全項目を同時に見る必要がない場合のタブ利用を案内し、比較・通読が必要なら見出し付き1ページやページ内リンクも候補としている。[Android Developersのタブ指針](https://developer.android.com/develop/ui/compose/components/tabs)は、主タブとコンテンツ内の副タブを区別している。これを踏まえ、画面全体を3つの同列な用途に分け、分析内の条件選択は入れ子タブを避ける。
- [天鳳公式マニュアル](https://tenhou.net/man/index.html)のランキング項目には、通算/平均得点、平均順位、トップ/連対/ラスなどが別指標として示されている。本画面では全体把握を「概要」、時間推移・条件比較を「分析」、個別記録を「対局履歴」に分ける。

## Effort / Risk

- **Effort: L (1–2週間)** — Firestore read modelと更新・削除・修復、複数集計API、個人成績画面、契約・UI検証を一つのIssueで整合させる必要がある。
- **Risk: Medium** — 既存の同期再集計と型付きAPIが足場になる一方、Firestore文書・複合index・再構築失敗時のread model整合が新しい責務となる。

## Final Design Decisions

- 案Dを採用し、`user_match_statistics`のユーザー×対局projectionと、既存`user_stats` document内のbounded `personal_statistics` snapshotを併用する。version markerはprojectionとsummary rebuildが完了したscopeを示す。
- Projectionとsummaryの更新は`StatsRebuilder`に統合し、変更対象scopeを先にversion 0へ無効化してから再構築する。全projectionとrollupが完了したscopeだけversion 1を公開し、失敗時はuncomputedを維持する。bulk repairはprojection-firstとし、Season/League削除もprojectionおよびUserStats scopeを同じread model境界で削除する。
- 新規APIはsnapshot summary、選択dimensionと最大50点の推移をまとめたanalysis、cursor付きhistoryの3 routeに分ける。summaryに全対局progressionは含めず、response contractはHono `AppType`から導出する。
- 固定scope summaryのFirestore readは1 document、任意期間/analysisはprojection queryに比例する。タブのlazy requestとquery cacheでHTTP requestを抑える。実データのread数・response bytes・p95を記録し、数値SLOは新設しない。
- 形式は保存済みmatchの`results.length`から判別する。三麻・四麻の順位/率/席は分け、日付分類と時間帯集計は`Asia/Tokyo`に固定する。
- 既存`backend/firestore.indexes.json`へ必要なuser/scope/date複合indexを追加する。全体repairでは各league/season projectionを生成した後にoverall scopeを完了させる。
- `/stats`は共通フィルターと「概要／分析／対局履歴」の3タブにする。概要はKPI・順位/スコア・自己記録、分析は推移・条件別、履歴は個別対局を表示する。対象フィルターはタブ間で保持し、分析の条件軸は選択メニューで切り替える。
- 表示対象の候補は既存members APIをscope単位で取得・cacheする。統計APIでは`:userId`をtarget、認証uidをviewerとして扱い、他人の成績は両者が同一league/seasonの参加者の場合だけ許可する。全体scopeは本人のみとする。
- 表示対象の切替ではscope/期間/game typeを維持し、summaryと表示中のanalysis/historyをtarget別queryとして取得する。query keyにviewer IDとtarget IDを含め、古いtargetの値を混在させない。scope変更で現在のtargetが候補にいなければ認証利用者へ戻す。
- 見た目と基本レイアウトはmainブランチの`/stats`を踏襲する。中央寄せ`max-w-md`、縦積み、2列KPI、既存の色tokenと共通UIを保ち、新しいタブだけ既存ナビゲーションと同じ配色・focus表現で追加する。

## 文書状態

既存コード調査を中心とするbrownfield gap analysis、タブ設計の一次資料調査、Firestore read pathの比較を実施した。新規ライブラリは不要なため外部依存のAPI調査は行っていない。読取速度を優先して固定scope summaryを既存`user_stats`へmaterializeし、変更時の同期rebuildへ計算を寄せる決定をdesign.mdに反映した。表示対象者切替には既存members APIとFE contractを再利用し、統計APIの認可だけをviewer/targetに分離する。実データ件数・p95と追加membership readはまだ計測しておらず、実装時のvalidation hookで比較する。
