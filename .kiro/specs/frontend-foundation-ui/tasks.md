# 実装タスク: frontend-foundation-ui

## 1. API契約とtransport基盤

- [x] 1.1 BE `AppType`由来のFE contractsと共通値型を固定する
  - Hono clientの`InferResponseType`/`InferRequestType`から主要endpointの型aliasを導出し、手書きresponse型の新規追加を禁止する。
  - `ApiErrorCode`、data/error envelope、User/League/Season/Session/Match/UserStats/JoiningSeason alias、branded ID、検証済みISO日時の境界を定義する。
  - 完了時、backend packageのDTO変更がfrontend typecheckで検出され、`null`、`matchIndex`、BE計算済み`rank`/`point`を表現できる。
  - _Requirements: 1.1, 1.2, 1.4, 5.1, 5.4, 9.3_
  - _Boundary: API Contract Boundary_

- [x] 1.2 共通Hono clientとdata/error/204 parserを実装する
  - base URL、production same-origin、`credentials: include`、AbortSignal/timeout、成功status、ErrorEnvelope、JSON decodeを一つのtransport入口へ集約する。
  - bodyなし204をJSON解析せず完了扱いにし、未定義`meta`を必須にせず、network/timeout/decodeとBE ApiErrorを区別する。
  - 完了時、既存API moduleが同じparserで200/201/204と標準errorを扱い、レスポンス解析の重複実装が残らない。
  - _Depends: 1.1_
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.2_
  - _Boundary: API Transport_

- [x] 1.3 DTO adapterとfeature APIの利用境界を適用する
  - API DTOからview modelへの明示的adapter契約を設け、ID/日時検証、nullable保持、表示整形だけを許可し、rank/point/統計再計算を禁止する。
  - `src/app`、`src/features/<feature>`、`src/components/ui`、`src/components/layout`、`src/lib`のimport方向とAPI module配置を既存FEへ適用する。
  - 完了時、後続featureがBE計算値をそのまま受け取れる公開入口と、旧domain/mockを本番fallbackに使わない境界が文書と型で確認できる。
  - _Depends: 1.1, 1.2_
  - _Requirements: 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 5.4, 9.1, 9.4_
  - _Boundary: Adapter Boundary, Foundation Handoff_

## 2. 認証とrequest状態

- [x] 2.1 session exchangeとCookie-only認証を統一する
  - login/signupは`x-id-token`ヘッダーだけでsession exchangeを行い、protected APIからID Token、body認証、fallback headerを除去する。
  - AuthStatus、Firebase user、`jongbo_session`を読まないcredentials送信、401時の未認証遷移、logoutの204確認後Firebase終了をAuth boundaryへ集約する。
  - 完了時、Cookieなしの保護APIはloginへ誘導され、403/404/409/validation errorは認証redirectにならず、auth providerとmiddlewareの責務が分離される。
  - _Depends: 1.2_
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.1, 9.2_
  - _Boundary: Auth Session Boundary_

- [x] 2.2 loading/error/emptyとstale requestを共通化する
  - `AsyncState<T>`、AbortControllerまたはrequest sequence、retry/reset、safe message mappingを実装し、feature hookがrequest中の二重操作を防げるようにする。
  - ApiErrorの内部detailsを表示せず、正常な空配列・nullと失敗を別状態として扱い、unmount済みまたは古いrequestの結果を適用しない。
  - 完了時、後続featureが同じstate contractでloading/error/empty/retryを描画でき、request完了後にloadingが残らない。
  - _Depends: 1.2_
  - _Requirements: 2.4, 4.1, 4.2, 4.3, 4.4, 5.3_
  - _Boundary: Request State Boundary_

## 3. デザイントークンと共通UI

- [x] 3.1 (P) semantic design tokenとclass composition方針を整備する
  - 現行の白地・ブランドピンクをbrand/surface/text/border/focus/status/rank/chart/font/radius/shadow tokenへ整理し、Tailwind `@theme`とCSS variableを正本にする。
  - focus-visible、disabled、loading、error、successの状態表現と日本語本文のfontを共通化し、新規画面の直接hex/意味不明な色指定を防ぐ。
  - 完了時、共通UIと新規featureが同じsemantic tokenを参照し、rank/chart色の意味が画面ごとに分裂しない。
  - _Requirements: 6.1, 6.2, 6.3_
  - _Boundary: Design System Primitives_

- [x] 3.2 (P) accessible form・action・surface・table primitivesを実装する
  - Button、Input、Select、Card、Tableを明示Props、native属性、label/description/error、required、disabled/loading、focus、semantic table構造で提供する。
  - 既存Button、InputArea、Dropdown、TextBox、SectionCard、HeaderCard、Tableの利用箇所が段階的に互換接続できるAPIを定め、primitiveへ業務propsを追加しない。
  - 完了時、各primitiveがkeyboard focusとdisabled/loadingを表現し、Tableがcaption/header/body/cellとresponsive overflowを持つ。
  - _Requirements: 6.1, 6.2, 7.1, 7.2, 7.4, 9.1_
  - _Boundary: Design System Primitives_

- [x] 3.3 (P) Loading/Error/EmptyとAuthFormShellを実装する
  - LoadingState、ErrorState、EmptyStateにrole/aria-live、安全な文言、retryまたは次操作を持たせ、empty/null/errorを視覚的にも文言的にも区別する。
  - AuthFormShellにtitle、children、error、submit loading、footer linkを集約し、login/signupが同じform shellを利用できるようにする。
  - 完了時、認証画面と後続画面が内部ErrorEnvelope detailsを露出せず、screen readerがloading/error/emptyの変化を把握できる。
  - _Depends: 2.2, 3.1_
  - _Requirements: 4.1, 4.2, 4.3, 7.3, 8.4, 9.1_
  - _Boundary: Request State Boundary, Design System Primitives_

## 4. AppShellとnavigation

- [x] 4.1 Header、navigation、AppShellを共通UIへ移行する
  - `usePathname`でactive itemと`aria-current`を算出し、dashboard・league・stats、brand、user表示、logoutをdesktop inline navigationとmobile right drawerで提供する。
  - menuのopen/close、Escape、close action、focus、背景の操作可否を実装し、存在しないsettings routeや未接続actionを必須導線から除外する。
  - 完了時、SSR後のroute変更でactive表示が更新され、狭い画面でも本文を隠したまま操作不能にせず、既存画面がAppShellのmain slotへ接続できる。
  - _Depends: 2.1, 3.2, 3.3_
  - _Requirements: 6.1, 7.1, 8.1, 8.2, 8.3, 9.1_
  - _Boundary: App Shell_

- [x] 4.2 layout、providers、auth routeへのshell適用を検証する
  - layout/providerのcompositionを整理し、認証済み画面のHeader重複とauth画面の不要なHeaderを避け、middlewareがBE認証の代替にならないことを明示する。
  - 現行auth/homeと共有Header利用ページを共通token、primitive、request state、AuthFormShellへ接続する。
  - 完了時、login/signup、home、league route、stats routeが同じproviderと共有UI境界でbuildでき、logout後に保護画面を再利用できない。
  - _Depends: 2.1, 3.1, 4.1_
  - _Requirements: 3.3, 3.4, 5.1, 8.1, 8.4, 9.1, 9.3_
  - _Boundary: App Shell, Auth Session Boundary, Foundation Handoff_

## 5. 既存API適用と検証・handoff

- [x] 5.1 既存API moduleの共通境界移行を完了する
  - `auth`、`users`、`leagues`、`seasons`、`sessions`、`matches`の重複parser、手書きresponse型、直接fetch、保護APIのID Token送信を共通contracts/transportへ移行する。
  - `users`のtimeoutとstats取得をtransportのnetwork/timeout/decode/ApiErrorへ統一し、BEの`data`、ErrorEnvelope、204、computed result、nullable値を保つ。
  - 完了時、現行API moduleは同じclient/parserだけを経由し、mockや旧domain型を本番レスポンスのfallbackとして参照しない。
  - _Depends: 1.1, 1.2, 1.3, 2.1, 2.2_
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 9.1, 9.2_
  - _Boundary: API Transport, Adapter Boundary, Auth Session Boundary_

- [x] 5.2 foundation検証と後続feature handoffを実施する
  - `pnpm typecheck`、`pnpm lint`、`pnpm build`を実行し、AppType変更の検出、import規約、React/Next構成、Tailwind token利用、shared UIのcompileを確認する。
  - backend contract test/Emulatorが公開するsession Cookie、ErrorEnvelope、DTO、`matchIndex`、computed `rank`/`point`、stats/null契約とFE alias/adapterの整合を確認する。
  - 完了時、後続3仕様が参照するcontracts、adapter責務、Auth/error/loading/UI境界、legacy/migration制約、再検証トリガーが一覧化され、未解決のroute/visual判断が明示される。
  - _Depends: 4.2, 5.1_
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 4.1, 4.2, 4.3, 5.2, 5.4, 6.3, 7.3, 8.1, 8.2, 8.3, 9.3, 9.4_
  - _Boundary: Foundation Handoff, Contract Test Suite_

## Implementation Notes

- frontendにテストランナーは未導入のため、本段階はtypecheck、lint、build、実API疎通、UI確認を検証の正本とする。
- `/league`一覧routeは後続仕様で追加するため、foundationのHeader「リーグ」は既存のリーグ一覧を含むホーム（`/`）へ接続する。
- Honoのmatch request bodyは現時点でvalidatorから`unknown`として公開されるため、`MatchResultInput`だけはbackend schemaと同期する互換型として管理する。
