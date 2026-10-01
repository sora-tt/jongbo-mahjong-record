# 調査ログ: variable-rank-points

## 調査概要

既存League rule、BEの点数計算・永続化・HTTP契約、FEのLeague作成・編集・詳細表示を拡張点として確認した。新規ライブラリは不要で、既存のTypeScript、Hono、Zod、Firestore Repository、Hono RPC型、Reactフォームを利用する。

`.kiro/settings/templates/specs/` と `product.md`・`tech.md`・`structure.md` はリポジトリに存在しない。設計書は同リポジトリの承認済みspec構成と指定されたKiro設計ルールを基に作成した。

## Extension Point Analysis

- `backend/src/domain/shared/scoring.ts` がraw scoreから順位・pointを決める単一の計算入口であり、現在は固定umaとokaを適用する。
- `backend/src/domain/league/rule.ts` がLeague作成・更新前のuma合計0を検証し、LeagueServiceはRepository書き込み前にこれを実行する。
- `backend/src/infrastructure/firestore/repositories/leagueRepository.ts` がLeague ruleのsnake_case保存とcamelCase Domain変換を担う。既存Firestore文書にはumaの方式識別子がない。
- rule lockは現行コードにある。`FirestoreMatchRepository.create` が初回Match登録transactionでLeagueの `rule_locked` をtrueにし、`FirestoreLeagueRepository.update` がlocked Leagueのrule変更をConflictで拒否する。新ruleのmapper追加時もこの非公開metadataと保存済みMatch結果を維持する。
- `backend/src/presentation/schemas/league.ts` と `openapi.ts` がLeague作成・更新の入力と公開契約を定義する。
- FEのLeague create/edit hooksが入力stateとumaの合計検証を管理し、ページが入力を描画する。League詳細は固定umaを横並びの値として表示する。
- Match結果はBEが計算した `rank` と `point` を保存し、Season/League/Stats集計は保存結果を利用する。FEでpoint計算する必要はない。

## 公式用語

日本プロ麻雀連盟の公式解説は「順位点が浮き沈み方式」と表現し、1〜3人浮きの例を掲載している。[公式ルール解説](https://www.ma-jan.or.jp/class_2/35023.html) また同連盟の解説は、原点30,000点を基準とした浮き沈みと順位点の変化を説明している。[浮き沈み方式の解説](https://www.ma-jan.or.jp/class_2/49762.html) この調査範囲では、これを単一の正式名称として規定する記載は確認できないため、実装名は機能を直接表す「浮き人数別順位点」とする。

ISSUE #98 の例は25,000点持ち・25,000点返しであり、連盟公式ルール全体を採用するものではない。仕様・画面では機能動作を表す「浮き人数別順位点」を用い、浮き人数の基準点はルールの `returnPoints` とする。

## UX調査

`ui-ux-pro-max` の `ux` 検索結果に従い、数値入力は可視ラベルを付け、行ごとの合計エラーを入力群の近くに表示して `aria-describedby` で関連付ける。送信エラーではエラー概要へフォーカスを移し、修正後も入力値を保持する。5行×4列の表は狭い画面で横スクロールさせず、浮き人数ごとのカード内に順位入力を2列で表示する。

同SkillのNext.js stack検索はNext.js 16.2向けのServer Actions提案を返したが、このリポジトリはNext.js 15.5.4で、既存のHono API clientを使う設計であるため採用しない。今回のUIは既存コンポーネントとフォーム方式を継続する。

## Design Decisions

### 一般化

- `uma` を固定方式と浮き人数別方式の判別可能なunionにする。順位点選択をまずLeague ruleの契約として表し、今回の対象は四麻の0〜4人表に限定する。
- 点数計算は既存の `calculateMatchPoints` を拡張し、浮き人数のカウントを点数計算の入力から導出する。独立した計算サービスや複数実装の抽象層は作らない。
- API responseとDomain ruleは明示modeを持つ。既存clientのmodeなしfixed requestはfixedとして受理し、Domain型へ正規化する。Firestoreの旧文書もmodeなしfixedとして読み、既存データの一括更新はしない。

### Build vs. Adopt

- 既存のHono/Zod、Firestore mapper、Hono RPC、FEの型付きAPI wrapperを利用し、新規依存・別API・共通runtime packageを導入しない。
- ルール合計検証は既存のBE Domain validatorとFE事前検証を拡張する。FEはBE判定を最終結果とし、検証ロジックをBEの代わりにはしない。

### Simplification

- 新規rule masterや点数計算strategy registryは作らず、League内のembedded ruleに方式と表を保持する。
- 既存Firestore文書は一括更新せず、Repository mapperが方式なしのumaを固定方式として読み取る。Match・集計済みpointは再計算しない。
- Sanmaの浮き人数別順位点は配点表が要件にないため追加しない。

## Integration Risks and Mitigations

| リスク | 対応 |
|---|---|
| 既存Firestore文書に `mode` がなく、読込で失敗する | Mapperで方式欠落を固定umaと解釈し、読み取り時の一括migrationを避ける |
| FEだけが新DTOを送り、BE契約が旧shapeのままになる | Hono route schema、Domain型、OpenAPIとFEの型導出を同じ変更単位で更新する |
| 旧Matchを新計算で再処理すると履歴が変わる | League rule lockを維持し、保存済みMatch結果と既存集計値を更新しない |
| 浮き判定を返し点との一致で誤る | `rawScore > returnPoints` をBEの正本条件とし、FEには同じ基準を表示する |
| 5×4入力がモバイルで読めない | 広い画面は表、狭い画面は浮き人数ごとの2列カードに切り替える |
