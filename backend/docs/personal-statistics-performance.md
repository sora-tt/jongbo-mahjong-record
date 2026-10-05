# 個人成績API 性能測定

## 測定方法

- 実行日: 2026-10-04
- 環境: ローカル Firestore Emulator (`jongbo-local`)
- 実行コマンド: `pnpm --dir backend measure:stats:emulator`
- 各経路は5回のwarm-up後に50回連続で実行し、p95を記録した。
- Honoの既存route、query validation、service、Firestore repositoryを通し、認証だけ測定用middlewareに置き換えた。リクエストはHonoのin-process APIで実行しているため、TCP・TLS・実環境の認証検証時間は含まない。p95はHono request開始からresponse bodyを読み切るまでを計時し、計時区間にクライアント側のJSON parseや再シリアライズを含めない。
- 1つの再現データを全経路で共有した。viewerとtargetそれぞれ200対局、計400 projection document、リーグ参加者4人、期間指定に該当する対局は各120件とした。
- response bytesはHonoのresponse body実測byte数。Firestore document read数は各repositoryのdocument取得、query結果件数、historyのlook-ahead documentから数えた。Emulatorの課金メトリクスではなく、このfixtureにおけるコード経路のdocument read数である。

## 結果

以下はこの実行の観測値であり、ローカル環境の負荷によってp95は変動する。

| API経路 | Firestore document reads / request | Response bytes | p95 |
|---|---:|---:|---:|
| 本人・全体・固定summary | 1 | 6,971 B | 7.38 ms |
| リーグ参加者の別target・summary | 4 | 7,028 B | 18.99 ms |
| 本人・任意期間summary | 121 | 7,045 B | 74.16 ms |
| 本人・任意期間analysis | 121 | 11,737 B | 13.90 ms |
| 本人・履歴の初回50件 | 52 | 38,812 B | 11.25 ms |
| 初回リーグroster | 6 | 410 B | 8.87 ms |
| 初回シーズンroster | 2 | 346 B | 4.90 ms |

すべて50 sampleで、固定scope summaryは保存済みsnapshotの1 documentから返る。任意期間summaryとanalysisはUserStats 1 documentに加え、期間に一致したprojection 120 documentsを読む。履歴はUserStats 1 documentと、50件ページおよび次ページ判定用のprojection 51 documentsを読む。

リーグtarget summaryの4 readsは、viewer/targetのmembership query結果2 documents、league存在確認1 document、targetのUserStats 1 documentで構成する。リーグrosterはviewer membership 1 document、league document 1件、member document 4件。シーズンrosterはviewerのleague membership 1 documentと、member情報を内包するseason document 1件。

## 性能上の判断

固定scope summaryは対局数に依存しない1 document readで、画面初期表示に使う経路として軽い。任意期間summaryとanalysisは対象期間内の対局数に応じてread数・集計時間が増える。analysisは必要なタブを開いたときだけ取得し、同一queryの画面内cacheを再利用する設計を維持する。履歴は50件に制限され、look-aheadを含めてもprojection readは51件で上限がある。

測定中にscope存在確認とroster認可で参加者一覧を重複して読む経路を確認した。statistics readerのscope確認を単一documentの`exists` readに統一し、リーグrosterの認可を対象viewerだけのmembership queryに変更した。season rosterは認可と返却に同じ取得済みseason member一覧を使う。4人のfixtureでは、リーグrosterは従来の10 readsから6 reads、シーズンrosterは7 readsから2 readsとなる構成である。

数値SLOは新設しない。実環境のFirestore latency、認証、ネットワーク、実データの分布はこの測定に含まれないため、上記p95は経路間の比較用として扱う。
