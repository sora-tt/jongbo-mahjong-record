# Roadmap

## Overview

フロントエンド全体を、BEのDB設計・API設計を正として段階的に整理する。段階を増やしすぎないため、BEは「正本・契約」と「ゲーム・集計整合性」の2段階、FEは「基盤・共通UI」「主要画面」「統計・品質」の4段階にまとめる。

現在の実装対象は `origin/develop@4d6c679` とする。現行BEには基本的なCRUDと点数計算が存在するため、BE全体を作り直すのではなく、契約と整合性を先に補強してからFEを移行する。

## Approach Decision

- **Chosen**: BEを2段階、FEを4段階にまとめた段階的移行
- **Why**: DB/API契約、業務整合性、FE基盤、画面、品質という大きな責務境界は維持しつつ、細かすぎる仕様分割によるレビュー負荷を抑えるため。
- **Rejected alternatives**:
  - 10段階に細分化する方式: 責務は明確だが、仕様・レビュー・切り替えが多すぎる。
  - FEを一括で再設計する方式: BE契約が未確定のままになり、型と画面の作り直しが発生する。
  - BEを全面的に作り直してからFEを始める方式: 現行BEのCRUDや計算ロジックまで捨てる必要はない。

## Scope

- **In**:
  - Firestore正本、API契約、認証、エラー、OpenAPIの統一
  - 試合登録、点数計算、集計、削除、active seasonの整合性改善
  - FEの型、API client、フォルダ構成、共通UIの整理
  - リーグ、シーズン、セッション、試合、統計画面の移行
  - 不要な型、mock、Redux、重複コンポーネント、未接続ボタンの整理
  - 型チェック、Lint、API契約テスト、主要画面のスモークテスト
- **Out**:
  - 新しいルールマスタ機能
  - リアルタイム同期や複数端末同時編集の本格対応
  - 移行計画なしの既存データ一括移行
  - FE側での点数・順位・統計の独自再計算
  - 本ロードマップにない新機能

## Constraints

- BEのFirestore設計とAPIレスポンスを正とし、FEは必要な場合だけ表示用adapterを持つ。
- Firestore保存形式は `snake_case`、API/Domain/FEのDTOは `camelCase` とする。
- 試合の点数、順位、累計値はBEの計算結果を表示する。
- 削除や集計更新は、途中失敗時に不整合を残しにくい方式を採用する。
- `.env` / `.env.local` はコミットしない。
- `main` / `develop` へ直接変更せず、Issue番号を含む作業ブランチを使う。

## Boundary Strategy

- BE第1段階でDB正本・認証・API契約・ドキュメントをまとめて固定する。
- BE第2段階でSession/Matchの入力整合性と、集計・削除ライフサイクルをまとめて整備する。
- FE第1段階でAPI境界と共通UIをまとめ、画面ごとの重複実装を止める。
- FE第2段階はリーグ・シーズン、FE第3段階はSession・Matchとして、業務フローの境界を残す。
- FE第4段階で統計表示、旧コード削除、テスト、横断的なバグ修正をまとめる。

## Execution Waves

- **Wave 1**: BE正本・契約・認証
- **Wave 2**: BEゲーム整合性・集計ライフサイクル
- **Wave 3**: FE API基盤・共通UI
- **Wave 4**: FEリーグ・シーズン
- **Wave 5**: FE Session・Match
- **Wave 6**: FE統計・旧コード削除・品質検証

## Specs (dependency order)

- [x] backend-foundation -- Firestore正本、rule保存方式、ID、index、Rules、認証、DTO、エラー、OpenAPI、Swaggerを統一する。Dependencies: none
- [x] backend-integrity-lifecycle -- Session・Matchの制約、三麻/四麻、順位・点数、match index、集計、削除、active season、user_statsを整備する。Dependencies: backend-foundation
- [x] frontend-foundation-ui -- BE APIを正とするFE型・API client・adapter・認証・エラー・フォルダ規約と、共通UI・Header・デザイントークンを統一する。Dependencies: backend-foundation, backend-integrity-lifecycle
- [x] frontend-league-season -- リーグ・シーズン画面のCRUD、表示、未接続ボタン、mock依存を整理する。Dependencies: frontend-foundation-ui
- [x] frontend-session-match -- 参加者選択、Session、Match入力・編集・結果画面を共通化し、BE計算結果を表示する。Dependencies: backend-integrity-lifecycle, frontend-foundation-ui, frontend-league-season
- [x] frontend-statistics-quality -- 個人成績、ランキング、日次記録、チャートを移行し、旧型・mock・Redux・重複コードを削除して品質検証を追加する。Dependencies: backend-integrity-lifecycle, frontend-foundation-ui, frontend-league-season, frontend-session-match
