# Go — lint の見本 / Lint examples

繰り返した直しを、lint の設定だけで止めるときの書き方。`cycle.md`「lint にできる候補」が、候補があるときだけ読む。
How to stop a repeated fix with lint configuration alone; read only when `cycle.md` has a lint candidate.

**道具を決める:** golangci-lint。設定は `.golangci.yml`。先頭に `version: "2"` があれば v2、無ければ v1（書き方が違う）。
Golangci-lint; `version: "2"` at the top means v2, otherwise v1.

| linter | 止めるもの |
|---|---|
| `forbidigo` | 識別子の形（正規表現）。特定の関数の呼び出し |
| `depguard` | パッケージの import |

```yaml
# .golangci.yml（v2）— 時刻は clock パッケージから取る
version: "2"
linters:
  enable: [forbidigo, depguard]
  settings:
    forbidigo:
      forbid:
        - pattern: '^time\.Now$'
          msg: clock.Now() を使う
    depguard:
      rules:
        main:
          deny:
            - pkg: github.com/pkg/errors
              desc: 標準の errors を使う
  exclusions:
    rules:
      # 置き換え先そのものは除く / Exempt the replacement itself
      - path: internal/clock/
        linters: [forbidigo]
```

- v1 では、設定は `linters-settings:`、パターンの鍵は `p:`、除外は `issues.exclude-rules` に置く。 / In v1: `linters-settings`, `p:`, `issues.exclude-rules`.
