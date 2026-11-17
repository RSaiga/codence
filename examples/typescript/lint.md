# TypeScript / JavaScript — lint の見本 / Lint examples

繰り返した直しを、lint の設定だけで止めるときの書き方。`cycle.md`「lint にできる候補」が、候補があるときだけ読む。
How to stop a repeated fix with lint configuration alone; read only when `cycle.md` has a lint candidate.

**道具を決める:** 根元に `eslint.config.*`（flat config）があれば ESLint、`.eslintrc*` なら旧形式の ESLint、`biome.json(c)` なら Biome。
版で書き方が違う。lockfile の版を見て、書き方に自信が無ければそう書く。 / Check the installed version; say so when unsure.

## ESLint — 設定だけで書ける禁止 / Built-in bans

| ルール | 止めるもの |
|---|---|
| `no-restricted-syntax` | 構文の形（AST のセレクタ）。特定の呼び出し・`new`・書き方 |
| `no-restricted-imports` | モジュールの import（名前・パターン） |
| `no-restricted-properties` | `object.property` の参照（`process.env` など） |
| `no-restricted-globals` | グローバルの名前 |

```js
// eslint.config.js — 時刻は src/clock.ts の today() から取る
export default [
  {
    rules: {
      'no-restricted-syntax': ['error', {
        selector: "NewExpression[callee.name='Date']",
        message: '今日の日付は src/clock.ts の today() から取る',
      }],
      'no-restricted-imports': ['error', {
        paths: [{ name: 'moment', message: 'date-fns を使う' }],
        patterns: [{ group: ['**/server/**'], message: '画面から server のコードを import しない' }],
      }],
    },
  },
  // 置き換え先そのものは除く / Exempt the replacement itself
  { files: ['src/clock.ts'], rules: { 'no-restricted-syntax': 'off' } },
]
```

- 同じルールを後ろの設定で書くと、前の選択肢は**置き換わる**（足されない）。プロジェクトにすでに `no-restricted-syntax` があれば、その配列に足す形で書く。
  A later entry for the same rule replaces its options; append to an existing list instead.

## Biome

```json
{ "linter": { "rules": { "style": {
  "noRestrictedImports": { "level": "error", "options": { "paths": { "moment": "date-fns を使う" } } },
  "noRestrictedGlobals": { "level": "error", "options": { "deniedGlobals": { "$": "DOM の API を使う" } } }
} } } }
```
Biome は任意の構文の形を禁止できない。呼び出しの形を止めたいなら、設定だけでは書けないと書く。 / Biome cannot ban arbitrary syntax.
