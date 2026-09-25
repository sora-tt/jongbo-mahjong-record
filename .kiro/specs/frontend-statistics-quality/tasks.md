# 実装タスク: frontend-statistics-quality

## 1. Stats API境界と表示model

- [ ] 1.1 (P) 個人成績・user statsのtyped APIとadapterを整備する
  - `AppType`からrequest/responseを導出し、対象ユーザー・期間・league/season scopeを保持する。
  - nullable、ISO日時、未計算状態、BE算出済みrank/point/aggregateをview modelへ渡す。
  - _Requirements: 1.1-1.4, 2.1, 2.3, 2.4_
  - _Boundary: Stats API, Adapter_

- [ ] 1.2 (P) standings・records・daily・progression APIとadapterを整備する
  - Season/League DTOとuser stats DTOの表示境界を整理し、手書きresponse型を除去する。
  - APIの配列順、null、空配列、series、三麻/四麻のnullableを保持し、FE集計を追加しない。
  - _Requirements: 1.1-1.4, 2.2-2.4, 3.1-3.3_
  - _Boundary: Stats API, Adapter_

## 2. 個人成績・順位表の移行

- [ ] 2.1 個人成績画面をtyped APIへ移行する
  - loading/error/empty/uncomputed、retry、401/403/404を共通状態へ接続する。
  - BEが返す期間、対局数、順位、point、recordだけを表示し、FEの再集計を削除する。
  - _Depends: 1.1_
  - _Requirements: 2.1, 2.3, 2.4, 4.1-4.3, 5.1, 5.4_
  - _Boundary: Stats UI_

- [ ] 2.2 Season/League standingsとrecordsを共通Tableへ移行する
  - API配列順とrank/point/member情報をそのまま表示し、sortやrank振り直しを行わない。
  - Season/League detailの既存導線を維持し、前段仕様と同じ表示modelを利用する。
  - _Depends: 1.2_
  - _Requirements: 2.2, 2.3, 4.1, 4.3, 6.1, 7.1_
  - _Boundary: Standings UI, League/Season Integration_

## 3. 日次記録・チャートの移行

- [ ] 3.1 日次記録とpoint progressionをtyped APIへ接続する
  - BEが返す日付、対局数、rank、point、record、seriesを表示modelへ渡す。
  - 空、部分、null、未計算を区別し、0埋め・平均・補間を追加しない。
  - _Depends: 1.2_
  - _Requirements: 3.1-3.3, 4.1-4.3, 5.1_
  - _Boundary: Daily/Progression UI_

- [ ] 3.2 チャートを共通primitiveとdesign tokenへ統合する
  - 色、凡例、tooltip、単位、responsive container、キーボード・label状態を共通化する。
  - page固有のハードコード色や独自chart data変換を除去する。
  - _Depends: 1.2, 3.1_
  - _Requirements: 3.2-3.4, 4.1, 6.1, 6.2_
  - _Boundary: Chart UI, Shared UI_

## 4. 画面・route・状態の統合

- [ ] 4.1 統計画面のhookとAsyncStateを統合する
  - 対象ID・期間変更、stale request、retry、unmount、loading/error/emptyを共通hookへ整理する。
  - 別対象のcacheやmock値で現在画面を上書きしない。
  - _Depends: 1.1, 1.2, 2.1, 3.1_
  - _Requirements: 1.4, 2.4, 4.1-4.3, 7.3_
  - _Boundary: Request Hooks, Async State_

- [ ] 4.2 route、navigation、metadata、Auth boundaryを整理する
  - 既存stats入口とSeason/League detailの統計導線を棚卸しし、正規routeを一つにする。
  - 401遷移、title/description、back/navigation、主要buttonを実動作へ接続する。
  - _Depends: 2.1, 2.2, 3.1, 4.1_
  - _Requirements: 2.4, 4.4, 5.4, 6.2_
  - _Boundary: Route Integration, Auth Boundary_

## 5. 旧実装・重複コードの退役

- [ ] 5.1 対象routeのmock、直接fetch、手書き型を除去する
  - 全importと利用箇所を確認し、typed APIとadapterへ移行した後に対象routeのmock fallback、手書きresponse、旧domain参照を削除する。
  - _Depends: 2.1, 2.2, 3.1, 4.2_
  - _Requirements: 5.1, 5.4, 7.1_
  - _Boundary: Legacy Migration_

- [ ] 5.2 重複hooks/componentsと不要Reduxを安全に退役する
  - 参照元を全件確認し、統計画面で不要になったslice/store、重複hook、重複カード・table・chartを削除または共通primitiveへ統合する。
  - Session/Match、League/Season CRUD、foundationで使用中の共有資産は削除しない。
  - _Depends: 4.1, 5.1_
  - _Requirements: 5.2, 5.3, 7.1_
  - _Boundary: Legacy Migration, Shared UI_

- [ ] 5.3 未接続操作とconsole-only完了を除去する
  - stats、standings、daily、chartの主要buttonをAPI retryまたはrouteへ接続し、何も起きない操作を削除する。
  - _Depends: 4.2, 5.1_
  - _Requirements: 4.4, 5.4, 6.2_
  - _Boundary: Route Integration_

## 6. 契約・品質検証

- [ ] 6.1 API契約とadapter/unit検証を追加する
  - `{ data }`、status、ErrorEnvelope、nullable、empty/uncomputed、三麻/四麻、series、BE算出値を検証する。
  - rank/point/aggregate/statisticsのFE再計算、0埋め、sortによるrank変更が検出されることを確認する。
  - _Depends: 1.1, 1.2, 2.2, 3.1_
  - _Requirements: 1.2-1.4, 2.2-2.4, 3.1-3.3, 6.3, 7.3_
  - _Boundary: Contract Validation_

- [ ] 6.2 主要画面のloading/error/empty/smoke検証を行う
  - Home/League/Seasonからstats、standings、daily、progression、back/navigationまでを確認する。
  - 401/403/404/409/validation/transport、未計算、0件、狭いviewport、keyboard操作を検証する。
  - _Depends: 2.1, 2.2, 3.1, 4.2_
  - _Requirements: 2.3, 2.4, 3.3, 4.1-4.4, 6.1-6.3_
  - _Boundary: UI Validation_

- [ ] 6.3 typecheck、lint、buildとlegacy静的scanを完了する
  - `pnpm typecheck`、`pnpm lint`、`pnpm build`を実行し、mock/direct fetch/console/旧型/FE集計/未接続buttonをscanする。
  - 境界外のSession/Match、League/Season CRUD、BE実装を変更していないことを確認し、残存資産を理由付きで記録する。
  - _Depends: 5.2, 5.3, 6.1, 6.2_
  - _Requirements: 5.1-5.4, 6.3, 7.1-7.3_
  - _Boundary: Quality Gate_
