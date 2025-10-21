# How to Execute Linter on your local

## 自動保存で linter による自動整形をトリガする方法
1. プロジェクトのルートディレクトリに `.vscode/settings.json` を作成。内容は以下の通り。
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "files.eol": "\n",
  "prettier.requireConfig": true,
  "prettier.tabWidth": 2,
  "editor.defaultFormatter": "rvest.vs-code-prettier-eslint",
  "editor.tabSize": 2
}
```
2. 以下の VScode 拡張機能をインストール。
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
  - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
  - [Prettier-ESLint](https://marketplace.visualstudio.com/items?itemName=rvest.vs-code-prettier-eslint)
3. `npm i` か `npm ci` を実行。多分前者で十分。
4. VScode を再起動。
5. 改行をいっぱい入れたり、適当なコンポーネントの import order をいじってみて、保存する。ファイルが正しく整形されたら成功。
