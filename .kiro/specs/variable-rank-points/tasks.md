# 実装タスク: variable-rank-points

## 1. League Rule canonical contractとBackend

- [x] 1.1 固定順位点を維持しながらLeague Ruleをcanonical unionへ移行する
  - `LeagueRule` をsanma固定・yonma固定・yonma浮き人数別の判別可能unionにし、三麻の浮き人数別ruleや不完全な人数表を型で表現できないようにする。
  - union導入で型エラーになる全consumerを同じ移行タスク内で更新する。Domain validator、Match scoring、Firestore mapperとseed、League API schema/response、League詳細・編集画面を対象とし、scoring専用の固定rule型やunsafe castを残さない。
  - 浮き人数別の検証・保存・計算が有効になるまでは各Backend境界で明示的に拒否し、固定ruleのみが通る状態を保つ。
  - modeのない旧fixed API requestとFirestore documentを`mode: "fixed"`へ正規化し、以後の書き込みとseedにはmodeを明示する。
  - 完了時、旧fixed request/documentと既存point表示を保ちながら、backendとfrontend両方のtypecheckおよび既存backend contract testsが通る。
  - _Requirements: 1.1, 1.3, 4.1_
  - _Boundary: League Rule Contract, Rule Validator, Match Scoring, Rule Persistence Mapper, HTTP Contract Publication, League Rule UI and Form Integration (explicit contract-migration integration)_

- [x] 1.2 (P) 浮き人数別順位点の保存前検証を有効にする
  - 0〜4人の5行すべてに整数の1〜4位順位点を要求し、各行の合計が0であることを検証する。
  - 三麻指定、欠落行、非整数、合計不一致を拒否し、合計違反では該当floatingCountとactualTotalをvalidation detailsで返す。
  - 完了時、domain unit testsで固定・浮き人数別の正常系と各異常系を確認でき、invalid ruleがrepository writeへ到達しない。
  - _Depends: 1.1_
  - _Requirements: 1.3, 3.1, 3.2_
  - _Boundary: Rule Validator_

- [x] 1.3 (P) 浮き人数別順位点をMatch scoringに適用する
  - raw scoreが返し点を厳密に超えた参加者だけを浮きとして数え、その人数の順位点行を選ぶ。
  - 既存の順位決定、同点の順位帯配分、オカ計算、小数第1位への丸めとzero-sum検証を維持する。
  - 完了時、0〜4人の行選択、返し点と同点、順位slotを跨ぐ同点、オカ、丸め、zero-sumをunit testsで確認できる。
  - _Depends: 1.1_
  - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - _Boundary: Match Scoring_

- [x] 1.4 (P) 浮き人数別ruleのFirestore読書きと旧document互換を完成する
  - `floating_count` modeと0〜4人の全順位点行を欠落なく読み書きし、不正mode・欠損値・非数値はfail fastにする。
  - modeのない既存fixed documentは固定ruleとして読み取り、読み込みだけではdocumentを書き換えない。
  - 完了時、legacy read、新形式のroundtrip、不正データ拒否をrepository testsで確認でき、Firestore schema資料に新旧shapeが記載される。
  - _Depends: 1.1_
  - _Requirements: 1.4, 4.1_
  - _Boundary: Rule Persistence Mapper_

- [x] 1.5 League APIで浮き人数別ruleを受け付け、契約を公開する
  - League create/updateでfixedとfloatingCountのunionを検証し、modeのない旧fixed requestはfixedへ正規化する。
  - API responseにmodeと全5行を含め、validation errorは既存ErrorEnvelopeで返す。OpenAPIとAPI資料に新旧request/response shapeを記載する。
  - 完了時、旧fixed requestと新floatingCount request、gameType整合、row validation error、response/OpenAPIのunion契約をroute contract testsで確認できる。
  - _Depends: 1.2, 1.3, 1.4_
  - _Requirements: 1.1, 1.3, 3.2_
  - _Boundary: HTTP Contract Publication_

## 2. League設定画面

- [x] 2.1 固定・浮き人数別順位点の共通editorと事前検証を作る
  - 四麻のmode選択と、浮き人数別方式の初期値を持つ0〜4人の5行を表示・編集できるようにする。三麻では固定順位点だけを表示する。
  - 空欄を扱える文字列form state、行ごとの合計検証、mode切替時の値保持を実装する。
  - 大画面は見出し付きtable、狭い画面は横scrollしないcardとし、各入力のlabel・`aria-describedby`・error summaryからの移動を提供する。
  - 完了時、FE validation testsで各行の入力と不正合計を識別でき、BE validationが最終判定として残る。
  - _Depends: 1.5_
  - _Requirements: 1.1, 1.2, 1.3, 3.3_
  - _Boundary: League Rule UI and Form Integration_

- [ ] 2.2 League作成・編集フォームを共通editorとAPI unionへ接続する
  - create/edit hooksのstateとpayloadを固定・浮き人数別unionへ対応させ、編集時は保存済みmodeとテーブルを初期表示する。
  - validation、API、rule lockのエラー時に入力を保持し、保存失敗を成功と誤表示しない。
  - 完了時、作成・編集の双方から選択modeと順位点を正しいshapeで送り、FE typecheckが通る。
  - _Depends: 2.1_
  - _Requirements: 1.1, 1.2, 1.3, 3.3, 4.2_
  - _Boundary: League Rule UI and Form Integration_

- [ ] 2.3 (P) League詳細に固定ruleまたは浮き人数別ruleを表示する
  - fixed値または0〜4人の全順位点と「返し点を超えた人数」という基準を表示する。
  - Match結果と統計はBackendが保存したrank/pointを利用し、FE独自の順位点計算を追加しない。
  - 完了時、floatingCount Leagueの詳細でテーブルと基準点を確認でき、既存fixed Leagueも従来どおり表示される。
  - _Depends: 1.5_
  - _Requirements: 1.4, 1.5, 4.3_
  - _Boundary: League Rule UI and Form Integration_

## 3. 互換性と連携検証

- [ ] 3.1 初回Match後のLeague rule lockと保存済みpointを回帰検証する
  - 初回Match登録でlockされ、以後のrule変更がconflictになることを既存emulator testで確認する。
  - Match削除後もlockが解除されず、保存済みMatch pointとaggregateが再計算されないことを確認する。
  - 完了時、浮き人数別ruleの追加後もrule lock lifecycleが既存契約を保つ。
  - _Depends: 1.4_
  - _Requirements: 4.2_
  - _Boundary: Rule Lock Compatibility_

- [ ] 3.2 League作成からMatch・集計までの連携と最終検証を行う
  - floatingCount Leagueを作成し、raw scoreからMatchを登録して、保存pointと集計表示までBackend計算結果が使われることを確認する。
  - 同じflowでlegacy fixed Leagueの読込とMatch表示も確認する。
  - 完了時、frontend typecheck/lint/buildとbackend contract/emulator validationを実行し、League ruleからMatch point・集計まで契約が一致する。
  - _Depends: 1.3, 1.5, 2.2, 2.3, 3.1_
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3_
  - _Boundary: League-to-Match End-to-End Integration_
