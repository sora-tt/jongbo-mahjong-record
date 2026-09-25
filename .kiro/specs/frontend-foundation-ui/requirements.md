# 要件定義: frontend-foundation-ui

## プロジェクト説明

FEの画面実装者と利用者は、BE由来のAPI型、旧domain型、mock型、手書きresponse型、ページごとの認証・エラー・UI実装が併存しているため、同じデータや操作を画面ごとに異なる意味・見た目で扱っている。現行FEは一部でHono RPCの`AppType`を利用する一方、手書きfetch、Cookie認証とID Token認証の混在、個別Tailwind class、未接続navigationが残っている。この仕様では、`backend-foundation` と `backend-integrity-lifecycle` が定めるAPI契約を正本として参照するFE境界を整え、後続のリーグ・シーズン、Session・Match、統計画面が同じAPI client、adapter、認証・エラー処理、共通UIを利用できる状態にする。

## スコープと境界

### 対象

- Hono RPC `AppType` を起点とするAPI request/response型とBE DTOの参照方式
- `{ data: ... }`、`{ error: { code, message, details } }`、204、credentialsの共通API client
- `jongbo_session` Cookieを利用する認証ライフサイクル、401処理、middlewareの役割
- API adapter、ID・ISO 8601日時・nullable値の扱い、FEのfeatureフォルダとimport境界
- loading、error、empty、retryの共通状態表現
- Tailwind CSS 4のデザイントークン、Button、Input、Select、Card、Tableなどの共通UI
- Header、navigation、認証フォームの共通shellと既存共通部品の置換方針
- 現行のAPI module・Header・認証画面への基盤適用とtypecheck/lint/buildによる検証

### 対象外

- BEのFirestore、API DTO、認証Cookie、ErrorEnvelope、点数計算、集計、OpenAPIの仕様変更
- リーグ・シーズン、Session・Match、統計画面の業務ロジックと画面固有のCRUD
- FEでのrank、point、順位、累計値、user_statsの再計算
- 旧domain型、mock、Redux、重複コンポーネントの完全削除
- 新しいチャート実装、リアルタイム同期、複数端末同時編集

### 隣接仕様との契約

- `backend-foundation` のcamelCase DTO、ISO 8601日時、`{ data }`、ErrorEnvelope、`jongbo_session` Cookie、Cookie-only保護API、Hono `AppType`、user_stats logical keyを入力契約として利用する。
- `backend-integrity-lifecycle` の固定Session members、三麻/四麻の許容wind、`matchIndex`、BE算出済み`rank`/`point`、集計結果、sanmaのfourth系`null`をそのまま表示可能にする。
- `frontend-league-season`、`frontend-session-match`、`frontend-statistics-quality` は本仕様のAPI client、型alias、adapter境界、loading/error/empty状態、UI primitives、Headerを利用する。

## 要件

### 1. BE契約を正本とする型境界

1.1 When FEがBEのAPI endpointを利用するとき, the Frontend Foundation shall `mahjong-record-app-backend` が公開するHono `AppType`と`InferResponseType`/`InferRequestType`を契約の起点として型を導出し、同じAPI responseを表す手書き型を新設しない。

1.2 When API DTOをFEの画面またはfeature hookへ渡すとき, the Frontend Foundation shall `User`、`League`、`Season`、`Session`、`Match`、`UserStats`、`JoiningSeason`のcamelCaseキー、ISO 8601日時、nullable値、BEが返す`matchIndex`・`rank`・`point`を意味を変えずに保持する。

1.3 When 画面固有の表示形へ変換する必要があるとき, the Frontend Foundation shall 明示的なadapter境界でのみview modelへ変換し、表示整形以外の点数、順位、統計、累計値の再計算を行わない。

1.4 If API DTOの必須IDまたは日時がFEの境界で不正な場合, the Frontend Foundation shall silent fallbackや既定値への置換を行わず、契約エラーとして画面のerror状態へ渡す。

### 2. API clientとレスポンス契約

2.1 When FEからAPIを呼び出すとき, the Frontend Foundation shall 環境別base URL、`credentials: include`、Cookie送信、AbortSignal/timeoutの共通方針を一つのclient入口から適用する。

2.2 When APIが成功レスポンスを返すとき, the Frontend Foundation shall `{ "data": ... }`だけを成功契約として解析し、作成201、JSON更新200、取得200、bodyなし削除204を個別endpointで再実装しない。

2.3 When APIが失敗レスポンスを返すとき, the Frontend Foundation shall `{ "error": { "code": string, "message": string, "details": object } }`を型付き`ApiError`へ変換し、`validation_error`、`authentication_error`、`forbidden`、`not_found`、`conflict`、`internal_error`をBE契約と同じ識別子で扱う。

2.4 If API responseがJSONでない、envelopeが欠落する、またはnetwork/timeoutが発生する場合, the Frontend Foundation shall API契約エラーとtransport/decodeエラーを区別して、利用者に安全な再試行可能状態を表示する。

### 3. 認証セッション境界

3.1 When Firebaseログインまたはサインアップが成功するとき, the Frontend Foundation shall ID Tokenを`POST /api/auth/session`の`x-id-token`ヘッダーだけで交換し、成功後の保護API呼び出しは`jongbo_session` Cookieとcredentials送信だけを利用する。

3.2 While 保護APIを呼び出している状態, the Frontend Foundation shall ID Tokenをfallback認証ヘッダーとして送信せず、FEでHttpOnlyの`jongbo_session`値を読み取らない。

3.3 If 保護APIが401または`authentication_error`を返す場合, the Frontend Foundation shall 認証状態を未認証へ遷移させ、現在の操作を安全に中断してlogin routeへ誘導する。403、404、409、validation errorは認証リダイレクトと混同しない。

3.4 When 利用者がログアウトするとき, the Frontend Foundation shall `DELETE /api/auth/session`の204完了を確認してからFirebase Authを終了し、再利用可能な認証済み画面を残さない。

### 4. Error・loading・empty状態

4.1 While API requestが実行中である状態, the Frontend Foundation shall 対象領域にloading状態を表示し、同一操作の二重送信を防ぎ、完了または失敗時にloadingを解除する。

4.2 If APIまたはtransport errorが発生した場合, the Frontend Foundation shall status/codeに応じた安全な利用者向けメッセージ、必要時のretry操作、再試行可能性を表現し、BEの内部detailsや認証情報を画面へ表示しない。

4.3 When 正常な空配列、未計算の`null`、対象なしが返るとき, the Frontend Foundation shall errorと混同せず、対象画面が意味を説明できるempty stateへ渡す。

4.4 When request結果が遅れて到着する、または画面がunmountされるとき, the Frontend Foundation shall 古いrequestの結果で新しい状態を上書きせず、不要なstate updateを発生させない。

### 5. Feature構成と責務境界

5.1 When 新しいFE機能を追加するとき, the Frontend Foundation shall route entryを`src/app`、feature固有のapi/model/uiを`src/features/<feature>`、横断UIを`src/components/ui`、layout/navigationを`src/components/layout`、transportのみを`src/lib`へ配置する規約を適用する。

5.2 While feature implementationがBE APIを利用している状態, the Frontend Foundation shall page componentへ直接fetch、手書きresponse型、Firestoreアクセス、BE業務計算を持ち込ませず、feature APIとadapterを経由させる。

5.3 When shared stateを追加するとき, the Frontend Foundation shall 認証状態をAuth boundary、request状態をfeature hook、画面固有入力をfeature内へ置き、新しいserver data cacheをReduxへ追加しない。

5.4 If 旧domain型やmockがリポジトリに残っている状態, the Frontend Foundation shall 移行済みの本番routeがそれらをAPIのfallbackまたは正本として参照しないよう、互換層と利用禁止境界を明示する。

### 6. デザイントークンと視覚的一貫性

6.1 When FE画面を描画するとき, the Frontend Foundation shall 現行の白地・ブランドピンク基調をsemantic token経由で適用し、ページ固有のhex値や無秩序なTailwind色指定を新規追加しない。

6.2 When UI componentがdefault、hover、focus、disabled、loading、error状態になるとき, the Frontend Foundation shall 同じsurface、text、border、focus、status tokenとキーボードフォーカス表現を使用する。

6.3 When rank、chart、statusなどの色を後続画面が表示するとき, the Frontend Foundation shall 意味別のtoken名を提供し、画面ごとに色の意味を再定義させない。

### 7. 共通UI primitives

7.1 When Button、Input、Selectを利用するとき, the Frontend Foundation shall `React.FC`、明示的なProps、native属性の透過、disabled/loading、label、description、error、required、focus styleを共通インターフェースで提供する。

7.2 When CardまたはTableを利用するとき, the Frontend Foundation shall title/meta/bodyのslot、responsive overflow、caption、header/body/cellのsemantic構造を提供し、ページごとの類似classを増やさない。

7.3 When Loading、Error、Empty stateを利用するとき, the Frontend Foundation shall screen reader向けのstatus、role、再試行または次の操作の説明を含め、正常なemptyと失敗を視覚的にも文言的にも区別する。

7.4 If 共通UIにページ固有の業務propsが必要になった場合, the Frontend Foundation shall primitiveへ業務概念を追加せず、feature UIまたはadapterでcompositionする。

### 8. Header、navigation、認証shell

8.1 When 認証済みの画面を表示するとき, the Frontend Foundation shall 再利用可能なAppShell/Headerを通じて`jongbo`ブランド、dashboard・league・statsのnavigation、ログインユーザー表示、logout操作を一貫して提供する。

8.2 When pathnameがnavigation itemに一致するとき, the Frontend Foundation shall `aria-current`とactive styleを適用し、SSR後のpathname変更にも追従してactive状態を更新する。

8.3 When 画面幅が狭い、menuを開閉する、Escapeまたはcloseを操作する場合, the Frontend Foundation shall キーボード操作可能なmobile drawer、背景・focus・閉じる操作を提供し、本文を操作不能なまま隠さない。

8.4 When loginまたはsignup画面を表示するとき, the Frontend Foundation shall 共通AuthFormShellでtitle、form content、error、submit loading、footer linkを同じレイアウトとアクセシビリティ規則で提供する。

### 9. 既存FEへの適用と検証

9.1 When 現行のauth、home、league、season、session、match、stats画面を本基盤へ移行するとき, the Frontend Foundation shall 共通API client、BE由来型、adapter、loading/error/empty、UI primitivesを利用し、同じ契約の別実装を残さない。

9.2 If 既存API moduleが保護APIへID Tokenを送信する、直接fetchで独自にenvelopeを解析する、または`meta`を暗黙に要求する場合, the Frontend Foundation shall Cookie-only認証と共通parserへ移行し、BE契約と異なるfallbackを廃止する。

9.3 When frontendのtypecheck、lint、buildを実行するとき, the Frontend Foundation shall strict TypeScript、import規約、React/Next構成、Tailwind token利用の違反を検出でき、BE `AppType`の変更がFEの型エラーとして可視化される。

9.4 When 後続FE仕様が本基盤を利用開始するとき, the Frontend Foundation shall API型の参照元、adapterの責務、認証・ErrorEnvelope・nullable値・BE算出値の扱い、再検証トリガーを文書化して引き渡す。

## 仮定・未決事項

- 既存コードで確認できる白地・ブランドピンク基調、`jongbo`表記、レスポンシブな右drawerを初期の視覚方針とする。ダークモードや別ブランドカラーは本仕様では追加しない。
- 新しいUIライブラリ、データ取得ライブラリ、状態管理ライブラリは追加せず、Next.js、React、Tailwind CSS 4、`clsx`、`lucide-react`、Hono clientを利用する。
- リーグ一覧専用routeが後続仕様で確定するまで、league navigationの遷移先は既存routeと衝突しない設定可能な値として扱い、foundationで新しい業務routeを作らない。
- FEに既存のテストランナーがないため、本段階の必須検証はtypecheck、lint、build、BE契約型とのコンパイル整合とし、画面固有のcomponent/E2Eテストは後続画面仕様の検証基盤に委ねる。
