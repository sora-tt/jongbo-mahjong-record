# 要件定義: frontend-session-match

## プロジェクト説明

Session・Matchを記録する利用者とFE実装者は、参加者選択、Session作成、初回・追加・編集Matchの入力、結果表示が別々のhook・mock・旧domain型に分散し、三麻/四麻の許容人数とSessionの固定メンバーを画面で保証できていない。現行コードはraw scoreからFEでrankを作り、Session結果でpointを合算し、Match編集で参加者を差し替えられる一方、BEはSession member snapshot、参加者完全一致、BE計算済みrank/point、欠番を許容するmatchIndexを正本としている。この仕様では、Player Selectで参加者を保持し、初回Match送信直前にSessionを作成し、Match作成失敗時はその送信で作成したSessionだけを削除してロールバックする。また、Match登録リクエストからrankを削除し、BEがraw scoreから算出したresponseのrankを表示する。これらを含め、`frontend-foundation-ui`、`frontend-league-season`、`backend-integrity-lifecycle`の契約を利用して、参加者選択からSession作成、Match登録・編集・一覧・詳細・結果確認までを共通フォームとAPI状態へ整理する。

## スコープと境界

### 対象

- Seasonの参加者候補からのPlayer select
- Sessionの作成、一覧、詳細、終了状態の表示
- 初回Match、追加Match、Match編集で共有する入力フォーム
- 三麻/四麻の人数、wind、Session member一致、raw scoreの入力制約表示
- Matchの作成、編集、一覧、詳細、既存の削除操作
- BEが返す`matchIndex`、`rank`、`point`、raw score、結果日時の表示
- loading、empty、API error、retry、二重submit防止、成功後の再取得
- 未接続button、mock依存、FE独自のrank/point表示処理の整理

### 対象外

- FEでのrank、point、standing、累計値、統計の再計算
- 新しい麻雀ルール、可変丸め、点数計算ロジックの追加
- 統計グラフ、個人成績、ランキング、旧domain型・mock・Reduxのリポジトリ横断削除
- Session member snapshotを作成後に変更する機能
- 複数端末同時編集、リアルタイム同期、BEのFirestore/API/ErrorEnvelope/認証契約変更
- 共通API client、共通UI primitive、Header/AppShell自体の再設計

### 隣接仕様との契約

- `frontend-foundation-ui` のHono `AppType`由来型、共通API client、`{ data }`、ErrorEnvelope、Cookie認証、AsyncState、UI primitivesを利用する。
- `frontend-league-season` のSeason詳細からのSession開始導線を受け取り、Session一覧・詳細とMatch画面を所有する。Season/Leagueの集計表示は所有しない。
- `backend-foundation` のcamelCase DTO、ISO 8601、Session/Match route、status、`rank`・`point`・`matchIndex`のresponse契約を正本として利用する。
- `backend-integrity-lifecycle` のSession固定member、三麻の`east/south/west`、四麻の`east/south/west/north`、Match参加者完全一致、BE計算結果、欠番を許容するmatchIndexを画面へ反映する。

## 要件

### Requirement 1: Player selectとSession参加者

1.1 When 利用者がSession開始を選択するとき, the Session-Match Feature shall Seasonの現在のmembersとLeague ruleの`gameType`を取得し、候補と三麻/四麻の選択条件を表示する。

1.2 When `gameType`が`sanma`である状態, the Session-Match Feature shall `east`・`south`・`west`の3枠だけを必須として表示し、`north`をSession参加者として受け付けない。

1.3 When `gameType`が`yonma`である状態, the Session-Match Feature shall `east`・`south`・`west`・`north`の4枠を必須として表示する。

1.4 While Player selectが表示されている状態, the Session-Match Feature shall 同一userIdの重複選択を防ぎ、候補外・欠落・不正人数を送信前にエラーとして表示する。

1.5 When Sessionが作成された後に別の参加者で対局を開始しようとするとき, the Session-Match Feature shall 既存Sessionのmembersを差し替えず、新しいSessionの作成へ誘導する。

1.6 If 参加者候補の取得中、空配列、401、403、404、transport errorのいずれかが発生した場合, the Session-Match Feature shall 対象領域のloading、正常なempty、認証遷移、権限・対象エラー、再試行可能なエラーを区別して表示する。

### Requirement 2: Sessionの作成・一覧・詳細

2.1 When Player Selectで保持した参加者を使って初回Matchを送信するとき, the Session-Match Feature shall Match作成の直前にBEのSession作成契約へ重複のないmemberUserIdsを一度だけ送信し、作成成功後のSession member snapshotをそのMatchと以後のMatch入力の正本として扱う。

2.2 When Season配下のSession一覧を表示するとき, the Session-Match Feature shall `GET /api/leagues/:leagueId/seasons/:seasonId/sessions`のSession DTOを利用し、startedAt、endedAt、memberCount、totalMatchCount、tableLabelをAPIの値のまま表示する。

2.3 When Session詳細を表示するとき, the Session-Match Feature shall `GET /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId`のmembers、memberCount、totalMatchCount、開始・終了状態を表示し、membersをSeasonの現在値で置換しない。

2.4 When 利用者がSessionを終了するとき, the Session-Match Feature shall 許可されたendedAtまたはtableLabelだけを更新し、成功後にSession詳細とMatch一覧を再取得して最新状態を表示する。

2.5 If Session一覧または詳細の取得・更新に失敗した場合, the Session-Match Feature shall empty、validation、authentication、forbidden、not_found、conflict、transport/decode errorを区別し、入力を失わず再試行可能な状態を表示する。

2.6 If 初回Match作成が、同じ送信で新規作成したSessionの後に失敗した場合, the Session-Match Feature shall その送信で作成したSessionだけをDELETEしてロールバックし、既存Sessionを削除せず、Match作成の失敗を入力保持付きで表示する。

### Requirement 3: 初回・追加・編集の共通Matchフォーム

3.1 When 初回Match、追加Match、既存Match編集のいずれかを表示するとき, the Session-Match Feature shall 同じMatchフォーム契約でSession members、wind、raw score、playedAt、送信中状態を表示し、画面ごとに別の参加者・点数入力規則を持たない。

3.2 While Matchフォームが表示されている状態, the Session-Match Feature shall Session membersと完全一致するuserIdだけを表示し、三麻/四麻で許可されたwindを一度ずつ選択できるようにし、編集時の参加者変更を許可しない。

3.3 When raw scoreを入力するとき, the Session-Match Feature shall BE契約から取得したstartingPointsと参加人数に基づく入力範囲・整数・合計制約を利用者へ示し、入力不能値や合計不一致をAPI呼び出し前に表示する。

3.4 When Matchフォームを送信するとき, the Session-Match Feature shall rankをMatch登録リクエストへ含めず、pointも送信せず、raw scoreその他のBE入力契約だけを送信し、BEが算出して返したresponseのrank/pointを表示用状態へ渡す。

3.5 If Match作成・更新が失敗した場合, the Session-Match Feature shall 入力値を保持し、validation、conflict、authentication、forbidden、not_found、internal、transport/decode errorに応じた安全なメッセージを表示する。

3.6 While Matchフォームのmutationが実行中である状態, the Session-Match Feature shall submit、戻る、参加者変更などの競合操作を適切に無効化し、二重submitを防止する。

### Requirement 4: Matchの作成・編集・一覧・詳細

4.1 When 初回または追加Matchを登録するとき, the Session-Match Feature shall `POST /api/leagues/:leagueId/seasons/:seasonId/sessions/:sessionId/matches`へrankを含めず、Session memberと完全一致するresultsを送信し、別参加者を登録するために既存Sessionを再利用しない。初回Matchでは直前に作成したSessionを使用する。

4.2 When Match一覧または詳細を表示するとき, the Session-Match Feature shall `GET`のMatch DTOからplayedAt、Session、各結果のuserName、wind、rawScore、BE算出済みrank、BE算出済みpointを表示する。

4.3 When Match一覧を表示するとき, the Session-Match Feature shall BEが返した`matchIndex`をそのまま表示し、削除による欠番をFEで詰めたり連番へ補正したりしない。

4.4 When 利用者がMatchを編集するとき, the Session-Match Feature shall `PATCH`へrankを含めず、Session membersと一致する結果と編集可能なplayedAt/raw scoreだけを送信し、既存Matchのparticipant集合またはmatchIndexをFEで変更しない。

4.5 When Matchの作成、更新、削除が成功するとき, the Session-Match Feature shall optimistic updateで画面を確定せず、BEの一覧・詳細を再取得してcomputed rank、point、matchIndex、totalMatchCountを表示する。

### Requirement 5: 結果表示と画面操作

5.1 When Match登録・編集が成功するとき, the Session-Match Feature shall 対応するSession詳細またはMatch一覧・詳細へ明確に遷移し、未接続のsubmitやconsole出力で完了扱いにしない。

5.2 When Session結果画面を表示するとき, the Session-Match Feature shall 各Matchのraw score、rank、point、matchIndexをBE responseの値で表示し、FEで新しい順位・ポイント・累計値を計算して表示しない。

5.3 When SessionまたはMatchの主要buttonを表示するとき, the Session-Match Feature shall route遷移、API mutation、retry、戻る、または未対応理由を持つdisabled状態のいずれかを提供し、見た目だけで何も起きないbuttonを残さない。

5.4 The Session-Match Feature shall 統計グラフ、個人成績、ランキング、旧domain型・mock・Reduxの全削除を本仕様の実装範囲へ取り込まず、後続の`frontend-statistics-quality`へ引き渡す。

### Requirement 6: API・状態・表示の共通境界

6.1 When Session/Match APIを利用するとき, the Session-Match Feature shall `frontend-foundation-ui`のAppType由来のrequest/response型、共通client、ErrorEnvelope、Auth boundary、AsyncStateを利用し、route componentから直接fetchしない。

6.2 When API DTOを画面modelへ変換するとき, the Session-Match Feature shall opaque ID、camelCase、ISO 8601、nullable値、sanmaのfourth系null、BE算出済みrank/pointを保持し、必須値を0・空文字・現在日時へ置換しない。

6.3 While API requestが実行中、またはroute parameterが変化した状態, the Session-Match Feature shall 対象領域のloading、retry、emptyを共通UIで表現し、AbortSignalまたはrequest sequenceで古い結果が新しいSession/Match画面を上書きすることを防ぐ。

6.4 If APIが401、403、404、409、validation error、internal error、network/timeout/decode errorを返す場合, the Session-Match Feature shall 401だけをAuth boundaryへ委譲し、それ以外を認証redirectと混同せず安全な利用者向け状態として表示する。

### Requirement 7: 検証・境界・再検証

7.1 When upstreamのAppType、Session/Match DTO、ErrorCode、status、gameType、wind、Match requestからのrank除外、responseのrank/point、matchIndex契約が変更されるとき, the Session-Match Feature shall feature API、adapter、form、表示、契約検証を再確認する。

7.2 When frontendのtypecheck、lint、buildを実行するとき, the Session-Match Feature shall Session/Matchの型境界、React/Next route、shared UI利用、未接続button・mock fallback・FE計算の違反を検出できる状態を提供する。

7.3 The Session-Match Feature shall backendのSession/Match整合性、点数・順位計算、集計・削除ライフサイクル、共通API client/UI primitive本体を変更せず、BE計算結果を表示する境界に留める。

## 仮定・未解決事項

- 現行のSeason詳細をSession開始の入口とし、Session一覧はSeason詳細内または同画面から到達できる一覧領域として統合する。既存の`/sessions/[sessionId]/results`はSession詳細・結果表示の互換入口として扱い、別の新規Session詳細routeを増やさない前提で進める。
- SessionはPlayer Selectで参加者を一時保持し、初回Match送信直前に一度だけ作成する。初回Match作成が失敗した場合は同じ送信で作成したSessionを削除してロールバックし、既存Sessionや既存Matchを削除しない。
- Match登録リクエストのrankは削除する。FEはrankを計算せず、BEがraw scoreから算出して返すresponseのrankを表示する。pointも従来どおりBE responseだけを表示する。
- raw scoreの表示単位は現行画面の「100点単位入力」とBEの整数raw score契約を踏襲する。入力単位を変更する場合はフォーム仕様とBE validationを同時に再検証する。
