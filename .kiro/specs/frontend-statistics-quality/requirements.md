# 要件定義: frontend-statistics-quality

## プロジェクト説明

個人成績、順位表、日次記録、ポイント推移の画面は、旧domain型、mock、手書きresponse型、Redux、重複コンポーネントが混在している。画面ごとにnullable値、空データ、チャート色、loading/errorの扱いも異なり、FEが順位・点数・累計値を再計算してBEの正本と乖離するリスクがある。本仕様では、前段で整備したAPI境界と共通UIを利用して統計・記録表示を整理し、不要な旧実装を安全に退役させる。

## スコープと境界

### 対象

- 個人成績、ユーザー統計、season standings、league/season records
- 日次記録、point progression、既存チャート
- 三麻/四麻のnullable項目、0件、未計算状態の表示
- stats API hooks、typed adapter、共通table/card/chart、loading/error/empty state
- mock、手書きresponse型、旧domain型、不要Redux、重複hooks/components、未接続操作の整理
- route、metadata、認証ガード、typecheck/lint/build/契約・画面スモーク検証

### 対象外

- BE側の新しい統計指標、集計アルゴリズム、DB/API変更
- FEでのrank、point、aggregate、statisticsの再計算
- リアルタイムチャート、新しい分析機能
- League/Season/Session/MatchのCRUD業務ロジック
- 共通UI primitive、API client、Auth boundaryの再設計

### 隣接仕様との契約

- `frontend-foundation-ui` のtyped API client、AppType由来型、adapter境界、AsyncState、ErrorEnvelope、共通Table/Card/Chart、認証ガードを利用する。
- `frontend-league-season` のSeason detailから統計表示へ渡るrouteと、League/SeasonのBE算出済みrecordsを利用する。
- `frontend-session-match` のMatch response、固定Session member、BE算出rank/point/matchIndexを再計算せず表示する。
- `backend-foundation` と `backend-integrity-lifecycle` のcamelCase DTO、ISO日時、nullable semantics、集計・repair/rebuild後のBE値を正本とする。

## 要件

### Requirement 1: 統計APIと表示model

1.1 When 統計・順位・日次記録・ポイント推移を表示するとき, the Statistics-Quality Feature shall `AppType`から導出したtyped APIと表示adapterを経由し、route componentから直接fetchしない。

1.2 When API DTOを表示modelへ変換するとき, the Statistics-Quality Feature shall camelCase、opaque ID、ISO 8601、nullable値、三麻のfourth系nullを保持し、0・空文字・現在日時へ暗黙に置換しない。

1.3 When BEが返すrank、point、standing、record、aggregate、progressionを表示するとき, the Statistics-Quality Feature shall APIの値をそのまま表示し、FEで順位付け、合算、平均、再集計、欠損補完を行わない。

1.4 If APIの契約、status、ErrorEnvelope、型が変更された場合, the Statistics-Quality Feature shall adapter、hook、表示、契約検証の不一致をtypecheckまたはテストで検出できる構成を維持する。

### Requirement 2: 個人成績と順位表

2.1 When 利用者が個人成績またはユーザー統計を表示するとき, the Statistics-Quality Feature shall BEが返した期間・対象範囲・対局数・順位・点数・記録をラベル付きで表示する。

2.2 When SeasonまたはLeagueのstandingsを表示するとき, the Statistics-Quality Feature shall BEの配列順、rank、point、member情報、nullable値を保持して表形式で表示し、FEでsortやrankの振り直しをしない。

2.3 When standingsまたは個人成績が正常な空配列、null、未計算状態を返すとき, the Statistics-Quality Feature shall エラーと混同しないemptyまたはuncomputed stateを表示し、存在しない実績を0として表示しない。

2.4 When stats取得が401、403、404、409、validation、transport/decode errorになるとき, the Statistics-Quality Feature shall 共通safe message、認証遷移、権限・対象エラー、再試行可能状態を区別する。

### Requirement 3: 日次記録とポイント推移

3.1 When 利用者が日次記録を表示するとき, the Statistics-Quality Feature shall BEが返した日付、対局数、順位、point、recordを時系列の意味を壊さず表示し、日次値をFEで再集計しない。

3.2 When 利用者がpoint progressionまたは既存チャートを表示するとき, the Statistics-Quality Feature shall BEのseries、label、nullable値、単位を共通Chart primitiveへ渡し、独自のデータ変換で意味を変更しない。

3.3 When seriesが空、部分的、null、三麻/四麻で項目数が異なるとき, the Statistics-Quality Feature shall 欠落値と0値を区別し、チャートを誤った連続値として描画せず説明付きempty/uncomputed stateを表示する。

3.4 When チャートを表示するとき, the Statistics-Quality Feature shall 色、凡例、tooltip、単位、responsive layoutを共通tokenと共通Chart primitiveへ統一し、画面ごとのハードコードを残さない。

### Requirement 4: 画面統合と共通状態

4.1 When Season detail、League detail、個人stats、daily recordsのいずれかを表示するとき, the Statistics-Quality Feature shall 同じAsyncState、LoadingState、ErrorState、EmptyState、retry action、Auth boundaryを利用する。

4.2 While stats requestまたはretryが実行中である状態, the Statistics-Quality Feature shall 対象領域のloadingと再試行を表示し、古いrouteや対象の結果で現在の画面を上書きしない。

4.3 When stats取得が成功したとき, the Statistics-Quality Feature shall レスポンスの対象期間、season、league、userを画面metadataへ反映し、別対象のキャッシュ・mock値を表示しない。

4.4 When 主要な統計カード、表、チャートの操作または戻る操作を実行するとき, the Statistics-Quality Feature shall API再取得または明確なroute遷移を実行し、見た目だけで停止するbuttonを残さない。

### Requirement 5: 旧実装の退役

5.1 When 新しいtyped stats APIと表示modelへ移行した後, the Statistics-Quality Feature shall 対象routeから手書きresponse型、直接fetch、mock fallback、旧domain型参照を除去する。

5.2 When 旧stats hook、重複component、不要なRedux slice/storeが他の画面から参照されていないとき, the Statistics-Quality Feature shall 参照を確認したうえで削除し、残す場合は所有範囲と理由を記録する。

5.3 When 旧実装を削除するとき, the Statistics-Quality Feature shall Session/Match、League/Season CRUD、共通基盤で利用中の型・component・storeを誤って削除しない。

5.4 When legacy routeやmetadataが存在するとき, the Statistics-Quality Feature shall 正規route、title、認証ガード、navigationを統一し、同じ画面を二重実装しない。

### Requirement 6: 品質・アクセシビリティ・レスポンシブ

6.1 When 統計画面を表示するとき, the Statistics-Quality Feature shall 共通spacing、typography、color token、Card/Table/Chart primitiveを利用し、ページごとの見た目の差異を最小化する。

6.2 When 利用者がキーボード、狭いviewport、支援技術で操作するとき, the Statistics-Quality Feature shall 展開・再試行・戻る・tooltipを操作可能なfocus、label、loading/disabled状態とともに提供する。

6.3 When typecheck、lint、build、契約テスト、主要画面スモークを実行するとき, the Statistics-Quality Feature shall statsの型契約、BE値の非再計算、主要route、empty/error状態の回帰を検出できる。

### Requirement 7: 境界・引き渡し

7.1 The Statistics-Quality Feature shall BEの集計値の正しさ、統計指標の追加、共通API client・primitiveの所有権を取り込まない。

7.2 If BEから返されない新しい指標が画面要望として現れる場合, the Statistics-Quality Feature shall FEで推測・算出せず、BE契約または別仕様の再要件化対象として扱う。

7.3 When upstreamのDTO、ErrorCode、status、nullable、rank/point/aggregate契約が変更されるとき, the Statistics-Quality Feature shall affected adapter、hook、表示、テストを再検証する。

## 仮定・未決事項

- 既存のstats、standings、records、pointProgressionsを返すBE APIと`AppType`を正本とし、新しいendpointや統計指標は追加しない。
- APIが値を返さない場合は未計算または対象なしとして表示し、FEで0埋め・平均・順位補完を行わない。
- 旧Reduxやmockは、全参照を確認したうえで対象routeから除去する。別featureが利用中の場合は共通基盤へ移さず、所有範囲を明記して段階的に退役する。
