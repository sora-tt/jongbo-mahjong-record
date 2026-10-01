# 要件定義: variable-rank-points

## プロジェクト説明

リーグ管理者は、現行の固定ウマ・オカだけでは、終局時の返し点超過人数に応じて順位点が切り替わるルールを設定できない。この仕様では四麻リーグのルール設定に固定順位点と浮き人数別順位点を加え、Matchごとの浮き人数と順位に応じたpointを一貫して利用できるようにする。

## スコープと境界

### 対象

- 四麻League ruleでの固定順位点と浮き人数別順位点の選択。
- 0〜4人の浮き人数ごとの、編集可能な1〜4位順位点。
- raw scoreと返し点による浮き人数判定、順位点・オカの計算。
- League作成・編集・詳細画面でのルール設定と表示。
- 既存の固定ruleと保存済みMatch結果の互換。

### 対象外

- 三麻の浮き人数別順位点。
- Match単位でのLeague rule上書き。
- 過去Match・集計済み記録の再計算または一括データ移行。
- 連盟公式ルール全体のプリセット化。

## 要件

### Requirement 1: 順位点ルールの選択と設定

1.1 When 利用者が四麻Leagueを作成または編集するとき, the League Rule Feature shall 固定順位点または浮き人数別順位点を選択できるようにする。

1.2 When 利用者が浮き人数別順位点を選択するとき, the League Rule Feature shall 0人、1人、2人、3人、4人浮きの各場合について1位から4位までの順位点を表示・設定でき、初期値を `0: [0, 0, 0, 0]`、`1: [12, -1, -3, -8]`、`2: [8, 4, -4, -8]`、`3: [8, 3, 1, -12]`、`4: [0, 0, 0, 0]` とする。

1.3 When 利用者が三麻Leagueを作成または編集するとき, the League Rule Feature shall 現行の固定順位点を選択・設定できる状態を維持する。

1.4 When 利用者が既存の浮き人数別順位点Leagueを編集するとき, the League Rule Feature shall 保存済みの順位点テーブルを初期表示する。

1.5 When 利用者が浮き人数別順位点Leagueのルール詳細を表示するとき, the League Rule Feature shall 浮き人数別の全順位点テーブルと浮き判定の基準を表示する。

### Requirement 2: 浮き人数別のMatch point計算

2.1 When Backendが四麻Matchのpointを計算するとき, the Scoring Service shall 各参加者のraw scoreがLeague ruleの返し点を厳密に上回る場合を浮きとし、その人数を0〜4人の範囲で数える。返し点と同点のraw scoreは浮きに含めない。

2.2 When Backendが浮き人数別順位点ruleのMatchを計算するとき, the Scoring Service shall raw scoreから決定した各参加者の順位と浮き人数に対応する順位点を適用する。

2.3 When BackendがMatch pointを計算するとき, the Scoring Service shall オカを順位点テーブルとは独立して現行の規則で計算し、同点者には同順位帯の順位点とオカを等分し、小数第1位へ丸める。

2.4 When Backendが同じLeague ruleとMatch raw scoreから計算するとき, the Scoring Service shall 同じ順位・pointを返し、丸め誤差の許容範囲内で4人分のpoint合計を0に保つ。

### Requirement 3: ルールの妥当性

3.1 When League ruleが保存されるとき, the League Rule Feature shall 固定順位点の順位点合計、または浮き人数別の各行の順位点合計がそれぞれ0であることを要求する。

3.2 If 浮き人数別順位点ruleの人数行が欠落する、順位点が数値でない、またはいずれかの人数行の合計が0でない場合, the League Rule Feature shall League ruleを保存せず、該当する入力エラーを返す。

3.3 If 利用者がFEで順位点合計0を満たさない値を入力した場合, the League Rule Feature shall 保存前に該当行と合計値を示す入力エラーを表示し、Backendが返す検証結果を最終判定とする。

### Requirement 4: 既存ルールと過去結果の互換性

4.1 When Backendが順位点方式の識別情報を持たない既存League ruleを読み込むとき, the League Rule Feature shall 現行の固定順位点ruleとして扱い、既存のMatch point計算結果を変えない。

4.2 While LeagueにMatchが存在するとき, the League Rule Feature shall 現行のrule lockを維持し、既存Matchおよび集計済み結果を新ルールで再計算しない。

4.3 When 浮き人数別順位点ruleが有効なLeagueのMatch結果または集計を表示するとき, the League Rule Feature shall Backendが保存・集計したrankとpointを利用し、FE独自の順位点再計算を行わない。

## 前提

- 初回対象は四麻とする。三麻用の配点表は依頼に含まれないため、三麻は現行の固定順位点を維持する。
- 浮き人数別テーブルはLeagueごとに編集可能とし、依頼に示された値を初期値として表示する。
- 浮き判定は依頼の「返し点を超える」に合わせ `rawScore > returnPoints` とする。返し点ちょうどは浮きに数えない。
- オカは現行方式で別に計算し、例の開始点・返し点がともに25,000点ならオカは0となる。
- 日本プロ麻雀連盟公式ルールの公式解説は「浮き沈み方式の順位点」と表現する。アプリ上の機能名には「浮き人数別順位点」を用いる。
