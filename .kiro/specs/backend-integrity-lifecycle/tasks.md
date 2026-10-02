# 実装タスク: backend-integrity-lifecycle

## 1. Session/Matchの正本入力と計算

- [x] 1.1 (P) Sessionの固定参加者とgameType制約を実装する
  - 三麻を3人かつeast/south/west、四麻を4人かつeast/south/west/northとして検証する。
  - Season membership外のユーザー、重複userId、Sessionと異なるMatch参加者を正本write前にvalidation errorへ変換する。
  - 既存のSession DTO、ErrorEnvelope、認証境界を変更せず、Session members snapshotが作成後に変化しない。
  - 完了時、三麻/四麻の正常ケースと不正人数・重複・membership外・参加者差し替えケースがEmulatorまたはunit testで失敗理由を特定できる。
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.3_
  - _Boundary: Session Integrity_

- [x] 1.2 (P) raw scoreからrank/pointを決定する計算契約を固定する
  - raw score合計、allowed wind、request rank非依存、competition ranking、同点uma平均、oka、point丸め、zero-sumを既存scoring境界に実装する。
  - 同一ruleと入力で同一のcomputed rank/pointを返し、sanmaのfourth値を生成しない。
  - 完了時、三麻/四麻、同点、合計不一致、wind重複、point total違反のunit testが通る。
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - _Boundary: Match Scoring_

## 2. Canonical lifecycleと競合制御

- [x] 2.1 Session transactionを競合点にしたMatch index allocationを実装する
  - Match createをtransaction境界へ移し、Session内で重複しない正のmatchIndex、canonical Match、Session totalMatchCountを同じ正本操作として確定する。
  - Match updateはmatchIndexを変更せず、deleteは既存indexを詰めず、Match createの同時実行が同じindexを返さない。
  - 完了時、並行createとdelete後createのEmulator testで重複indexがなく、既存Matchのindexが変化しない。
  - _Depends: 1.1, 1.2_
  - _Requirements: 3.3, 3.4, 4.1_
  - _Boundary: Canonical Lifecycle_

- [x] 2.2 (P) Rule lockとactive seasonの遷移をtransactionalにする
  - 最初のMatch createと同時にLeagueの非公開rule lockを設定し、以後のrule updateをconflictで拒否する。delete後もlockを解除しない。
  - active Seasonのcreate/promote/archive/deleteでLeagueごとの最大1件とactiveSeason cacheを保ち、別activeがある場合は変更をcommitしない。
  - 完了時、rule update race、二重active race、active削除後のcache null、archived自動昇格なしを検証できる。
  - _Depends: 2.1_
  - _Requirements: 3.1, 3.2, 6.1, 6.2_
  - _Boundary: Canonical Lifecycle_

- [x] 2.3 (P) Match/Session/Season/League削除の影響範囲を接続する
  - Match変更後に対象Session/Season/League/overallへ、Session/Season/League削除後に必要な親scopeとstats cleanupへrebuildを接続する。
  - recursive deleteの再実行とpartial failureがsource Matchを重複作成せず、公開APIが既存status/ErrorEnvelopeを返す。
  - 完了時、各削除後に残存scopeのcount/records/cacheがcanonical Matchと一致し、削除scopeのstatsが残らない。
  - _Depends: 2.1, 2.2_
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.3, 8.1_
  - _Boundary: Canonical Lifecycle_

## 3. 集計とuser_stats rebuild

- [x] 3.1 deterministicなSeason/League/overall集計を実装する
  - MatchをplayedAt、sessionId、matchIndex、matchIdで順序付け、standing tie-break、progression、records、streakを同じ順序から生成する。
  - Season、League、overallの各projectionがcanonical Matchを入力とし、派生値を入力にして再計算しない。
  - 完了時、同一fixtureを複数回計算して同じstanding、progression、record、point、countが得られる。
  - _Depends: 1.2, 2.1_
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.2, 7.4_
  - _Boundary: Aggregate Calculators_

- [x] 3.2 logical key user_stats upsertとstale cleanupを実装する
  - `overall_{userId}`、`league_{leagueId}_{userId}`、`season_{leagueId}_{seasonId}_{userId}`をdocument IDとして使用し、同時upsertで自動ID重複を作らない。
  - sanmaのfourthCount/fourthRateをnullにし、削除されたscopeまたはsourceのないstatsをcleanupする。
  - 完了時、再buildを二度実行してもstats document数と値が変わらず、削除後にstale recordが残らない。
  - _Depends: 3.1_
  - _Requirements: 5.3, 5.4, 7.1, 7.2, 7.3, 7.4_
  - _Boundary: Rebuild Coordinator_

- [x] 3.3 scope rebuildの順序とbatch分割を実装する
  - Season rebuildでSession count/Season projection/season stats、League rebuildでLeague projection/league stats/active cache、Overall rebuildでoverall statsを更新する。
  - Firestore batch上限を超えない単位へ分割し、途中失敗時にcanonical Matchから同じscopeを再実行できるreportを返す。
  - 完了時、Match create/update/deleteとscope delete後の親scopeが指定順序で収束し、派生値の古い値を入力にしない。
  - _Depends: 2.3, 3.1, 3.2_
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 7.3, 8.1, 8.2_
  - _Boundary: Rebuild Coordinator_

## 4. Repairと下流契約の接続

- [x] 4.1 repair/rebuildの運用entry pointを追加する
  - session、season、league、overallのscopeを指定して既存canonical sourceから再構築できる内部service/scriptを追加する。
  - 不正な必須値や既存Matchの計算違反を既定値で補正せず検出し、修復対象とエラーを識別できるreportを出す。
  - 完了時、同じscopeを複数回実行して同じprojectionへ収束し、source MatchのID、index、rank、pointを意図せず変更しない。
  - _Depends: 3.3_
  - _Requirements: 8.1, 8.2, 7.3_
  - _Boundary: Repair Entry Point_

- [x] 4.2 既存routeとfrontend handoffを回帰検証する
  - Session/Match/Season/Leagueの既存routeがbackend-foundationのDTO、status、ErrorEnvelope、AppTypeを維持したままcomputed resultとrebuild後のprojectionを返すことを確認する。
  - frontend-session-match向けに固定members、matchIndex、computed rank/point、frontend-statistics-quality向けにaggregate/user_stats/fourth nullをfixtureで公開検証する。
  - 完了時、FEが点数・順位・統計を再計算せずに利用できるcontract testが通り、auth/API境界の再実装が存在しない。
  - _Depends: 3.3, 4.1_
  - _Requirements: 8.3_
  - _Boundary: Canonical Lifecycle, Rebuild Coordinator, Integrity Test Suite_

## 5. チョンボ・卓外供託の計算と集計

- [ ] 5.1 Match入力の外卓要因を検証する
  - `chomboEvents`の各offenderがSession memberであることをcanonical write前に検証し、同じuserIdの複数eventは個別発生として許可する。
  - `allowOffTableKyotaku`がfalseなら正の供託本数を拒否し、raw score合計を`startingPoints × playerCount - 1000 × offTableKyotakuCount`と照合する。チョンボ回数はraw score合計に加減しない。
  - 完了時、有効な複数回発生・供託入力は受け入れられ、member外offender、禁止供託、合計不一致はMatchを保存せずvalidation errorになる。
  - _Requirements: 2.1, 2.2, 2.6, 2.7_
  - _Boundary: Match Scoring_

- [ ] 5.2 PR #104点数計算へチョンボ罰符を適用する
  - PR #104のrank/uma/oka計算後、各chombo eventごとに設定済み罰符を該当offenderのpointから減算する。罰符はrawScore、rank、floating countを変更しない。
  - 卓外供託はraw score配分を通じてのみpoint合計へ反映し、二重減算しない。期待point合計を`-(chomboEvents.length × chomboPenaltyPoints + offTableKyotakuCount)`と照合し、既存の0.2丸め許容差を適用する。
  - 完了時、Match responseのrank/rawScoreは外卓罰符で変わらず、point合計だけが期待値と一致する。
  - _Requirements: 2.3, 2.4, 2.5_
  - _Depends: 5.1_
  - _Boundary: Match Scoring_

- [ ] 5.3 canonical Matchからscope別chomboCountを算出する
  - overall・League・Seasonの各user_statsについて、scope内MatchのchomboEventsをoffenderUserIdごとに数え、同一userの複数回発生を複数回として加算する。
  - 完了時、各scopeのUserStats.chomboCountがそのscopeのcanonical Match event数と一致し、発生がないuserは0になる。
  - _Requirements: 5.4, 7.5_
  - _Depends: 5.1_
  - _Boundary: Aggregate Calculators_

- [ ] 5.4 Match変更・repair後のチョンボ回数再構築を接続する
  - Match create/update/delete後の既存scope rebuildでchomboCountを更新し、repair/rebuildは派生値ではなくcanonical Match eventから回数を再計算する。
  - updateで外卓項目が省略された場合は既存記録を維持し、削除後にそのMatch由来の回数を残さない。初回Match後のLeague rule lockを維持する。
  - 完了時、CRUDまたはrepair後のoverall・League・Season各回数がcanonical Match集合に収束し、削除scopeのstale statsが残らない。
  - _Requirements: 4.1, 5.3, 5.4, 7.1, 7.3, 7.5, 8.1, 8.2_
  - _Depends: 3.3, 5.1, 5.3_
  - _Boundary: Rebuild Coordinator_

## 6. 検証と回帰テスト

- [x] 6.1 integrity unit testを追加する
  - Session/Match validation、三麻/四麻wind、raw score、rank、同点uma、oka、point rounding、zero-sumを純粋fixtureで検証する。
  - 不正入力がcanonical repositoryへ到達しないことを検証する。
  - 完了時、Requirement 1〜2の境界違反が失敗理由付きで再現できる。
  - _Depends: 1.1, 1.2_
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5_
  - _Boundary: Integrity Test Suite_

- [x] 6.2 Emulator lifecycle testを追加する
  - concurrent Match create、index欠番、rule lock、active season conflict、Match/Session/Season/League deleteと親scope rebuildを実データフローで検証する。
  - canonical Matchが一件だけ存在し、Session/Season/League countとactive cacheが再構築後に一致することを確認する。
  - 完了時、Requirement 3〜6の同時実行・削除・状態遷移の回帰が一つのEmulator test suiteで検出できる。
  - _Depends: 2.1, 2.2, 2.3, 3.3_
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3_
  - _Boundary: Integrity Test Suite_

- [x] 6.3 user_statsとrepairの回帰テストを追加する
  - logical key、sanma fourth null、rates/streak、scope削除後のstale cleanup、rebuild失敗後のinternal errorと再実行収束を検証する。
  - 同じfixtureの複数upsert/rebuildで重複documentが作成されないことを確認する。
  - 完了時、Requirement 7〜8のstats/recovery/handoff結果を識別できるテスト出力が得られる。
  - _Depends: 3.2, 3.3, 4.1_
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3_
  - _Boundary: Integrity Test Suite_
