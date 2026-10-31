import * as React from "react";

export const InstallGuideContent: React.FC = () => (
  <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
    <header className="mb-8">
      <p className="mb-2 text-sm font-semibold text-brand-strong">
        jongbo | 麻雀記録
      </p>
      <h1 className="text-2xl font-bold text-text-dark sm:text-3xl">
        ホーム画面に追加する方法
      </h1>
      <p className="mt-3 leading-relaxed text-text-muted">
        jongboはブラウザーで使うWebアプリです。ホーム画面に追加すると、アイコンから開けます。
      </p>
    </header>

    <div className="space-y-5">
      <section
        className="rounded-surface border border-border bg-white p-5 shadow-sm sm:p-6"
        aria-labelledby="iphone-install-title"
      >
        <h2
          id="iphone-install-title"
          className="text-xl font-semibold text-foreground"
        >
          iPhone・Safari
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 leading-relaxed text-foreground marker:font-semibold marker:text-brand-strong">
          <li>Safariでjongboを開き、共有ボタンをタップします。</li>
          <li>メニューから「ホーム画面に追加」を選びます。</li>
          <li>
            「Webアプリとして開く」が表示された場合は、有効にしてから「追加」をタップします。
          </li>
          <li>ホーム画面に追加されたjongboのアイコンをタップして開きます。</li>
        </ol>
      </section>

      <section
        className="rounded-surface border border-border bg-white p-5 shadow-sm sm:p-6"
        aria-labelledby="android-install-title"
      >
        <h2
          id="android-install-title"
          className="text-xl font-semibold text-foreground"
        >
          Android・Chrome
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 leading-relaxed text-foreground marker:font-semibold marker:text-brand-strong">
          <li>Chromeでjongboを開き、右上のメニューをタップします。</li>
          <li>
            「アプリをインストール」または「ホーム画面に追加」を選びます。
          </li>
          <li>
            画面の案内に沿って追加し、ホーム画面のjongboアイコンを開きます。
          </li>
        </ol>
        <p className="mt-4 text-sm leading-relaxed text-text-muted">
          Chromeや端末のバージョンによって、メニューの表示名や項目が異なる場合があります。
        </p>
      </section>
    </div>

    <aside className="mt-6 rounded-surface bg-brand-50 p-4 text-sm leading-relaxed text-foreground">
      <h2 className="font-semibold">ログインについて</h2>
      <p className="mt-1">
        jongboはネイティブアプリではありません。iPhoneではホーム画面のWebアプリとSafariとはログイン状態が共有されない場合があります。その場合はホーム画面から開いたjongboでログインしてください。
      </p>
    </aside>
  </div>
);
