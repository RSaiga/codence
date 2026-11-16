# Java / Kotlin — lint の見本 / Lint examples

繰り返した直しを、lint の設定だけで止めるときの書き方。`cycle.md`「lint にできる候補」が、候補があるときだけ読む。
How to stop a repeated fix with lint configuration alone; read only when `cycle.md` has a lint candidate.

**道具を決める:** `checkstyle.xml`（Checkstyle）。Kotlin なら detekt（`detekt.yml` の `ForbiddenMethodCall`・`ForbiddenImport`）。
Checkstyle for Java; detekt for Kotlin.

| モジュール | 止めるもの |
|---|---|
| `IllegalImport` | パッケージやクラスの import |
| `IllegalType` | 型の使用 |
| `RegexpSinglelineJava` | 1 行の文字の形（呼び出しの形を正規表現で） |

```xml
<!-- checkstyle.xml の TreeWalker の中 — 時刻は Clock を渡して取る -->
<module name="IllegalImport">
  <property name="illegalPkgs" value="org.joda.time"/>
</module>
<module name="RegexpSinglelineJava">
  <property name="format" value="LocalDate\.now\(\)"/>
  <property name="message" value="Clock を受け取り LocalDate.now(clock) を使う"/>
  <property name="ignoreComments" value="true"/>
</module>
```

```yaml
# detekt.yml（Kotlin）
style:
  ForbiddenMethodCall:
    active: true
    methods:
      - value: 'java.time.LocalDate.now'
        reason: 'Clock を渡す'
```

- 置き換え先そのものは、Checkstyle なら `suppressions.xml`、detekt なら `excludes` で除く。 / Exempt the replacement via suppressions or excludes.
- 層をまたぐ依存（パッケージの向き）は ArchUnit のテストで止めるのが普通だが、それはテストのコードなので設定だけでは書けない、と書く。
  Layer boundaries usually need ArchUnit tests, which are code, not configuration.
