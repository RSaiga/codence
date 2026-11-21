# review — 観点で変更を読む / Review a change through the lenses

`discipline.md` の「観点の約束」のとおり、読むだけで進める。直すことはしない（直すのは refactor の手順の仕事）。
Read-only throughout. Fixing is not part of review.

`config.yaml` の `lenses` が空（`[]`）なら、使う観点が無いと伝えて止まる。 / With no lenses configured, say so and stop.

## 1. 対象を決める / Scope

呼び出しに対象の指定（ブランチ名・コミットの範囲・プルリクエストの URL・ファイルかディレクトリ）があれば、`review-more.md` の「対象の指定」に従う。
With a target given (branch, range, pull request URL, files), follow "対象の指定" in `review-more.md`.

- 指定がなければ、作業中の変更を対象にする。
  設定を読んだ次の往復で、次の 3 つを**まとめて**行う（`router: inert` のときは 3 つ目のコマンドだけを先に実行し、観点のファイルと基準のファイルは
  2 で選んだ観点の分だけ、そのあとでまとめて読む。読んでから飛ばしても節約にならない）:
  - `config.yaml` の観点ごとに `lenses/<観点>.md` を読む。
  - 観点ごとの基準のファイル（`profile.md` の `lenses.<観点>.catalog`）を読む。`catalog_auto_loaded: true` の観点は除く。
    `profile.md` の `examples` が `none` 以外なら、挙げた言語パックごとに、キットの `examples/<言語>/<観点>.md` もあれば読む（直し方の見本。要件ではない）。
    言語パックが複数あるときは、対象のファイルの言語に合うものだけを読む（変更が TypeScript だけなら `typescript` だけ）。
  - 次の 1 つのコマンドを、**このとおりに**実行する（最後の `---` のあとが作業ツリーの指紋。追跡外のファイルも含む）。
    形を変えない。波括弧・`xargs`・リダイレクトを足すと、実行の前に許可を確かめられず止められることがある。
  ```
  git diff --name-only <diff_base>...HEAD; echo ---; git diff --name-only; echo ---; git diff --name-only --cached; echo ---; git ls-files --others --exclude-standard; echo ---; git diff <diff_base>; echo ---; git diff HEAD | git hash-object --stdin; git ls-files --others --exclude-standard | git hash-object --stdin-paths
  ```
  If no target is given, review the working change. In the turn after reading the configuration, read the lens files and their catalogs (unless auto-loaded) and run the one command above verbatim, all together; braces, `xargs` or redirects can make it uncheckable and blocked.
- `profile.md` の `code` に当てはまるファイルだけを残す。追跡外の新しいファイルも対象（中身は差分ではなくファイルとして読む）。
- **変更した行を中心に見る。** 周りの文脈は読んでよいが、変更と関係のない既存のコードは指摘しない。 / Focus on changed lines; never flag untouched code.
- 対象が 0 件なら、そう報告して `## LENS CLEAN` で終える。
- 呼び出しに `--second` があれば、`second-opinion.md` の「review で」に従い、別の AI にも同じ対象を読ませて突き合わせる。
  With `--second`, also follow `second-opinion.md` (review).

## 2. 観点を選ぶ / Route

`config.yaml` の `router` が `inert` のときだけ、`review-more.md` の「観点を選ぶ」に従う（既定の `none` では、すべての観点を実行する）。
With `router: inert`, follow "観点を選ぶ" in `review-more.md`; otherwise run every lens.

## 3. 観点を実行する / Run the lenses

`config.yaml` の `runner` に従う。観点が読んでいるあいだ、誰も書かない。 / Nobody writes while lenses read.

- **`inline`**（既定）: `lenses` の順に、`lenses/<観点>.md` を読んで同じ文脈で実行する。
- **`subagent`・`command`**: `review-more.md` の「別の文脈で動かす」に従う。
- **終わったら、指紋をもう一度とる。** 1 のコマンドの最後の 2 つ（`git diff HEAD | git hash-object --stdin; git ls-files --others --exclude-standard | git hash-object --stdin-paths`）だけを、このとおりに実行して比べる。変わっていたら、結果を捨てて「読んでいるあいだに作業ツリーが変わった」と報告し、`## LENS STOPPED` で終える。
Run per `runner`: `inline` in this context; otherwise follow "別の文脈で動かす" in `review-more.md`.
Re-take the snapshot afterwards; if it changed, discard.

`lenses` に `acceptance` があれば、`review-more.md` の「acceptance」に従う。 / For `acceptance`, follow `review-more.md`.

## 4. まとめる / Summarize

観点の指摘のあとに、次を書く:

- 観点ごと、優先度ごとの件数と、観点ごとの最後の行
- 「挙動を変えずに直せるもの」と「設計の判断が要るもの」の区別
- security・concurrency・isolation・alerting の確信度「高」は正しさの問題として、**落ちるテストを書くところから**（`tdd-red`）直すことを勧める。「中」「低」は報告だけ。
  直すのはこの手順の仕事ではない（読むだけ）。 / High security/concurrency findings are correctness bugs: recommend starting from a failing test.
- 指摘が 0 件なら「構造的な指摘なし」のように**はっきり書く**。無理に絞り出さない。
  Say plainly when there is nothing to report; don't squeeze out findings.

最後の行は、実行した観点を合わせて 1 つ（飛ばした観点は、その前の行に「飛ばした: …」と書く）: どれかが `STOPPED` なら `## LENS STOPPED`、指摘があれば `## LENS FINDINGS <合計>`、
`UNVERIFIED` だけなら `## LENS UNVERIFIED <合計>`、それ以外は `## LENS CLEAN`。
The last line: STOPPED if any lens stopped, else FINDINGS <total>, else UNVERIFIED <total>, else CLEAN.
