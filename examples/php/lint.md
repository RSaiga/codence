# PHP — lint の見本 / Lint examples

繰り返した直しを、lint の設定だけで止めるときの書き方。`cycle.md`「lint にできる候補」が、候補があるときだけ読む。
How to stop a repeated fix with lint configuration alone; read only when `cycle.md` has a lint candidate.

**道具を決める:** `phpcs.xml(.dist)` があれば PHP_CodeSniffer。PHPStan に `spaze/phpstan-disallowed-calls` が入っていれば、その設定でも書ける。
PHP_CodeSniffer, or PHPStan with the disallowed-calls extension if installed.

```xml
<!-- phpcs.xml — 時刻は Clock から取る -->
<rule ref="Generic.PHP.ForbiddenFunctions">
  <properties>
    <property name="forbiddenFunctions" type="array">
      <element key="date" value="null"/>
      <element key="var_dump" value="null"/>
    </property>
  </properties>
  <!-- 置き換え先そのものは除く / Exempt the replacement itself -->
  <exclude-pattern>src/Clock\.php</exclude-pattern>
</rule>
```

- `value` は代わりに使う関数の名前（無ければ `null`）。止められるのは関数の呼び出しだけで、メソッドやクラスは止められない。
  `value` names the replacement; only functions can be banned this way.

```neon
# phpstan.neon（spaze/phpstan-disallowed-calls が入っているとき）
parameters:
  disallowedStaticCalls:
    - method: 'Carbon\Carbon::now()'
      message: 'Clock を使う'
      allowIn:
        - src/Clock.php
```
