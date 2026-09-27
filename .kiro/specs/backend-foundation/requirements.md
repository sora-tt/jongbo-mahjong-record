# 要件定義: backend-foundation

## プロジェクト説明

BEを利用するFE実装者と運用者は、永続データ定義、API、認証、seed、ドキュメントの正本が一致せず、同じ情報を扱う実装ごとに解釈を変える必要がある。現行BEは基本CRUDを持つが、リーグ内の `rule` と独立したルールマスタ、JSON body とヘッダーの認証方式、保存形式とDTO、エラー・OpenAPI・Swaggerの記述に差異がある。この仕様では、BEの正本データ契約、認証ライフサイクル、API契約、契約関連の運用資材を統一し、FEと後続BE仕様が一つの契約を参照できる状態にする。

## スコープと境界

### 対象

- users、leagues、league members、seasons、sessions、matches、user stats の正本データ契約
- リーグ内に保存する `rule` の形、識別子、統計一意性、日時・nullの扱い
- `rule.uma` の合計0不変条件とLeague作成・更新時のBE検証
- session cookie を中心とした認証、CORS、保護APIの認証境界
- Health/Auth/Users/Leagues/Seasons/Sessions/Matches APIのDTO、成功・エラー・204契約
- OpenAPI、Swagger、API reference、auth design、seed、index、Firestore Rules、契約テスト

### 対象外

- Session/Matchの業務制約、三麻・四麻の入力整合性、点数計算、順位・集計アルゴリズム、削除ライフサイクル
- FEの型・画面・API adapter・共通UI。ただし `rule.uma` 合計0を同じ条件で表示検証するための隣接契約は対象とする
- 独立した新しいルールマスタ機能
- 既存本番データの無計画な一括移行や破壊的移行の実行

### 隣接仕様との契約

- `backend-integrity-lifecycle` は、本仕様が定めるリーグ内 `rule` とAPI DTOを入力契約として、Match/Sessionの業務制約・計算・集計・削除・active seasonの整合性を決める。
- `frontend-foundation-ui` は、本仕様のcamelCase DTO、認証Cookie、エラー envelope、OpenAPI/Hono RPC型、`rule.uma` 合計0の判定条件とvalidation detailsを参照する。FEは入力表示時に同じ制約を検証するが、BE検証を代替しない。
- 既存データのバックアップ、互換読み取り、移行実行は別途承認された移行計画がない限り本仕様の実装作業に含めない。

## 要件

### Requirement 1: 正本データ契約

1.1 When 対象エンティティが保存され、その後APIから読み出されるとき, the Backend Foundation shall エンティティの識別子、親子関係、必須値、nullable値を同じ意味で保持し、実装箇所ごとの別解釈を発生させない。

1.2 When リーグのルールが保存または返却されるとき, the Backend Foundation shall `rule` をリーグ自身に属する値として扱い、`gameType`、`uma`、`oka` を含む一つの契約として返却する。

1.3 When 永続データとAPI DTOの間で値が変換されるとき, the Backend Foundation shall 永続データのsnake_caseとAPI・Domain DTOのcamelCaseを対応づけ、日時をISO 8601文字列として返却する。

1.4 When Emulatorまたはseedから基準データが投入されるとき, the Backend Foundation shall 本番相当の正本データ契約、nullable規則、識別子関係と矛盾しないデータを生成する。

### Requirement 2: 識別子と個人成績の一意性

2.1 When 個人成績がユーザーと集計スコープで参照されるとき, the Backend Foundation shall `userId` と `scopeType` に加えて必要な `leagueId` または `seasonId` で一意となる一件の正本を返却する。

2.2 When 同じユーザー・スコープの個人成績が再計算されるとき, the Backend Foundation shall 既存の正本を更新し、同じ一意キーを持つ重複レコードを作成しない。

2.3 When 新しい対象エンティティが作成されるとき, the Backend Foundation shall クライアントが依存できる不透明な文字列識別子を発行し、既存データの識別子を移行計画なしに変更しない。

2.4 If 既存データの正本化に移行が必要な状態, the Backend Foundation shall バックアップ、互換性確認、ロールバック方針が承認されるまで破壊的な書き換えを実行しない。

### Requirement 3: 認証ライフサイクル

3.1 When 有効なFirebase ID Tokenを `POST /api/auth/session` の `x-id-token` ヘッダーで受信するとき, the Backend Foundation shall `jongbo_session` HttpOnly Cookieを発行し、認証済み状態と有効期限を返却する。

3.2 If session交換のヘッダーが欠落、無効、期限切れの場合, the Backend Foundation shall 401と標準authentication errorを返却し、認証情報または内部検証詳細をレスポンスや通常ログに出力しない。

3.3 While 保護対象APIが呼び出されている状態, the Backend Foundation shall `jongbo_session` Cookieを検証して認証済みユーザーを確定し、session交換以外ではID Tokenヘッダーを認証経路として受け付けない。

3.4 When `DELETE /api/auth/session` が呼び出されるとき, the Backend Foundation shall session Cookieを失効扱いにしてCookieを削除し、bodyのない204を返却する。

3.5 When 許可済みFE originからCookie付きAPIが呼び出されるとき, the Backend Foundation shall 明示的なorigin許可とcredentials送信を適用し、ワイルドカードoriginを使用しない。

### Requirement 4: HTTP API契約

4.1 When JSON形式の成功レスポンスを返却するとき, the Backend Foundation shall `{ "data": ... }` envelopeを使用し、DTOのキーをcamelCase、日時をISO 8601文字列として返却する。

4.2 When 入力検証、認証、認可、存在確認、競合、予期しない障害のいずれかが発生するとき, the Backend Foundation shall `{ "error": { "code": string, "message": string, "details": object } }` envelopeと対応するHTTP statusを返却する。

4.3 When リソース作成、更新、削除のAPIが成功するとき, the Backend Foundation shall 作成を201、JSONを返す更新を200、bodyを返さない削除を204として一貫して返却する。

4.4 If リクエストの必須値、型、enum、関連IDの形式が契約に適合しない場合, the Backend Foundation shall 業務サービスを実行する前にvalidation errorとして拒否する。

4.5 When FEまたは後続BE仕様がHealth、Auth、Users、Leagues、Seasons、Sessions、MatchesのAPIを利用するとき, the Backend Foundation shall ルート、認証要否、入力、出力、エラー、statusを同じ公開契約として提供する。

### Requirement 5: 永続層の安全な運用契約

5.1 When 正本データの一覧、scope検索、時系列取得が実行されるとき, the Backend Foundation shall 利用するクエリに必要な複合indexを宣言済みの状態で提供し、環境依存の手動index作成を前提にしない。

5.2 While 本番環境でクライアントが直接永続層へアクセスできる状態, the Backend Foundation shall デフォルト拒否を基本とするRulesを適用し、認証されていない読み書きを全許可しない。

5.3 If 永続層への読み書きが認証・認可境界を満たさない場合, the Backend Foundation shall データを返却または変更せず、APIでは標準authentication/forbidden errorを返却する。

5.4 When 認証または個人データを扱う処理でログを記録するとき, the Backend Foundation shall ID Token、session Cookie、サービスアカウント秘密情報をログへ出力しない。

### Requirement 6: 契約ドキュメントと基準データ

6.1 When APIが起動して公開されるとき, the Backend Foundation shall runtime OpenAPI、Swagger UI、API reference、auth designが同じルート、schema、認証方式、レスポンス契約を示す。

6.2 When 契約に関わる型、status、認証方式、保存フィールドが変更されるとき, the Backend Foundation shall 実装、seed、index、Rules、runtime OpenAPI、静的ドキュメント、契約テストを同じ変更単位で更新対象にする。

6.3 When 開発者がEmulatorでseedを実行するとき, the Backend Foundation shall 認証ユーザー、プロフィール、リーグ、メンバー、シーズン、セッション、個人成績を契約に従って再現し、seedだけが持つ別スキーマを作成しない。

### Requirement 7: 契約検証と後続仕様への引き渡し

7.1 When 契約テストが実行されるとき, the Backend Foundation shall 認証成功・失敗、Cookie属性、保護API拒否、DTO変換、error envelope、204、OpenAPI route/schema整合を検証する。

7.2 When FEまたは後続BE仕様がAPI型を参照するとき, the Backend Foundation shall 実装と検証が同じルート型・DTO定義を参照できる契約境界を公開する。

7.3 If 正本データ、認証、API status、DTO、エラー、Rules、indexのいずれかを変更する場合, the Backend Foundation shall `backend-integrity-lifecycle` と `frontend-foundation-ui` に影響範囲と再検証対象を引き渡す。

### Requirement 8: rule.uma 合計0不変条件

8.1 When Leagueの作成または更新要求に `rule.uma` が含まれるとき, the Backend Foundation shall 非nullの `uma.first`、`uma.second`、`uma.third`、`uma.fourth` の合計が厳密に0であることを永続化前に検証する。

8.2 If `gameType` が `yonma` で `uma` の4値合計が0でない、または `gameType` が `sanma` で `uma.fourth` がnullではないか3値合計が0でない場合, the Backend Foundation shall 400の `validation_error` として拒否し、`rule.uma` のfield、期待値0、実際の合計をerror detailsに含め、Leagueを部分更新しない。

8.3 When FEがLeagueのrule入力または表示状態を検証するとき, the Frontend Foundation shall BEと同じ三麻・四麻の合計対象を使って `rule.uma` の合計0違反を表示し、BEへの送信前に無効状態を利用者へ示す。BEのvalidation結果を成功扱いに変換してはならない。

8.4 When 有効なLeague ruleが点数計算へ渡されるとき, the Point Calculation Service shall `uma` 合計0をrank bonusのゼロサム前提として扱い、`oka` とraw scoreの不変条件を別に適用し、無効な `uma` を暗黙に正規化または再配分しない。

## 仮定・未決事項

- `rule` はbriefで指定された現行契約に合わせ、`gameType`、`uma`、`oka` のみを正本フィールドとする。seedにのみ存在する `scoreCalculation` は本仕様のAPI/Domain契約へ追加しない。可変の丸め方式が必要になった場合は `backend-integrity-lifecycle` の再要件化対象とする。
- `rule.uma` の合計は、四麻では4値、三麻では非nullの3値を合計し、厳密に0とする。`uma.fourth` のnull意味は既存の三麻契約を踏襲する。
- 新規IDの文字列形式は公開契約にせず不透明値とする。seed済みの既存IDは保持し、規則的な接頭辞を必要とする `user_stats` の正本キーだけを別途明示する。
- FEはFirestoreへ直接アクセスせずBE APIを利用する前提から、本番Rulesは直接クライアントアクセスをデフォルト拒否とする。直接アクセスを導入する場合は認可行列を再要件化する。
- リーグのruleを既存Match作成後に変更できるか、その場合に履歴を旧ruleで保持するかは本仕様では決めない。APIの形は固定するが、変更可否と再集計方針は `backend-integrity-lifecycle` の開始条件とする。
- ページネーションは本ロードマップの対象外のため、初期APIの成功レスポンスは `data` を必須とし、未定義の `meta` を契約にしない。
