# route — 依頼を入口に振り分ける / Route a request to an entry

`go` の入口が、`discipline.md` のあとに読む。依頼を言い直し、依頼と今の状態から既存の入口を 1 つ選び、その手順を todo に写してから実行する。
この手順は規律を足さない。選んだ入口の手順と規律を、そのまま使う。
Restate the request, pick one existing entry from the request and the state, copy its steps to a todo, then run it. Adds no rules of its own.

## 1. 状態を見る / Look at the state

最初の往復で、プロジェクトの現在のディレクトリで次をまとめて実行する（`discipline.md` の「まとめて行う」）:
`git rev-parse --show-toplevel; git branch --show-current; git status --short; ls .codence/lists; cat .codence/profile.md .codence/config.yaml`

`discipline.md` の「動く条件」のうち、`profile.md` か `config.yaml` が無いときだけは止まらず、3 で `init` に振り分ける。ほかの条件は、そのとおり止まる。
A missing profile or config routes to `init` instead of stopping; every other activation condition still stops.

## 2. 言い直す / Restate

最初の報告の先頭に、次の 3 行を `profile.md` の `language` で書く。確認は待たない（違っていれば、ユーザーが止める）。
- 目的: 誰が何をできるようになるか、または何を知りたいか
- 問題: いま何が足りないか、何がおかしいか
- 期待する変化: 終わったとき、何が観察できれば完了か

依頼から読めない行は「不明」と書き、推測で埋めない。目的と期待する変化がどちらも不明なら、聞いて止まる。
Write goal, problem and expected change before anything else; never wait for confirmation. Unknown is written as unknown, never guessed; if both goal and expected change are unknown, ask and stop.

## 3. 振り分ける / Route

上から順に見て、最初に当たった行の入口を選ぶ。リストは `.codence/lists/<ブランチ>.md`（ブランチ名の `/` は `-`）。

| 条件 | 入口 |
|---|---|
| `profile.md` か `config.yaml` が無い | `init`（依頼は設定のあとに持ち越すと伝える） |
| 振り返り・記録の依頼（何が起きたかを残す、対策が効いたか確かめる） | `retro` |
| レビューの依頼（作業中の差分・ブランチ・コミットの範囲・PR の URL・ファイルを見てほしい） | `review` |
| 振る舞いを変えない整理の依頼（リファクタ、重複を減らす、名前や置き場所を直す） | `refactor` |
| TDD の段階を 1 つだけ名指しする依頼（落ちるテストを 1 本だけ書く、コミットする など） | その段階の入口（`tdd-red`・`tdd-green`・`tdd-refactor`・`tdd-accept`・`tdd-commit`） |
| このブランチのリストがあり、依頼がその続き（続けて、リストの項目を指す、新しい振る舞いを言わない） | `tdd-cycle` |
| 振る舞いを足す・変える・直す依頼（リストが無い、またはリストに無い振る舞い） | `tdd-plan`（今あるリストの扱いは `plan.md` の 1 が聞く） |

- 2 つの行に当たりそうで、どちらを選ぶかで手順が大きく変わるときは、候補 2 つと違いを 1 行ずつ示して聞き、止まる。
- 2 の 3 行のあとに `入口: <入口> — <当たった条件>` の 1 行を書く。
First matching row wins. If two rows fit and the procedures differ a lot, show both in one line each, ask, and stop. Then write `Entry: <entry> — <the row that matched>`.

## 4. todo に写す / Copy the steps to a todo

選んだ入口が実行する手順の見出し（`plan.md` なら 1〜7、`cycle.md` なら「始める前」から「報告」まで）を、todo の道具に 1 行ずつ写す
（作業の一覧を持つ道具。無ければ報告の箇条書き）。

- 写すのは見出しの粒度まで。手順の中の細かい項目は写さない。
- 今回は要らない手順も消さず、`skip: <理由>` と書く（例: `skip: 単層のリストで外側が無い`）。理由の無い skip はしない。
- 全部の行を 1 回の往復で作る。手順を終えたら、その行を更新する。
- **todo の操作だけのために往復しない。** 作成も更新も、次の作業（読む・書く・走らせる）の呼び出しと同じ往復で送る。往復のたびに文脈を読み直すので、todo だけの往復は費用になる。
Copy the entry's step headings, not their contents, all in one turn. A step that does not apply stays, marked `skip: <reason>`; never skip without a reason.
Update a line when its step ends — never in a turn of its own: send todo calls alongside the next real call.

## 5. 実行する / Run

選んだ入口が読むものを、下の表から**1 回の往復でまとめて**読む（`discipline.md` と 1 の設定は読み直さない）。そのあと、その入口が呼ばれたときと同じに
最後の列の手順を実行する。依頼の文は、その入口に続く文字列として扱う（`--second` があれば `procedures/second-opinion.md` も読む）。
表に無い入口（TDD の段階を 1 つだけ）は、`skills/<入口>/SKILL.md` を読んで従う。
Read everything the chosen entry reads, from the table, in one turn, then run its procedure as if it had been invoked with the request as its argument.
An entry not in the table (a single TDD stage): read `skills/<entry>/SKILL.md` and follow it.

| 入口 | 読む手順 | あわせて読むもの | 実行する手順 |
|---|---|---|---|
| `tdd-plan` | `procedures/tdd.md`、`procedures/plan.md` | リスト（無くてよい）、`tdd.rules` の規約 | `procedures/plan.md` |
| `tdd-cycle` | `procedures/tdd.md`、`procedures/cycle.md`、`procedures/accept.md`、`procedures/red.md`、`procedures/green.md`、`procedures/refactor.md`、`procedures/commit.md`、`lenses/structure.md` | リスト、`tdd.rules` の規約、`lenses.structure.catalog` | `procedures/cycle.md` |
| `review` | `procedures/review.md`（対象の指定があれば `procedures/review-more.md` も） | なし | `procedures/review.md` |
| `refactor` | `procedures/review.md`、`procedures/review-more.md`、`procedures/refactor-only.md`、`procedures/refactor.md`、`procedures/commit.md`、`lenses/structure.md` | `lenses.structure.catalog`、`tdd.rules` の規約 | `procedures/refactor-only.md` |
| `retro` | `procedures/retro.md` | なし | `procedures/retro.md` |
| `init` | `procedures/init.md` | なし | `procedures/init.md` |

**`tdd-plan` を選んだときの続き:** リストが承認されて書かれたら、止まらずに `tdd-cycle` に進む（この入口では、計画の承認が実行の合図を兼ねる）。
承認の返事か依頼が「書くだけ」「書いたら止まって」と言うときは進まない。承認の無いまま書かない（`plan.md` の 5）。
After `tdd-plan`, once the list is approved and written, go on to `tdd-cycle`: here the plan's approval is also the go-ahead. Stop instead if the approval or the request says to stop after writing.

**しないこと / Never:** 選んだ入口の手順を省く・書き換えること、入口を 2 つ以上並べて回すこと（上の `tdd-plan` の続きは例外）、
依頼に無い作業を足すこと、言い直しで推測を事実として書くこと。
