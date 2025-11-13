# How to manage our development

## Introduction

コードのバージョン管理にはおなじみのGitを使います。
Gitはコマンドがたくさんあって複雑なので、慣れるまでとても大変でたくさん失敗すると思います。ただ、失敗しても元に戻せる仕組みがあるので、恐れず実際に手を動かして覚えていきましょう。

## Useful Websites

- [https://qiita.com/toshi_um/items/72c9d929a600323b2e77](https://qiita.com/toshi_um/items/72c9d929a600323b2e77)
  Gitの用語集。
- [https://www.r-staffing.co.jp/engineer/entry/20190621_1](https://www.r-staffing.co.jp/engineer/entry/20190621_1)
  マンガでGitを理解するみたいなやつ。

## Git commands you should know

1. `git clone`
   既存のリポジトリを自分のローカルにダウンロードするためのコマンド。

   使用例: `$ git clone https://github.com/tatsuyano9/mahjong-record-app.git`

2. `git branch`
   ローカルリポジトリに存在するブランチを確認するコマンド。
3. `git checkout`
   現在いるブランチから別のブランチへ移動するコマンド。`-b`オプションを使うことで現在いるブランチのコピーも可能。

   使用例:
   - `main> $ git checkout branch-a`: `branch-a`に移動。`branch-a`が存在しないと失敗する。
   - `main> $ git checkout -b branch-b`: `branch-b`を新規作成して移動。`branch-b`が存在すると失敗する。

4. `git pull`
   現在いるブランチに、リモートブランチの最新状態を適用するコマンド。
5. `git add <scoped directory or file>`
   自分の変更内容をローカルリポジトリに登録するコマンド。これを行うとgitが管理対象のファイルとして認識する。

   使用例: `git add .` `"."`はカレントディレクトリを意味する。

6. `git commit`
   自分の変更を現在いるブランチに反映するコマンド。`-m`オプションを使うことで変更に対して「コミットメッセージ」と呼ばれる短い文章を追加することができる。なお、**コミットメッセージは必ず追加すること**。

   使用例: `git commit -m "add a button in top page"`

7. `git push` 6.で行った変更をリモートリポジトリに反映させるコマンド。これを実行した後に表示されるリンクを踏むことでPull Request (PR) を作成することができる。以下で何度か言及している`main`の直接変更とは`git push origin main`を実行することを指す。**このコマンドは絶対に実行しないこと**。

   使用例: `git push --set-upstream origin ISSUE-XX-my-development` `--set-upstream`オプションをつけると2回目以降の同じブランチでのpushは`git push`だけでいける。

8. `git reset`
   誤った操作をした際に状態を一個前に戻すコマンド。

   使用例: `git reset --soft HEAD^` `--soft`オプションをつけることで、変更内容は残した上で最新のコミットを取り消せる。

## Environment Setup

[https://github.com/tatsuyano9/mahjong-record-app/wiki/Environment-Setup](https://github.com/tatsuyano9/mahjong-record-app/wiki/Environment-Setup)を参照してください。

## Before development

1. **Issue作成**
   開発に入る前に、[https://github.com/tatsuyano9/mahjong-record-app/issues](https://github.com/tatsuyano9/mahjong-record-app/issues)からIssueを作成し、どのようなタスクに取り組むのかを記述する。他人が見て何をするのかわかるように書く。後にPull Request (PR) を作成する際に紐づけることで、そのタスクで何をやっているのかがわかりやすくなる。
2. **mainブランチの更新**
   コードを変更する前に、`main`ブランチにマージされている他人の変更がないかを確認する。`main`ブランチにいる状態で以下のコマンドを実行し、最新の`main`ブランチを自分のローカルに適用する。

```sh
main> $ git pull
```

3. **自分の開発用ワーキングブランチの作成**
   `main`ブランチは全員の承認を得たコードのみが入っているブランチで、**ここを直接編集することは絶対にNG**。 実装を行う際は以下のコマンドを実行し、`main`ブランチから自分用の開発ブランチを新しく作成する。
   ブランチ名は1.で作成したIssueの番号を利用して`ISSUE-1-your-development`のようにする。

```sh
main> $ git checkout -b ISSUE-XX-your-development
```

4. **開発スタート**

## While Development

自分の開発中に他の人の変更が`main`ブランチにマージされることがあるかもしれない。
そのような場合はrebaseを行って自分の開発ブランチに最新状態を適用する。
これを行うことで、コードのコンフリクトを未然に防ぐことができる。

```sh
ISSUE-XX-your-development> $ git fetch
ISSUE-XX-your-development> $ git rebase origin/main
```

リベースの途中でコンフリクトが起きる場合がある。
その場合は焦らずに1個1個丁寧に解決し、解決し終えたら以下のコマンドを実行する。
どうしても解決できない場合はDiscordの[helpチャンネル](https://discord.com/channels/1430203950233157687/1436319877362352149)に連絡する。

```sh
ISSUE-XX-your-development> $ git add .
ISSUE-XX-your-development> $ git rebase --continue
```

## After development

1. **変更をリモートリポジトリにプッシュ**
   以下のコマンドを順番に実行。

```bash
git add .
git commit -m "your commit message"
git push --set-upstream origin ISSUE-XX-your-development
```

2. **PR作成**
   pushが成功するとpull request (PR) を作成するためのリンクが表示されるので、それにアクセス。
   タイトルにIssueの番号を追加して、PRを作成する。
   また、PRのdescriptionのところに、"resolves #XX"のように書いておくことで、Githubが勝手にIssueを紐づけてくれる。
3. **セルフレビュー**
   PRの変更部分を自分で確認して問題ないかを確認する。
4. **レビュー依頼**
   セルフレビューで問題なさそうであれば、PRのリンクをDiscordの[pull-request-sharingチャンネル](https://discord.com/channels/1430203950233157687/1430207992355229706)に共有し、他のメンバーのレビューを依頼する。
5. **修正**
   レビューで指摘を受けた部分を修正する。自分の実装が正しいと思うのであればその旨を主張する。
   修正後に再度コミットする際は、新しくコミットを作成するのではなく、以下を実行して前回のコミットの中に含めるようにする。

```bash
$ git add .
$ git commit --amend --no-edit
$ git push -f
```

なお、`-f`はforce pushという、本来禁止されているコミット履歴の書き換えを無視して強制pushするオプションです。少し危険なコマンドなので、自分の開発ブランチ以外では使用しないでください。

6. **レビュー依頼と修正**
   3~5を繰り返す。
7. **PRのマージ**
   メンバー全員の承認が得られたら、PRを`main`ブランチにマージする。
   Github上で自分のPRを開けば簡単にマージできる。
8. **マージ完了の連絡**
   PRがマージできたら、マージしたことをpull-request-sharingチャンネルに連絡する。
9. **IssueのClose**
   PRが問題なくマージされたら、対応するIssueをCloseする。
   基本的にPRにIssueが紐づいていれば勝手にCloseされるので気にしなくてOK。

## Cautions

- どんなに小さな変更でも、必ずIssueとPRを作成するようにしましょう。**全員がその変更に同意することが重要です**。
- Issueに関係ない複数の変更をPRに含めず、その都度IssueとPRを作成するようにしましょう。
- 繰り返しですが、**mainの直接変更は厳禁です**。`main`ブランチに入っているコードはメンバー全員の承認を得たコードです。もしやってしまった場合は速やかに野口か富田に報告してください。
