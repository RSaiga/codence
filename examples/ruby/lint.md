# Ruby — lint の見本 / Lint examples

繰り返した直しを、lint の設定だけで止めるときの書き方。`cycle.md`「lint にできる候補」が、候補があるときだけ読む。
How to stop a repeated fix with lint configuration alone; read only when `cycle.md` has a lint candidate.

**道具を決める:** `.rubocop.yml`（RuboCop）。 / RuboCop.

RuboCop には、任意のメソッドの呼び出しを設定だけで禁止する汎用の cop が無い。止める方法は 2 つで、どちらも設定だけでは済まない。
RuboCop has no generic built-in cop to ban an arbitrary method call; both ways below take more than configuration.

- **既存の cop が当てはまるとき:** rubocop-rails の `Rails/TimeZone`（`Time.now` を止める）、`Rails/Date` など。プロジェクトが rubocop-rails を入れていれば、`.rubocop.yml` で有効にするだけで済む。
  If an existing cop fits (rubocop-rails `Rails/TimeZone`, `Rails/Date`), enabling it is enough.
- **当てはまらないとき:** 自作の cop（Ruby のコード）が要る。設定だけでは書けないと書き、作るかどうかはユーザーに任せる。
  Otherwise a custom cop is needed; say so and leave the decision to the user.

```yaml
# .rubocop.yml（rubocop-rails があるとき）— 時刻はタイムゾーン付きで取る
plugins:        # 古い版は require:
  - rubocop-rails
Rails/TimeZone:
  Enabled: true
  EnforcedStyle: strict
```
