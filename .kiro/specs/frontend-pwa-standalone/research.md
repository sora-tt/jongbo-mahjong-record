# 調査・設計決定記録: frontend-pwa-standalone

## 概要

- **仕様名**: frontend-pwa-standalone
- **調査区分**: 小規模な追加
- **主な調査結果**:
  - Next.js App RouterはManifestとアプリアイコンのmetadata規約を備え、追加ライブラリなしでホーム画面起動を設定できる。
  - iOSではSafariからホーム画面へ追加し、選択肢が表示された場合は「Webアプリとして開く」を利用者が選ぶ。Android ChromeはService Workerなしでもインストール可能。
  - iOSホーム画面WebアプリはSafariと別のログイン保存領域として扱い、既存の認証フローを使う。
  - 現在のHeaderにはブランドピンクの背景と白い4タイルのロゴマークがある。PWAアイコンはこの既存意匠を利用できる。

## 調査記録

### Next.js App RouterのManifestとアイコン

- **背景**: 既存フロントエンドにホーム画面起動用設定がないため、現在のNext.js構成で利用できる標準機能を確認した。
- **参照資料**:
  - [Next.js 15 Manifest metadata file](https://nextjs.org/docs/15/app/api-reference/file-conventions/metadata/manifest)
  - [Next.js 15 app icon conventions](https://nextjs.org/docs/15/app/api-reference/file-conventions/metadata/app-icons)
  - [Next.js 15 viewport configuration](https://nextjs.org/docs/15/app/api-reference/functions/generate-viewport)
- **調査結果**:
  - App Routerのroot segmentにmanifest fileを置くと、Next.jsがManifestを提供できる。
  - Next.jsにはbrowser iconとApple touch iconのファイル規約があり、Metadata APIで公開アイコンのURLも設定できる。
- **設計への反映**:
  - frontend/src/app/manifest.ts と静的アイコンを使用する。
  - PWA専用ライブラリや独自のmanifest配信処理を追加しない。

### iOSとAndroidのホーム画面起動

- **背景**: 対応OS、利用者が行うインストール操作、ブラウザUIを隠せる条件を確認した。
- **参照資料**:
  - [WebKit: Home Screen web apps in iOS 16.4](https://webkit.org/blog/13878/)
  - [Apple: Turn a website into an app in Safari on iPhone](https://support.apple.com/guide/iphone/iphea86e5236/27/ios/27)
  - [Chrome for Developers: What’s new for web on Android](https://developer.chrome.com/blog/whats-new-in-web-on-android-io2023)
  - [Google Chrome Help: Use web apps on Android](https://support.google.com/chrome/answer/9658361/use-progressive-web-apps-android?co=GENIE.Platform%3DAndroid&hl=en-GB)
- **調査結果**:
  - iOS 16.4以降では、Manifestのstandalone displayでホーム画面アイコンから独立したWebアプリとして起動する。
  - Safariでは利用者がホーム画面追加を行い、選択肢が表示される場合は「Webアプリとして開く」を有効にする。
  - Android ChromeはService Workerのfetch handlerをインストール条件として要求しない。
  - Android Chromeのメニュー表記は、サイトやブラウザーの状態によって異なり得る。
- **設計への反映**:
  - standalone起動はOSが提供するホーム画面追加操作に委ね、サイトから強制しない。
  - オフライン機能を持たない今回の範囲ではService Workerを追加しない。
  - 画面内にiPhone SafariとAndroid Chromeの手順を示し、Android側のメニュー名には複数の表記があり得ることを説明する。

### Safe areaと既存レイアウト

- **背景**: ホーム画面Webアプリで画面端やシステム操作領域に内容が隠れないよう、既存shellの責務を確認した。
- **参照資料**:
  - [WebKit: Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
  - frontend/src/app/layout.tsx
  - frontend/src/app/styles/globals.css
  - frontend/src/components/layout/app-shell/index.tsx
  - frontend/src/components/layout/header/index.tsx
  - frontend/src/components/layout/auth-form-shell/index.tsx
- **調査結果**:
  - RootLayoutはtitleとdescriptionだけを設定し、safe areaの指定はない。
  - 認証済み画面はAppShell、未認証画面はAuthFormShellを使う。Headerのmobile drawerはviewport固定で表示される。
  - Headerのロゴはブランドピンクの四角い面に白い4タイルを配置している。
- **設計への反映**:
  - viewport全体をcoverする場合は、通常ページ、認証画面、固定mobile drawerの各表示でsafe areaを考慮する。
  - アプリアイコンは既存Headerのロゴ意匠とブランド色を共通化する。

### 認証状態

- **背景**: standalone起動後にSafariのログイン状態を引き継ぐ前提が成り立つか確認した。
- **参照資料**:
  - [WebKit: Storage for Home Screen web apps](https://developer.apple.com/videos/play/wwdc2023/10120/?time=253)
  - [Firebase Authentication: Auth state persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence)
  - frontend/src/lib/firebase/auth.ts
- **調査結果**:
  - iOSのホーム画面WebアプリはSafariとは独立したstorage contextを持つ。
  - 現在のFirebase Authはbrowser session persistenceを使用する。
- **設計への反映**:
  - ホーム画面Webアプリに独自ログイン画面を作らず、既存ログインフローに接続する。
  - Safariとの認証共有やログイン保存方針の変更を本仕様に含めない。インストール後にアプリ内でログインし、終了・再起動時は現在の認証挙動を維持する。

## アーキテクチャ方式の比較

| 方式 | 説明 | 利点 | リスク・制約 | 判断 |
|------|------|------|-------------|------|
| Next.js metadataとブラウザー標準機能 | Manifest、アイコン、既存shell、静的な案内画面を利用する | 追加依存なしで対象要件を満たし、既存構成に沿う | OSごとに追加操作が異なり、実機確認が必要 | **採用** |
| Service Workerを含むPWA | オフラインキャッシュや更新処理を追加する | オフライン対応などを将来拡張できる | 認証済みデータのキャッシュ境界と更新管理が増える | オフラインが対象外のため不採用 |
| ネイティブshell | Webアプリをネイティブパッケージに含める | ストア配布や端末APIを利用できる | 配布、ビルド、認証連携の運用が増える | 本仕様の範囲外 |

## 設計統合

- **共通化**: iOSとAndroid Chromeで異なるインストール操作を利用者向けに分けつつ、起動名、アイコン、テーマ色、通常のサービス入口は共通のアプリ契約として扱う。
- **採用と自作**: Manifest、metadata、ホーム画面起動はNext.jsとブラウザー標準機能を採用し、独自のインストールpromptやService Workerは作らない。
- **単純化**: インストール案内は静的ページに両OSの手順を並べ、User-Agent判定、オフラインキャッシュ、認証状態同期を追加しない。

## 設計決定

### 決定1: Next.js標準metadataでstandalone起動を設定する

- **背景**: ホーム画面アイコンからブラウザ操作部分を隠して起動する必要がある。
- **検討した選択肢**:
  1. Next.js App RouterのManifest・metadata規約を使用する。
  2. PWAライブラリまたはService Workerを導入する。
  3. ネイティブshellを追加する。
- **採用する方法**: Next.jsのManifestとicon metadataによりstandalone起動、アプリ名、色、アイコンを提供する。
- **理由**: 今回の要件に必要な起動情報はNext.jsと各OSの標準機能で満たせる。オフライン動作は不要である。
- **トレードオフ**: ホーム画面への追加は利用者の操作に依存する。サイトからiOSの選択を強制できない。
- **後続確認**: iOS SafariとAndroid Chromeの実機で追加・起動を確認する。

### 決定2: インストール案内は静的な公開ページにまとめる

- **背景**: iPhoneとAndroidでホーム画面への追加手順が異なる。
- **検討した選択肢**:
  1. User-Agentで案内を切り替える。
  2. 1つの公開ページに両OSの手順を分けて掲載する。
- **採用する方法**: /install ページにiPhone SafariとAndroid Chromeの手順を常に表示し、ログイン画面とmobile drawerからリンクする。
- **理由**: User-Agent判定を避け、利用者自身が端末に合う手順を選べる。
- **トレードオフ**: デスクトップから開いた場合も両方の手順が表示される。
- **後続確認**: 認証前と認証後のスマートフォン画面から案内へ到達できることを確認する。

### 決定3: 既存ログイン境界を維持する

- **背景**: standalone contextではSafariのログイン状態が共有されない場合がある。
- **検討した選択肢**:
  1. 既存のFirebase Authと未認証routeをそのまま利用する。
  2. ログイン保存方式を変更してSafariとホーム画面間の状態を統合する。
- **採用する方法**: 既存ログインフローと認証保存方針を維持し、PWA内に有効なログイン状態がなければ既存login routeへ進む。
- **理由**: 認証方針を不用意に変更せず、PWA install behaviorだけを追加する。
- **トレードオフ**: 利用者はホーム画面Webアプリ内で初回ログインが必要となる場合がある。
- **後続確認**: インストール後の初回ログインと再起動時の状態を実機確認する。

## リスクと対策

- iOS利用者が「Webアプリとして開く」を有効にしないとSafariの通常表示で開く場合がある — /install の手順で選択を明示する。
- iOSの認証状態はSafariと別である — PWA内で既存ログインフローを利用できることを確認する。
- safe area対応が固定drawerや認証画面に反映されない場合がある — iPhone実機で通常画面・ログイン画面・drawerを確認する。
- OSのアイコンmaskingで既存markが切れる可能性がある — 余白を含む通常アイコンとmaskableアイコンを別々に確認する。

## 参考資料

- [Next.js 15 Manifest metadata file](https://nextjs.org/docs/15/app/api-reference/file-conventions/metadata/manifest)
- [Next.js 15 app icon conventions](https://nextjs.org/docs/15/app/api-reference/file-conventions/metadata/app-icons)
- [Next.js 15 viewport configuration](https://nextjs.org/docs/15/app/api-reference/functions/generate-viewport)
- [WebKit: Home Screen web apps in iOS 16.4](https://webkit.org/blog/13878/)
- [Apple: Add a website to the iPhone Home Screen](https://support.apple.com/guide/iphone/iph42ab2f3a7/27/ios/27)
- [Chrome for Developers: PWA installation on Android](https://developer.chrome.com/blog/whats-new-in-web-on-android-io2023)
- [Google Chrome Help: Use web apps on Android](https://support.google.com/chrome/answer/9658361/use-progressive-web-apps-android?co=GENIE.Platform%3DAndroid&hl=en-GB)
- [Chrome for Developers: Maskable icon guidance](https://developer.chrome.com/docs/lighthouse/pwa/maskable-icon-audit)
- [WebKit: Safe areas and viewport-fit](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- [Apple WWDC: Home Screen web app storage context](https://developer.apple.com/videos/play/wwdc2023/10120/?time=253)
- [Firebase Authentication: Auth state persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence)
