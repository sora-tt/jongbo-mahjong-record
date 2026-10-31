# 実装タスク: frontend-pwa-standalone

## 1. Foundation: standalone起動設定と共通基盤を整える

- [x] 1.1 standalone起動metadataとブランドアイコンを提供する
  - Web App Manifestにアプリ名・short name・起動URL・scope・standalone表示・背景色・テーマ色を設定する。
  - 192px/512px通常アイコン、512px maskable icon、180px Apple touch iconを既存の4タイルロゴから用意する。
  - root metadataにApple Web App設定とアイコンを加え、Viewportにtheme colorとviewport-fit coverを設定する。
  - 完了時にManifestと各アイコンが公開URLで取得でき、Manifestに指定した値とmetadataが設計どおりに揃っている。
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2_
  - _Boundary: PWA起動metadata_

- [x] 1.2 共通シェルをsafe area内に配置する
  - AppShellとAuthFormShellに端末のsafe-area insetsを考慮するレイアウトを適用する。
  - sticky Headerの背景と内部上余白、固定モバイルドロワーの上下余白をシステム領域に対応させる。
  - safe-area値がない端末では現在の最小余白とレイアウトを保つ。
  - 完了時にAppShell、認証フォーム、固定ドロワー、案内ページの主要内容がsafe area内に収まる。
  - _Depends: 1.1_
  - _Requirements: 3.3_
  - _Boundary: SafeAreaShells_

## 2. Core: ホーム画面への追加方法を案内する

- [x] 2.1 iPhoneとAndroidのインストール案内を公開する
  - 認証不要の /install ページにiPhone SafariとAndroid Chromeの手順をそれぞれ掲載する。
  - iOSの「Webアプリとして開く」が表示された場合に有効化する手順を明記する。
  - Android Chromeのメニュー名が異なる可能性を説明し、特定OSの判定や分岐は行わない。
  - Safariとホーム画面Webアプリのログイン状態が共有されない場合があることを案内する。
  - 完了時に未ログイン状態でも /install を開け、両OSの手順をテキストで確認できる。
  - _Requirements: 2.1, 2.2_
  - _Boundary: InstallGuidePage_

## 3. Integration: 既存画面から案内へ接続する

- [x] 3.1 ログイン画面とモバイルナビゲーションに案内リンクを追加する
  - ログイン画面の既存footer linksに /install へのテキストリンクを追加する。
  - 認証済み画面のモバイルドロワーに同じ案内へのリンクを追加し、遷移時はドロワーを閉じる。
  - 既存の認証状態、ログイン導線、ナビゲーション状態管理は変更しない。
  - 完了時に未ログイン時はログイン画面から、認証済みスマートフォン表示ではドロワーから案内へ移動できる。
  - _Depends: 1.2, 2.1_
  - _Requirements: 2.1_
  - _Boundary: InstallEntryLinks_

## 4. Validation: 対応環境で受け入れ条件を確認する

- [x] 4.1 通常ブラウザー表示とインストール案内の到達性を確認する
  - 通常のブラウザーで / を開いた場合にブラウザー操作部分を含むWebサイト表示が維持される。
  - ログイン画面とモバイルドロワーのリンクから /install に移動し、両OSの手順を確認できる。
  - 完了時に / と /install が通常のブラウザーで閲覧でき、iOS手順に起動選択の説明が含まれている。
  - _Depends: 3.1_
  - _Requirements: 1.4, 2.1, 2.2_
  - _Boundary: PWA起動metadata, InstallGuidePage, InstallEntryLinks_

- [ ] 4.2 iOS Safariのホーム画面起動と認証・safe areaを実機確認する
  - iOS 16.4以降のSafariから手順どおりに追加し、「Webアプリとして開く」が有効なアイコンを起動する。
  - アドレスバー等がないstandalone表示、アプリ名・アイコン・テーマ色、ノッチ端末での画面端を確認する。
  - 未認証時に既存ログインへ進み、認証済み時に既存サービス入口が開くことを確認する。Safari側の認証共有は前提にしない。
  - 完了時に対象iPhoneで起動・識別・操作領域・認証の各条件を確認できる。
  - _Depends: 3.1_
  - _Requirements: 1.1, 1.3, 3.1, 3.2, 3.3, 4.1, 4.2_
  - _Boundary: PWA起動metadata, SafeAreaShells, ExistingAuthEntry_

- [ ] 4.3 Android Chromeのインストール起動と認証・safe areaを実機確認する
  - Android Chromeからインストールまたはホーム画面追加を行い、アイコンから起動する。
  - アドレスバー等がないstandalone表示、アプリ名・アイコン・テーマ色、システム操作領域での表示を確認する。
  - 未認証時に既存ログインへ進み、認証済み時に既存サービス入口が開くことを確認する。
  - 完了時に対象Android端末で起動・識別・操作領域・認証の各条件を確認できる。
  - _Depends: 3.1_
  - _Requirements: 1.2, 1.3, 3.1, 3.2, 3.3, 4.1, 4.2_
  - _Boundary: PWA起動metadata, SafeAreaShells, ExistingAuthEntry_

## Implementation Notes

- 4.1: 本番ビルドのlocalhost smokeで `/`、`/install`、`/login`、`/manifest.webmanifest` がHTTP 200、通常Chromeのウィンドウで `/` と `/install` を確認。localhost bind/connect は実行環境の制限により承認付きで実施した。

