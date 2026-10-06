# 調査ログ: backend-integrity-lifecycle

## 調査概要

`backend-foundation` が固定した Firestore の正本パス、camelCase Domain/API DTO、認証・ErrorEnvelope、Hono route 境界を前提に、既存の Session/Match サービス、scoring、aggregation、StatsRebuilder、Season/League/UserStats repository を拡張する方針を調査した。新規外部ライブラリは不要であり、既存の TypeScript、Firebase Admin SDK、Firestore transaction/batch、Emulator を利用する。Issue #123では既存のrule lockとmatchIndexを再利用し、座順rotationそのものをFE側へ境界化する。

本リポジトリには `product.md`、`tech.md`、`structure.md` および `.kiro/settings/templates/specs/` のテンプレートが存在しないため、AGENTS.md、roadmap.md、backend-foundation の仕様、現行 backend 実装、指定された Kiro ルールを根拠にした。

## Extension Point Analysis

### 既存の拡張点

- `backend/src/domain/shared/scoring.ts` は raw score から rank と point を決める単一の計算入口である。
- `backend/src/domain/shared/aggregation.ts` は Season/League/UserStats の派生値を match 集合から組み立てる入口である。
- `MatchService`、`SessionService`、`SeasonService`、`LeagueService` は HTTP route と repository の間の application service である。
- `StatsRebuilder` は Match 変更後に Season、League、Session count、user_stats を更新する既存の再構築境界である。
- Firestore repository は上流仕様の snake_case 保存と camelCase DTO の変換を担う。今回の仕様では collection/path、公開 DTO、認証境界を変更しない。

### 現行実装との主な差分

- Session の member 数は 3〜4 のみで、league rule の gameType、重複、固定メンバーとの完全一致を一体で保証していない。
- Match は結果の userId と wind の重複、Session メンバーとの完全一致、三麻の wind 制約を十分に保証していない。
- Match index は最大値取得後に通常 write しており、同時作成で同じ index になる余地がある。
- Rule 変更、active season、削除後の派生値、user_stats の stale record、再構築失敗の再実行境界が一貫していない。
- `user_stats` は上流が定めた論理キーを持つが、現行 upsert は自動 ID の検索後に作成するため、同時 upsert による重複を防ぎ切れない。

## Dependency and Technology Check

- 新規依存は追加しない。
- Firestore transaction は Session document を競合検知の共有 read/write 点として利用し、Match index の割当と Match 本体・Session の match count 更新を直列化する。
- Firestore batch は派生 Season/League/UserStats の deterministic write 単位に利用し、失敗時は canonical Match を残して同じ入力の rebuild を再実行する。
- 既存の Hono route、Zod schema、ErrorEnvelope、status、AppType は `backend-foundation` の契約をそのまま利用する。

## Design Decisions

### 一般化

- Session/Match の create/update/delete は、個別 route の副作用ではなく「正本 write → 対象 scope の rebuild」という lifecycle 操作として一般化する。
- Season、League、overall の集計は同じ canonical Match stream から作る scope 別 projection とし、個別加算ロジックを正本にしない。
- user_stats は scope ごとの deterministic logical key で upsert/delete する。scope の削除は source Match と派生 stats を同じ lifecycle として扱う。

### Build vs. Adopt

- custom queue、event store、外部 lock service は導入しない。現行ロードマップがリアルタイム同期と本格的な複数端末同時編集を対象外としており、Firestore transaction/batch と再実行可能な rebuild で必要な整合性を満たせるためである。
- score calculation は新規ライブラリへ移さず、既存の scoring domain function を契約化して検証する。既存結果を不用意に変更しないためである。

### Simplification

- 公開 API を増やさず、repair/rebuild は application service とローカル運用 script の境界に留める。
- 正本 Match に aggregate の写しを追加しない。Season/League/UserStats は rebuild 可能な派生 read model とする。
- 既存 collection/path の外に新しい正本を作らない。Rule lock と index allocation の競合検知に必要な metadata は既存 League/Session document の非公開フィールドとして扱い、Domain/API DTO へ漏らさない。

## Boundary and Integration Findings

- `backend-foundation` から受け取る契約は League の embedded rule、Session/Match の公開 DTO、`{ data }`、ErrorEnvelope、status、session cookie、Hono RPC の AppType、user_stats logical key、snake_case 保存である。
- `frontend-session-match` は Session メンバー制約と BE が返す rank/point/matchIndex を利用する。FE は点数・順位を再計算しない。
- `frontend-statistics-quality` は Season/League/UserStats の rebuild 後の派生値、sanma の fourth 系 null、削除後の stale stats cleanup を利用する。
- Rule の scoreCalculation、新しい rule master、直接 Firestore 読み取り、FE の独自集計は対象外である。

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Match 本体保存後の rebuild 失敗で派生値が一時的に古くなる | API は標準 internal error を返し、canonical Match を重複作成せず repair/rebuild を再実行する |
| 同時 Match create と rule update が異なる rule を見る | League document の lifecycle metadata を同一 transaction の競合点にして、最初の Match write で rule を lock する |
| 削除後に user_stats が残る | scope の deterministic key を列挙し、source が消えた scope の stats を rebuild 後に削除する |
| 既存データの rank/point が新計算と異なる | 既存 scoring の tie、uma、oka、丸め規則をテストで固定し、移行なしに既存 Match を書き換えない |
| 既存の不正・欠損データを rebuild が推測してしまう | 必須値・scope・gameType の契約違反は repair report で検出し、既定値で補正せず停止する |

## ISSUE-99 追加調査（2026-10-01）

### 拡張点

- 現行 `backend/src/domain/shared/scoring.ts` はrawScore totalを `startingPoints × playerCount` と照合し、既存point totalが0から0.2を超えて外れた場合に拒否する。ここが外卓供託とチョンボ罰符を反映する計算境界である。
- `backend/src/application/services/matchService.ts` は既存Match入力を読み、scoring結果をcanonical Matchへ保存する境界である。Matchの外卓fieldを別々に保ったまま計算へ渡す。
- `backend/src/domain/shared/aggregation.ts` はMatch集合からUserStatsを作る境界である。chombo回数はMatch event配列の出現数を各scopeで合計すれば、別の正本・追加collectionなしに再構築できる。

### 計算判断

- 卓外供託は1本をraw score 1,000点として扱い、rawScore合計を `startingPoints × playerCount - 1000 × count` と照合する。rawScoreから計算される点数合計への効果を維持し、点数から同じ供託分を二重に差し引かない。
- chomboはLeague ruleの非負整数罰符を各eventのoffender pointから引く。rank、rawScore、PR #104のfloatingCount判定は変更しない。
- `expectedPointTotal = -(chomboEvents.length × chomboPenaltyPoints + offTableKyotakuCount)` とし、既存の小数第1位丸め許容0.2で照合する。外卓入力がない場合は既存の0合計に一致する。
- `allowOffTableKyotaku=false`ならcount 0だけを受け付ける。offenderはSession member集合内に限るが、同一offenderのevent重複は許す。

### build vs. adopt とリスク

- 新規ledger/collection、score engine、依存packageは追加せず、既存scoring pure functionとcanonical Match eventからのrebuildへ拡張する。
- chombo eventとkyotakuを同じ保存fieldへ統合すると、UserStats回数やruleによるkyotaku表示制御を失うため採用しない。計算段階のみ外卓要因としてまとめる。
- 既存Leagueは新rule defaultが0/falseであり、初回Match後はrule lockされる。既存Leagueの設定移行が必要かは運用計画で確認し、計算時の自動推測や履歴再計算は行わない。

## 未解決ではなく明示した仮定

- League の member 変更は Match 本体を変更せず、以後の Session 作成可否だけに影響する。過去 Match に参加したユーザーの履歴は保持する。
- active season を削除または archived にした場合、別の archived season を自動昇格せず activeSeason は null とする。
- Match の同点順位は competition ranking、同順位帯の uma は平均配分、point は小数第1位へ丸める現行計算を正本とする。
- Match index は Session 内で現在の最大 index + 1 を transaction で割り当て、削除時に既存 index を詰めない。削除した最大 index の再利用を防ぐ別の公開契約は追加しない。

## ISSUE-123 追加調査（2026-10-05）

### rule lifecycleとの関係

- `rotateSeatOrder`はLeague ruleの設定値であり、windの初期割当はFEが行う。BEは従来どおりresultsの各windをvalidateし、Matchに保存する。
- 既存の最初の正本Match後rule lockは新fieldにも適用する。初回Match前は値を更新でき、初回Match後に値だけを変更してもconflictとなる。
- `matchIndex`は同Sessionで保存順を識別する既存の正本値である。削除による欠番は許容され、FEは最大indexを前対局として利用する。BEの採番、scoring、aggregateは変更しない。

### 設計判断

- 採用: 新たなBE rotation algorithm、Match field、migration、public routeを追加しない。rotation flagの保存契約はbackend-foundation、rule editorはfrontend-league-season、saved windからの初期値計算はfrontend-session-matchが所有する。
- 再検証条件: rule lockを緩める、既存Matchのwindを自動で書換える、またはmatchIndexの意味を変更する要求が生じた場合は本仕様へ戻す。
