# Brief: frontend-pwa-standalone

## Problem

スマートフォン利用者がWebサイトをホーム画面に追加して起動しても、ブラウザのタブやアドレスバーが表示されると、ネイティブアプリのように独立して使える感覚が得られない。麻雀の記録をホーム画面からすぐ開けるようにし、通常のブラウザ表示から区別したい。

## Current State

フロントエンドはNext.js App Routerを使い、`frontend/src/app/layout.tsx` に通常のページmetadataを定義している。Web App Manifest、PWA用アイコン、Apple向けWeb App設定はなく、ホーム画面からstandalone表示で起動する設定はない。既存の `frontend-foundation-ui` は共通AppShellとモバイルnavigationを扱うが、Manifestやホーム画面インストールは対象外。

Firebase Authは `browserSessionPersistence` を使う。iOSのホーム画面WebアプリとSafariの認証状態は共有されないため、インストールしたアプリ内でログインする必要がある。認証保存方式の変更はこの仕様に含めない。

## Desired Outcome

- 対応ブラウザでホーム画面に追加したアイコンから起動すると、ブラウザのアドレスバーを表示せずstandalone表示で開く。
- iPhoneではSafariの「ホーム画面に追加」と「Webアプリとして開く」を利用し、AndroidではChromeのインストールまたはホーム画面追加から起動できる。
- jongboのブランドに合ったホーム画面アイコンとテーマ色を表示し、画面端のsafe areaを考慮する。
- ホーム画面Webアプリでの初回ログインと、既存の認証保存方式に沿った再起動後の認証状態を確認する。

## Approach

Next.js App Routerのmetadata file conventionで `manifest.ts` を追加し、`display: "standalone"`、起動URL、scope、アプリ名、テーマ色、アイコンを定義する。Next.jsのicon/apple-icon規約とApple向けWeb App metadataを使い、viewportのsafe-area対応と既存画面のsafe-area余白を整える。新しいPWAライブラリやService Workerは導入しない。

## Scope

- **In**:
  - Next.js App RouterのWeb App Manifestとstandalone起動設定
  - ホーム画面向けアイコンとApple touch icon
  - 必要なApple Web App metadata、viewport-fit、safe-area対応
  - iPhone Safariでホーム画面追加後にWebアプリとして起動する案内・確認
  - Android Chromeでホーム画面追加またはインストール後にstandalone起動する確認
  - インストール済みWebアプリ内の初回ログインと再起動時の既存認証挙動の確認
- **Out**:
  - Service Worker、オフライン利用、APIデータのキャッシュ
  - Push通知、バックグラウンド同期
  - App Store / Google Play向けネイティブパッケージ
  - Firebaseのログイン保存方式や認証セキュリティ方針の変更
  - 全Androidブラウザでの同一インストール動作の保証

## Boundary Candidates

- Web App Manifest、Next.js metadata、アプリアイコンの配信
- standalone表示時のviewportとsafe-area対応
- iOS SafariおよびAndroid Chromeにおけるホーム画面起動と認証挙動の確認

## Out of Boundary

- ネイティブアプリ相当の端末API、ストア配布、アプリ内課金
- オフライン時の対局記録やデータ同期
- iOSのホーム画面追加操作をサイト側から強制すること
- Safariとホーム画面Webアプリ間でのログイン状態共有

## Upstream / Downstream

- **Upstream**: Next.js 15 App Router、既存の `frontend/src/app/layout.tsx`、デザイントークン、AppShell、Firebase Authの現行セッション保存方針
- **Downstream**: スマートフォンでホーム画面からjongboを起動する利用者。将来オフライン対応やログイン維持を変更する場合は独立した仕様として扱う。

## Existing Spec Touchpoints

- **Extends**: なし
- **Adjacent**: `frontend-foundation-ui` のAppShell、Header、responsive UI。既存の共通UI・認証方式は変更せず、PWA metadataと端末起動設定を追加する。

## Constraints

- iOSはManifestのstandalone起動をサポートするiOS 16.4以降を対象にし、ホーム画面追加時に利用者がWebアプリ起動を選択する必要がある。
- Androidの動作保証対象はChromeとし、他ブラウザのインストール・起動形態は保証しない。
- Webアプリはブラウザエンジン上で動作し、ネイティブアプリにはならない。
- 追加依存パッケージを導入せず、既存のブランド色とNext.jsのファイル規約を利用する。
- Firebase Authは現行の `browserSessionPersistence` を維持し、ホーム画面Webアプリ内での認証挙動を実機確認する。
