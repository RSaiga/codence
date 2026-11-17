# Python — lint の見本 / Lint examples

繰り返した直しを、lint の設定だけで止めるときの書き方。`cycle.md`「lint にできる候補」が、候補があるときだけ読む。
How to stop a repeated fix with lint configuration alone; read only when `cycle.md` has a lint candidate.

**道具を決める:** `pyproject.toml` の `[tool.ruff]` か `ruff.toml` があれば Ruff。 / Ruff, from `pyproject.toml` or `ruff.toml`.

| ルール | 止めるもの |
|---|---|
| `TID251`（banned-api） | モジュールや関数の import と参照（`"datetime.datetime.now"` のようにパスで） |

```toml
# pyproject.toml — 時刻は app.clock から取る
[tool.ruff.lint]
extend-select = ["TID251"]

[tool.ruff.lint.flake8-tidy-imports.banned-api]
"datetime.datetime.now".msg = "app.clock.now() を使う"
"requests".msg = "httpx を使う"

# 置き換え先そのものは除く / Exempt the replacement itself
[tool.ruff.lint.per-file-ignores]
"app/clock.py" = ["TID251"]
```

- すでに `select` を書いているプロジェクトでは、`extend-select` で足す（`select` を書き直すと、ほかのルールが外れる）。
  Add with `extend-select`; rewriting `select` drops the project's other rules.
