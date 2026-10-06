# 実装タスク: backend-foundation

## 1. 正本データ契約と永続層

- [x] 1.1 正本Domain/API型と保存フィールドの対応を固定する
  - users、leagues、members、seasons、sessions、matches、user statsのcamelCase型とnullable意味を整理する。
  - リーグ内 `rule` を `gameType`、`uma`、`oka` の契約として定義し、`scoreCalculation`や独立rule masterを追加しない。`uma` の合計0を有効ruleの不変条件として契約に含める。
  - Timestamp/ISO 8601と不透明IDの境界を共通型・変換規約として明示する。
  - 完了時、型チェックで全対象Domain型が同じ正本型を参照し、snake_caseの保存フィールドがpresentationへ漏れない。
  - _Requirements: 1.1, 1.2, 1.3, 2.3_
  - _Boundary: Canonical Contracts_

- [x] 1.2 Repository mapperとcanonical writeを統一する
  - 各Firestore repositoryの読み書きでsnake_case、Timestamp、embedded rule、nullableフィールドを一貫して変換する。
  - 必須保存フィールドの欠落を黙って既定値へ変換せず、契約違反として扱う。
  - `rules` root collectionを新規正本として参照せず、既存データを無承認で削除・改名しない。
  - 完了時、代表的なUser/League/Season/Session/Match/UserStats fixtureを保存して読み戻すと、camelCase DTOが値・null・日時を保持する。
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.3, 2.4_
  - _Depends: 1.1_
  - _Boundary: Repository Mappers_

- [x] 1.3 個人成績の論理キーと重複防止を実装する
  - `overall_{userId}`、`league_{leagueId}_{userId}`、`season_{leagueId}_{seasonId}_{userId}` の一意キーを生成・検証する。
  - 同じユーザー・scopeの再計算では既存正本を更新し、異なる自動IDの重複作成を防ぐ。
  - 既存自動IDデータの検出結果を破壊的移行なしで扱えるよう、未承認の削除・改名を防ぐガードを用意する。
  - 完了時、同じ論理キーを二度upsertしても正本レコードが一件のまま更新される。
  - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - _Depends: 1.1, 1.2_
  - _Boundary: Repository Mappers, Canonical Contracts_

- [x] 1.4 League作成・更新のrule.uma合計0 validatorを実装する
  - 三麻では `first + second + third = 0` かつ `fourth = null`、四麻では4値合計が0となる判定を一つのDomain契約として実装する。
  - League create/update serviceはRepository writeより前にvalidatorを呼び、違反時にLeague全体を保存しない。
  - 400 `validation_error` のdetailsへ `field=rule.uma`、`gameType`、`expectedTotal=0`、`actualTotal` を渡す。
  - 完了時、三麻・四麻の有効/無効ruleが同じvalidatorで判定され、umaを自動補正・再配分せずに無効入力を拒否する。
  - _Requirements: 8.1, 8.2, 8.4_
  - _Depends: 1.1, 1.2_
  - _Boundary: Rule Invariant Validator, Canonical Contracts_

- [x] 1.5 (P) 必要なFirestore indexとデフォルト拒否Rulesを整備する
  - members collection group、user_stats scope検索、時系列session/match/season取得に必要なindexをrepository queryから確定する。
  - 本番Rulesは全許可を廃止し、Admin SDK経由のBE利用を前提に直接クライアントread/writeをデフォルト拒否する。
  - Emulatorで代表queryがindex不足にならず、未認証の直接アクセスが許可されないことを検証できる状態にする。
  - 完了時、index定義とRules定義がリポジトリに存在し、全許可のcatch-allが残っていない。
  - _Requirements: 5.1, 5.2, 5.3_
  - _Depends: 1.1_
  - _Boundary: Seed and Infrastructure_

## 2. 認証とHTTP境界

- [x] 2.1 (P) ID Token交換とsession Cookie発行を固定する
  - `POST /api/auth/session` は `x-id-token` ヘッダーだけを受け、Firebase Adminで検証後に `jongbo_session` を発行する。
  - Cookieのpath、HttpOnly、SameSite、production時secure、既定5日寿命、正の環境変数による上書きを統一する。
  - 欠落・無効・期限切れのTokenでは401を返し、Token、Cookie、内部検証詳細をresponse detailsや通常ログへ出さない。
  - 完了時、有効Tokenは201と有効期限を返してCookieを設定し、無効TokenはCookieを設定せず標準authentication errorになる。
  - _Requirements: 3.1, 3.2, 5.4_
  - _Depends: 1.1_
  - _Boundary: Session Auth Boundary_

- [x] 2.2 保護APIのCookie認証とCORS境界を適用する
  - 保護routeでは `jongbo_session` の検証結果からtyped AuthContextを設定し、`x-id-token` をfallback認証に使わない。
  - public route、auth route、protected routeの認証行列を実装とテストで一致させる。
  - 許可originを環境設定から明示し、credentialsを有効化し、wildcard originを返さない。
  - `DELETE /api/auth/session` はCookieを削除してbodyなし204を返す。
  - 完了時、Cookieなしまたは不正Cookieの保護APIは401、認証済みの許可originからのCookie付きrequestだけがserviceへ到達する。
  - _Requirements: 3.3, 3.4, 3.5, 5.3, 5.4_
  - _Depends: 2.1_
  - _Boundary: Session Auth Boundary, HTTP Contract Boundary_

- [x] 2.3 成功レスポンス、エラー、入力検証を正規化する
  - `{ data }`、`{ error: { code, message, details } }`、204の共通helperとtyped ErrorCodeを用意する。
  - validation、authentication、forbidden、not found、conflict、internal errorのstatus/code対応を固定する。
  - `rule.uma` 合計違反のfield、期待値、実際の合計をerror detailsへ安全に含め、Leagueの部分更新を発生させない。
  - 予期しない内部エラーの外部messageを安全な固定値へ置き換え、認証情報やサービスアカウント情報をdetailsへ流さない。
  - route validatorは必須値、型、enum、形式をservice実行前に検証する。
  - 完了時、GET=200、作成POST=201、JSONを返すPATCH=200、削除=204のresponseが全routeで同じenvelopeになる。
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.4_
  - _Depends: 1.1, 2.2_
  - _Boundary: HTTP Contract Boundary_

## 3. 公開契約、seed、検証

- [x] 3.1 Hono route型と入力契約を公開する
  - Health/Auth/Users/Leagues/Seasons/Sessions/Matchesのroute schema、認証要否、status、response typeを実装と同じ型から参照できるようにする。
  - `AppType = ReturnType<typeof createApp>` をHono RPCの契約入口として維持し、手書きの別API型を増やさない。
  - League create/updateの `rule.uma` validation errorをAPI契約へ含め、FEが表示検証とBEエラー表示で同じfield/detailsを参照できるようにする。
  - Matchのpoint計算やSession/Match業務制約をこの基盤の入力契約へ重複実装しない。
  - 完了時、FEと後続BEが同じroute型を参照でき、ルート追加・status変更が型検証で検出される。
  - _Requirements: 4.4, 4.5, 7.2_
  - _Depends: 2.3, 1.1_
  - _Boundary: HTTP Contract Boundary, Canonical Contracts_

- [x] 3.2 Runtime OpenAPI、Swagger、静的ドキュメントを同期する
  - `/doc` と `/ui` が同一のruntime OpenAPIを表示し、route、request、response、security、status、error schemaを含める。
  - api-design、api-reference、auth-design、firestore schemaから旧body認証、独立rule master、snake/camelの矛盾を除く。
  - ドキュメント更新を実装・seed・index・Rules・contract testの変更と同じ契約更新単位にする。
  - 完了時、runtime documentと静的文書のroute数、認証方式、主要schema、status/error例が一致する。
  - _Requirements: 6.1, 6.2, 7.2, 7.3_
  - _Depends: 3.1, 1.2_
  - _Boundary: Contract Publication_

- [x] 3.3 正本契約に従うseedとEmulator検証を整備する
  - Auth users、users、leagues、embedded rule、members、seasons、sessions、user_statsを同じ保存スキーマでseedする。
  - `scoreCalculation`や独立 `rules` 文書だけに存在する別スキーマをseedへ残さない。
  - seed後にAPIの代表GET、user_stats scope検索、session/match順序取得を実行できるfixtureを用意する。
  - 完了時、Emulatorを初期化してseedを再実行しても同じ論理キーとcamelCase API応答が得られ、手動修正を必要としない。
  - _Requirements: 1.4, 2.1, 5.1, 5.2, 5.3, 6.2, 6.3_
  - _Depends: 1.2, 1.3, 1.4, 1.5_
  - _Boundary: Seed and Infrastructure_

- [x] 3.4 契約テストで境界の回帰を検出する
  - mapperのfield/null/timestamp変換、user_stats重複防止、auth交換失敗、Cookie属性、protected route拒否をテストする。
  - response envelope、status matrix、validation-before-service、League作成・更新のuma合計0拒否、OpenAPI route/schema、default-deny Rules、seed/queryを検証する。
  - テスト実行時にToken、Cookie、service account秘密情報を出力しない。
  - 完了時、契約テストコマンド一つでRequirement 1〜8の主要境界を再現し、失敗時に対象契約を特定できる。
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 8.1, 8.2, 8.4_
  - _Depends: 1.2, 1.3, 1.4, 1.5, 2.2, 2.3, 3.1, 3.2, 3.3_
  - _Boundary: Contract Test Suite_

## 4. 後続仕様への引き渡し

- [x] 4.1 backend-integrity-lifecycleとfrontend-foundation-uiの契約再検証を通す
  - canonical league rule、DTO envelope、auth Cookie、error code、AppType、stats key、index/Rules前提を後続仕様の入力契約として固定する。
  - `uma` 合計0をpoint calculationのrank bonusゼロサム前提として引き渡し、`oka` とraw scoreの不変条件を別に検証するよう後続BE仕様へ明記する。
  - rule変更後のMatch履歴、三麻/四麻の業務制約、集計更新、FE adapter/画面の責任をこのspecへ取り込まず、再検証トリガーとして記録する。
  - 既存本番データのbackfillや破壊的移行は、承認済み移行計画がない限り実行対象に含めない。
  - 完了時、後続2仕様が参照する契約差分、uma/point計算の不変条件、未決のrule mutation/migration判断が明示され、境界外の実装が混入していない。
  - _Requirements: 2.4, 7.2, 7.3, 8.4_
  - _Depends: 3.4_
  - _Boundary: Contract Publication, Contract Test Suite, downstream handoff_

- [x] 4.2 FEのrule.uma表示検証契約を引き渡す
  - FEがLeague rule入力時に三麻・四麻で同じ合計対象を使えるよう、合計0 predicate、`fourth=null` semantics、field-level error表示条件を契約fixtureとして公開する。
  - BEの `validation_error` detailsをFEが表示へ利用できるが、FEがBEの権威性を置き換えないことを明記する。
  - 完了時、`frontend-foundation-ui` がBE APIを呼ぶ前にuma合計違反を表示でき、BEから同じ入力を送った場合も同じfield/detailsで拒否されることを確認できる。
  - _Requirements: 8.3_
  - _Depends: 3.1, 3.4, 4.1_
  - _Boundary: Contract Publication, downstream handoff_

## 5. ISSUE-99外卓フィールド契約

- [ ] 5.1 League rule、Match、UserStatsの外卓項目を正本型へ追加する
  - League ruleに非負整数の`chomboPenaltyPoints`とbooleanの`allowOffTableKyotaku`を追加し、PR #104のuma契約を維持する。
  - Matchに発生単位の`chomboEvents`と棒数の`offTableKyotakuCount`、UserStatsに`chomboCount`を追加する。同一userIdのチョンボ発生を複数要素で表現できる。
  - 旧League ruleは0/false、旧Matchは空配列/0、旧UserStatsは0として読み取る契約にし、本番データの一括backfillを含めない。
  - 完了時、正本Domain/API型が各外卓項目とlegacy defaultを表し、既存識別子とPR #104 uma型を維持する。
  - _Requirements: 1.2, 1.5, 2.4, 2.5_
  - _Boundary: Canonical Contracts_

- [ ] 5.2 Repository mapperで外卓項目と旧データを正規化する
  - MatchとUserStatsのsnake_case保存値をcamelCaseへ変換し、League ruleの新規則も保存・読み戻しに含める。
  - Match createで外卓項目が省略された場合は空配列/0を保存し、updateで省略された項目は既存値を保持し、明示した空配列/0は消去として扱う。
  - 完了時、新旧League/Match/UserStats fixtureの読み書きで新項目と既存値が保持され、破壊的な移行なしにDTOへ正規化される。
  - _Requirements: 1.3, 1.5, 2.4, 2.5_
  - _Depends: 5.1_
  - _Boundary: Repository Mappers_

- [ ] 5.3 League・Match・UserStats API schemaを外卓契約へ揃える
  - League ruleの罰符・可否、Matchのevent配列・供託本数、UserStatsの回数をroute request/response schemaへ反映し、AppTypeから参照可能にする。
  - eventのoffenderUserId必須、供託本数の非負整数など型・形式はservice実行前に検証する。Session member整合性とLeague ruleによる許可判定は後続lifecycleの責務に残す。
  - 完了時、MatchとLeagueのAPI型で外卓項目が別々に表現され、形式不正な入力はserviceへ到達しない。
  - _Requirements: 1.5, 2.5, 4.4, 4.5, 7.2_
  - _Depends: 5.1_
  - _Boundary: HTTP Contract Boundary_

- [ ] 5.4 OpenAPI、Swagger、API referenceへ新項目を公開する
  - Runtime OpenAPI/Swaggerと静的API referenceに新しいLeague rule、Match request/response、UserStats fieldと既定値を反映する。
  - 完了時、公開schemaと実装DTOが同じfield名、型、nullable/default semanticsを示す。
  - _Requirements: 6.1, 6.2, 7.3_
  - _Depends: 5.3_
  - _Boundary: Contract Publication_

- [ ] 5.5 Emulator seedに外卓契約の既定値を追加する
  - seedのLeague ruleにchomboPenaltyPoints/allowOffTableKyotaku、Matchに空のchomboEventsと0本、UserStatsにchomboCount 0を明示する。
  - 既存ID・logical keyを維持し、新しいindexやRulesを追加しない。
  - 完了時、seedから取得したDTOに全外卓項目が含まれ、繰り返しseedしても既存の正本識別子が変わらない。
  - _Requirements: 1.4, 6.2, 6.3_
  - _Depends: 5.2, 5.3_
  - _Boundary: Seed and Infrastructure_

## 6. 座順ローテーションrule契約

- [x] 6.1 League ruleの正本型にrotateSeatOrderを追加する
  - League ruleにbooleanの`rotateSeatOrder`を含め、新規作成・旧データ読取の既定値をfalseとする。
  - 完了時、Domain上で座順設定をbooleanとして保持でき、未設定Leagueをfalseとして解釈できる。
  - _Requirements: 1.2, 1.6, 1.7_
  - _Boundary: Canonical Contracts_

- [x] 6.2 League API入力・出力に座順ruleを反映する
  - League create/update requestとLeague DTO responseにboolean `rotateSeatOrder`を含め、型不正な値をサービス実行前に拒否する。
  - 完了時、League API route schemaと公開route型が同一fieldとboolean型を示し、boolean入力だけが受理される。
  - _Depends: 6.1_
  - _Requirements: 1.6, 4.4, 4.5, 7.2_
  - _Boundary: HTTP Contract Boundary_

- [x] 6.3 Repository mapperへ座順ruleとlegacy defaultを追加する
  - 永続形式の`rotate_seat_order`とcamelCase DTOを対応づけ、書き込み時は値を保持する。
  - fieldがない既存Leagueはfalseとして読み、データ一括backfillや既存Matchの変更を行わない。
  - 完了時、新旧League fixtureの保存・読み戻しでbooleanが保たれ、旧fixtureの読み取り結果がfalseになる。
  - _Depends: 6.1_
  - _Requirements: 1.3, 1.6, 1.7, 6.2_
  - _Boundary: Repository Mappers_

- [ ] 6.4 Seedに座順ruleの明示的な初期値を含める
  - 新規seed Leagueには`rotateSeatOrder: false`を含め、canonical League DTOとして取得できるようにする。
  - 既存seed識別子を保ち、未承認の既存データ移行を行わない。
  - 完了時、seed再実行後もLeagueの座順設定がfalseで取得でき、既存識別子が変わらない。
  - _Depends: 6.3_
  - _Requirements: 1.4, 1.7, 6.2, 6.3_
  - _Boundary: Seed and Infrastructure_

- [ ] 6.5 座順ruleを公開契約へ同期する
  - API schemaからruntime OpenAPI/Swaggerへfieldを公開し、静的API referenceとFirestore schemaにもboolean型、snake_case保存名、legacy false semanticsを反映する。
  - APIと保存層のfield/default表現を契約公開物間でそろえるintegration作業として扱う。
  - 完了時、runtime OpenAPI、Swagger、API reference、Firestore schemaに同一fieldとdefault semanticsが記載される。
  - _Depends: 6.2, 6.3_
  - _Requirements: 6.1, 6.2, 7.2, 7.3_
  - _Boundary: Contract Publication Integration_

- [ ] 6.6 League API座順契約の検証を追加する
  - create/updateのboolean validation、League DTOへの反映、runtime OpenAPI schemaのfield parityを検証する。
  - 完了時、契約検証で不正型が業務service前に拒否され、FE公開型とAPI schemaの値が一致する。
  - _Depends: 6.2, 6.5_
  - _Requirements: 4.4, 4.5, 6.1, 7.1, 7.2_
  - _Boundary: HTTP Contract Test Suite_

- [ ] 6.7 Repository mapperの座順互換性を検証する
  - repository round-tripで`rotateSeatOrder`が保存・読戻しされ、fieldがない旧Leagueをfalseで返すことを確認する。
  - 完了時、legacy false semanticsとsnake_case/camelCase変換がcontract fixtureで再現できる。
  - _Depends: 6.3, 6.5_
  - _Requirements: 1.3, 1.7, 6.2, 7.1_
  - _Boundary: Repository Contract Tests_

- [ ] 6.8 Seedの座順初期値をEmulatorで検証する
  - seed後のLeague DTOに`rotateSeatOrder: false`が含まれ、再実行時も既存League識別子が変わらないことを確認する。
  - 完了時、seed integration checkで座順初期値と正本識別子の再現性が確認できる。
  - _Depends: 6.4_
  - _Requirements: 1.4, 6.2, 6.3, 7.1_
  - _Boundary: Seed and Infrastructure_
