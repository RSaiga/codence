# Rust — lint の見本 / Lint examples

繰り返した直しを、lint の設定だけで止めるときの書き方。`cycle.md`「lint にできる候補」が、候補があるときだけ読む。
How to stop a repeated fix with lint configuration alone; read only when `cycle.md` has a lint candidate.

**道具を決める:** clippy。設定は根元（かクレート）の `clippy.toml` / `.clippy.toml`。 / Clippy, configured in `clippy.toml`.

| 設定 | 止めるもの |
|---|---|
| `disallowed-methods` | 関数・メソッドの呼び出し（パスで） |
| `disallowed-types` | 型の使用 |
| `disallowed-macros` | マクロの呼び出し |

```toml
# clippy.toml — 時刻は crate::clock から取る
disallowed-methods = [
  { path = "chrono::Utc::now", reason = "crate::clock::now() を使う" },
]
disallowed-types = [
  { path = "std::collections::HashMap", reason = "順序が要るので IndexMap を使う" },
]
disallowed-macros = [
  { path = "std::println", reason = "tracing を使う" },
]
```

- これらは既定で警告。CI が `-D warnings` で走るなら失敗になる。走らせ方（`tdd.checks` や `tdd.hooks`）が警告で止まるかを確かめて書く。
  These lints warn by default; they fail only where clippy runs with `-D warnings`.
- 置き換え先そのものは、その関数に `#[allow(clippy::disallowed_methods)]` を付けて除く。 / Exempt the replacement with `#[allow(...)]`.
