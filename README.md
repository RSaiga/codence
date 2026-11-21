# codence

> **名前の由来:** codence は、code と dance、それに cadence（一定のリズム、歩調）を重ねた造語。
> AI と一緒にコードを書くことを、plan → red → green → refactor という決まった歩調で、踊るように刻み続ける。
> **The name:** codence blends *code*, *dance*, and *cadence* (a steady rhythm) — writing code with an AI as a dance
> kept to a steady step: plan, red, green, refactor.

AI コーディングエージェントに開発の規律を守らせるキット。Claude Code と Codex のプラグインとして動く。
AI に任せると、実装を先に書いてから通るテストを後で足したり、テストのコマンドを推測で走らせたりしやすい。codence は、手順を固定し、変更を観点ごとに読み直させることで、それを防ぐ。

A kit that keeps AI coding agents to a development discipline, as a plugin for Claude Code and Codex.
Left alone, an agent tends to write code before tests and to guess at project conventions; codence holds it to procedures and lenses.

中心は **観点チェック（lenses）**。決まった観点で変更を読み、見つけた問題に名前（code smell の名前など）を付けて指摘し、次の一手を添えて返す。
TDD などの **進め方（flows）** は、その上に乗る。
At its core are **lenses**: read a change from a fixed perspective and return named findings with a next move. **Flows** such as TDD build on them.

- どのプロジェクトの事実（テストのコマンド、置き場所、規約）も推測しない。プロジェクトに置いた `profile.md` から読み、足りなければ止まる。
  Never guesses project facts; reads them from the project's `profile.md` and stops when something is missing.
- どの入口も自動では起動しない。明示的に呼んだときだけ動く。
  No entry starts on its own; each runs only when invoked.
- キット自身の変更は、bench（費用と結果を測る仕組み）で確かめてから採用する。採用するのは、結果を落とさずに、費用が下がるか、同じ費用でより単純になる変更だけ（`bench/criteria.md`）。
  Changes to the kit are adopted only when the bench shows results no worse and a lower cost, or the same cost with something simpler.

すぐ試すなら、「入れる」の 2 行と `init` だけでよい。続けて「プロジェクトで使う」の 1〜3 を読めば動かせる。それ以外は、設定を変えるときや、キットに手を入れるときに読めばよい。
To get started, read "Install" and steps 1–3 of "Use it in a project"; the rest is for changing settings or working on the kit.

## できること / What it does today

呼び出す単位を **入口** と呼ぶ。Claude Code では `/codence:<入口>`、Codex では `$codence:<入口>` で呼ぶ。
Each entry is invoked as `/codence:<entry>` in Claude Code and `$codence:<entry>` in Codex.

TDD の進め方は 2 つある。受け入れテストを使わず内側のテストだけで回す **単層** と、受け入れテストを外側に置き、その内側でテストを回す **二重ループ** だ。
どちらも `tdd-cycle` で最後まで通して回せるし、段階ごとの入口で 1 つずつ進めることもできる。
TDD runs as a **single layer** (inner tests only) or a **double loop** (acceptance tests outside, inner tests inside), end to end with `tdd-cycle` or stage by stage.

| 入口 / Entry | すること / What it does |
|---|---|
| `go` | どの依頼もここから。依頼を目的・問題・期待する変化の 3 行に言い直し、依頼とプロジェクトの状態から下の入口を 1 つ選び、その手順を todo に写して実行する。計画が承認されたら、そのまま cycle に進む / One entry for any request: restates it, picks one of the entries below from the request and the project's state, copies its steps to a todo and runs it; after an approved plan, goes on into the cycle |
| `init` | プロジェクトを読んで `.codence/` の設定を下書きし、了承を得てから書く / Drafts the project settings and writes them after you agree |
| `review` | 観点で読む（structure・security・concurrency・isolation・alerting・logging・acceptance）。対象は作業中の変更、ブランチか範囲、プルリクエストの URL、ファイルかディレクトリ。読むだけ / Reviews through the lenses: the working change, a branch or range, a pull request URL, or files and directories. Read-only |
| `refactor` | TDD の外で構造だけを直す。structure の観点で匂いを挙げ、既存のテストが守っている場所だけを 1 つずつ直す / Restructures outside TDD: finds smells with the structure lens and fixes, one at a time, only what existing tests guard |
| `tdd-plan` | これから入れる変更のテストのリストを作る（モード、シナリオ、内側の項目、影響を受ける既存のテスト）。大きな依頼は先にストーリーに分ける。承認のあとで書く / Plans the test list, splitting large requests into stories first; writes after approval |
| `tdd-cycle` | テストのリストが尽きるまで回す。単層なら red → green → コミット → refactor、二重ループならシナリオごとに外側と内側を回す。同じ形の直しを 2 回したら、プロジェクトの言語と lint の道具に合わせた lint のルールの案を報告する（設定は書き換えない）。終わりに、変えた名前が残る文書（README など）の古い事実を直し、ブランチの変更の全体を新しい文脈ですべての観点で読み直して、指摘を確信度に関わらず直すか理由を書いて退ける（直すものが無くなるまで、3 周まで）/ Runs the TDD loop until the list is done, single layer or double loop; when the same fix was made twice, proposes a lint rule for the project's linter without changing it; finally fixes stale facts in docs, then reads the whole branch with every lens in a fresh context and fixes or dismisses every finding, up to three rounds |
| `tdd-accept` | 二重ループの外側の 1 手。受け入れシナリオを書き、まだ無い振る舞いのせいで落ちることを確かめる。または、走らせて緑なら閉じる / One outer-loop step: write the acceptance scenario and watch it fail, or run it and close it when green |
| `tdd-red` `tdd-green` `tdd-refactor` `tdd-commit` | TDD の 1 段階だけを行う / Runs one TDD stage |
| `retro` | 意図・結果・止まった箇所（と対策）を `findings.md` に残す。`track` で対策が効いたかを判定する / Records a retrospective; with `track`, judges whether countermeasures worked |

**観点 / Lenses**

| 観点 / Lens | 見るもの / What it checks |
|---|---|
| structure | code smell。汎用の 6 つ（重複・Feature Envy など）を常に疑い、プロジェクトのリファクタリングのカタログがあれば、それを先に疑う（同じ匂いならカタログの名前と定義が勝つ） / code smells: six generic ones always, plus the project's catalog first when it has one |
| security | 認可・テナント分離・入力の境界・内部の漏れ・秘密・注入・外からの呼び出しの検証（SEC-1〜7）/ authorization, tenancy, input bounds, leaks, secrets, injection, webhook checks |
| concurrency | 確かめてから書き込むまでの間に別の処理が割り込む競合、冪等性、トランザクション、複数インスタンス、共有の状態など（CON-1〜8）/ races, idempotency, transactions, shared state |
| isolation | データが混ざらないか。本番では、テナントの絞り込み、テナントをまたぐ集計、キャッシュとセッションのキー、非同期の処理への引き継ぎ、別のテナントのデータの存在の漏れを見る。テストでは、テスト同士がデータ・共有の状態・並列実行の資源を取り合わないかを見る（ISO-1〜8）/ tenant isolation and test isolation |
| alerting | 提供者が失敗をユーザーからの連絡で初めて知る箇所（DORA の proactive failure notification）。握りつぶし、報告の口を通らないエラーの応答、ログだけで終わるジョブ、黙った劣化、画面側の失敗、予期しない失敗を予期したものとして扱うこと、決済・契約などの失敗が運営に誰の・どの操作かつきで届かないこと（ALR-1〜7）。入力の誤りのような予期した失敗と、再試行で回復した失敗は知らせない側として扱う / failures the provider would first hear of from users, or never |
| logging | 障害のときにログから原因までたどれない箇所と、ログが穴になる箇所。元の例外を捨てる、誰の・どの操作かが無い、秘密や個人情報を出す、外からの値で行を偽装できる（LOG-1〜4）。お金の操作や外部のサービスの失敗などにログが無ければ、足せとは言わず「残すか。残さないなら理由」を聞き、答えをプロジェクトのログの一覧に残す（LOG-5）。監査の記録は見ない / where logs could not lead from a failure to its cause, or leak or can be forged; missing event logs become questions |
| acceptance | 緑になったシナリオの約束を、実装が本当に守っているか。書いた本人の結論を知らない別の担当が読む / whether the implementation keeps a green scenario's promise, judged in a fresh context |

既定で動くのは structure だけ。ほかの観点は `config.yaml` の `lenses` で足す。
`tdd-accept` は、シナリオを閉じる前に acceptance の観点をかけ、約束が守られていなければ、足りない分を内側のテストの項目としてリストに戻す。
security と concurrency の指摘のうち確信度が「高」のものには、実際に壊れる入力か、壊れる実行の順番（処理の割り込み方）を必ず添える。alerting の「高」には、失敗からユーザーに見えるもの、提供者に届くものまでの順番を添える。
Only structure is on by default; add others under `lenses` in `config.yaml`. The acceptance lens runs before a scenario closes. High-confidence security/concurrency findings always come with a breaking input or interleaving.

## 入れる / Install

**Claude Code**
```
claude plugin marketplace add RSaiga/codence
claude plugin install codence@codence
```
最初に呼ぶもの / First call: `/codence:init`

**Codex**
```
codex plugin marketplace add RSaiga/codence
codex plugin add codence@codence
```
最初に呼ぶもの / First call: `$codence:init`（名前空間が要る / the namespace is required）

`review` は読むだけの git のコマンド（`git diff`・`git ls-files`・`git hash-object`）を使う。許可しておくと、確認で止まらない。
`review` runs read-only git commands (`git diff`, `git ls-files`, `git hash-object`); allow them to avoid permission prompts.

**更新 / Update**

| ツール / Tool | コマンド / Commands |
|---|---|
| Claude Code | `claude plugin marketplace update codence` → `claude plugin update codence@codence` → セッションで `/reload-plugins` / run `/reload-plugins` in the session |
| Codex | `codex plugin marketplace upgrade codence` |

Claude Code では自動更新をオンにできる（このマーケットプレイスは最初はオフ）。`/plugin` の Marketplaces で `codence` を選び、Enable auto-update を選ぶ。
最初の発言のあと 10 分以内に新しい版を取ってくるので、知らせが出たら `/reload-plugins` で使える（打たなければ次の起動から）。
In Claude Code, turn on auto-update once: `/plugin` → Marketplaces → `codence` → Enable auto-update (off by default for this marketplace).
It fetches within ten minutes after your first message; run `/reload-plugins` when notified, or the new version loads on the next launch.

0.3.0 で `agent-discipline` から名前を変えた。古い名前で入れているなら、外して入れ直し、プロジェクトの `.agent-discipline/` の名前を `.codence/` に変える（`.git/info/exclude` の行も）。
Renamed from `agent-discipline` in 0.3.0: uninstall and reinstall, and rename each project's `.agent-discipline/` to `.codence/` (and its line in `.git/info/exclude`).

## プロジェクトで使う / Use it in a project

1. プロジェクトで `init` を呼ぶ。下書きを見て、足りない項目を埋めてから了承する。
   Invoke `init` in the project, review the draft, fill what is missing, and agree.
2. 個人で使うなら、`.git/info/exclude` に `/.codence/` を足す。チームで共有するなら、コミットする。そのときは、ブランチごとのテストのリストが入らないよう、`.git/info/exclude` に `/.codence/lists/` を足す。
   For personal use, add `/.codence/` to `.git/info/exclude`; to share with the team, commit it and exclude `/.codence/lists/`.
3. `review` や `tdd-cycle` を呼ぶ。設定が無いプロジェクトでは、`init` 以外の入口は何もせず、`init` を案内して止まる。
   Invoke `review` or `tdd-cycle`. Without settings, an entry points to `init` and stops.

プロジェクトに置くもの / What lives in the project:

```
<project>/.codence/
├── profile.md      # このプロジェクトの事実: 言語、差分の基準、観点が使うカタログ（リファクタリングのカタログなど）、テストのスイート・置き場所・既知の失敗など
│                   # project facts: language, diff base, lens catalogs, test suites, test locations, known failures
├── config.yaml     # キットの動かし方: runner、使う観点（既定は structure だけ）、コミットの方針と言語
│                   # how the kit runs: runner, lenses, commit policy and language
├── lists/          # TDD のテストのリスト（ブランチごと）。キットはコミットしない（チームで共有するときは手順 2 で除外する）/ per-branch TDD test lists, never committed by the kit
├── decisions/      # on_doubt: log のとき、tdd-cycle が決めた・保留したことの記録（ブランチごと）/ what tdd-cycle decided or parked, with on_doubt: log
├── backlog.md      # backlog: file のとき、tdd-plan が分けたストーリー / stories tdd-plan split out, with backlog: file
└── findings.md     # retro の記録 / retro's log
```

`config.yaml` では、ほかに次を選べる。
- `router`: `none`（既定）か `inert`。`inert` にすると、コメントだけ・テストの追加だけ・名前の変更だけの差分では security と concurrency を飛ばす。
- `backlog`: `none`（既定）か `file`。`file` にすると、`tdd-plan` が分けたストーリーを `backlog.md` に書く。
- `lints`: 入れたキットの lint。今あるのは `comments`（コメントを足さない）。`init` が案を出し、了承されると `.codence/lints/` に規則を置いて、green の確かめで走らせる。見るのは新しく足した行だけで、今あるコメントには触らない。説明用のコメント・道具への指示（lint の抑止、カバレッジの除外、型やビルドの指示）・ライセンス・Given / When / Then は残し、自動生成のファイルは見ない。道具は ast-grep（入っていなければ `npx` で入れずに走らせる）。対応は TypeScript・TSX・JavaScript・Rust・Go・Python・PHP。
- `on_doubt`: `stop`（既定）か `log`。`log` にすると、`tdd-cycle` は人が見ていなくても迷いで止まらない。戻せない操作・自分のものでないプロセス・始められないときだけ止まり、ほかは戻せる方を選んで進むか、その項目を保留して（途中の変更は stash に退避）次へ進み、`decisions/<ブランチ>.md` に記録する。依頼に「朝まで止まらずに回して」のように書けば、その回だけ `log` になる。

`config.yaml` also sets `router` (`none` or `inert`, which skips security/concurrency on comment-only, new-test-only or rename-only changes) `backlog` (`none` or `file`), `lints` (kit lints: `comments` blocks newly added comments, run from the green checks via ast-grep), and `on_doubt` (`stop` or `log`: with `log`, `tdd-cycle` stops only for irreversible or foreign things, otherwise decides the reversible way or parks the item and moves on, logging each in `decisions/<branch>.md`; a request saying so switches one run).

項目の意味は `templates/` の雛形と、`procedures/discipline.md`・`procedures/tdd.md` の表にある。
The keys are described by the templates in `templates/` and the tables in `procedures/discipline.md` and `procedures/tdd.md`.

**規律の優先順位 / Precedence:** その場のユーザーの指示 → `config.yaml` → プロジェクトのルール → キットの規律（左ほど優先）。
The user's instruction in the moment, then `config.yaml`, then the project's rules, then the kit (leftmost wins).

### 使う AI / Which AI runs

ふつうは既定のままでよい。この節は、観点ごとに変更を読む AI を変えたいときに読む。
The defaults are fine for most projects; read this only to change who reads the lenses.

**手順を進める AI は、キットを呼んだツールのもの。** キットの設定では選ばない。Claude Code なら `/model` で、Codex なら Codex のモデルの設定で変える。
The AI that runs the procedure is the one in the tool you invoked from; change it there, not in the kit.

**観点ごとに変更を読む AI は、`config.yaml` の `runner` で選ぶ。**
The lenses run according to `runner` in `config.yaml`.

| `runner` | 変更を読むもの / Who reads | 設定の例 / Example |
|---|---|---|
| `inline`（既定 / default） | 同じ AI が、同じ文脈で順に / the same AI, in the same context | `runner: inline` |
| `subagent` | 同じツールの別の担当が、それまでのやり取りを持たずに。`runner_model` でモデルを選べる（無ければ同じ） / a fresh-context agent of the same tool; `runner_model` picks its model | `runner: subagent`<br>`runner_mode: parallel` |
| `command` | 外のコマンド（別のツールの CLI）。プロンプトは標準入力で渡す / another CLI, prompt on stdin | `runner: command`<br>`runner_command: ["codex", "exec", "--ephemeral", "--sandbox", "read-only", "-C", "{root}"]` |

`runner_mode` は `parallel`（観点ごとに同時に。既定）か `combined`（1 つの担当にまとめて）。
`acceptance` だけは `runner` に関わらず、毎回それまでのやり取りを持たない担当が読む（書いた本人の結論を持ち込まないため）。
`runner_mode` is `parallel` (default) or `combined`. `acceptance` always runs in a fresh context, whatever `runner` says.

**おすすめは `inline`。** security と concurrency の差分で測った結果。`inline`・`subagent combined`・`subagent parallel` は、問題の無い差分を含む 7 差分 × 3 の 21 回ずつ。`command` は別の 9 課題 × 3 の 27 回で、同じ条件の `inline` の見逃しは 0 だった。
**`inline` is recommended.** Bench results on security and concurrency diffs (21 runs per form over 7 diffs, clean ones included; `command` on 27 runs, where `inline` also missed 0 of 27):

| 形 / Form | 欠陥の見逃し / Misses | 1 回の費用 / Cost per run |
|---|---|---|
| `inline` | 0 | $0.35 |
| `subagent` `combined` | 0 | $0.51 |
| `subagent` `parallel` | 0 | $0.70 |
| `command`（観点を Codex で / lenses on Codex, 27 runs） | 1 / 27 | $0.59 + Codex |

`inline` と `subagent` の 2 つの形は見逃しが同じなので、いちばん安い `inline` を既定にした。`command` は見逃しが 1 件あり、費用も高いので既定にしない。
`runner_model` で担当に小さいモデルを選ぶ形は測っていない。どの形でも呼び出し元の AI は差分をすべて読むので、担当の費用はそこに上乗せされ、`inline` より安くはならない見込みだからだ。
`command` で別のサービスの AI を使うと、差分がそのサービスに送られる。
`inline` and `subagent` missed nothing, so the cheapest is the default; `command` missed one and costs more. A smaller `runner_model` was not measured: the caller still reads every diff, so the agent's cost would add to it rather than replace it.
With `command`, the diff is sent to that service.

### セカンドオピニオン / A second opinion

`review` と `tdd-plan` に `--second` を付けると、別の AI（2 人目）にも読ませる。
Add `--second` to `review` or `tdd-plan` to have another AI read it too.

```
/codence:review develop...HEAD --second
/codence:tdd-plan <依頼 / request> --second
```

```yaml
# config.yaml
second_opinion_commands:
  - ["codex", "exec", "--ephemeral", "--sandbox", "read-only", "-C", "{root}"]
  - ["claude", "-p", "--permission-mode", "plan"]
```

2 人目は、`second_opinion_commands` の候補を上から順に見て、**いまキットを呼んだツールと同じプログラムを飛ばして**選ぶ。
そのため同じ設定のままでも、Claude Code から呼べば Codex が、Codex から呼べば Claude Code が 2 人目になる。
The first candidate whose program is not the running tool is used, so one shared config works from either tool.

`review` では、2 人目に 1 人目の結論を渡さず、同時に読ませる。2 人の指摘のうち同じものを組にし、それぞれに `［両方］`・`［1 人目だけ］`・`［2 人目だけ・確かめられた／確かめられない］` の印を付ける。どの指摘も消さない。
`tdd-plan` では、下書きができてから、2 人目が抜けと誤りを探す。1 人目が指摘ごとに採用か不採用かを答え、いつもどおり承認を待つ。
`review`: the second reads in parallel without the first's findings; findings are paired and tagged, never dropped.
`tdd-plan`: after the draft, the second looks for gaps; the first answers each point, then waits for approval as usual.

- 2 人目が止まっても（起動できない、10 分で終わらない）、1 人目の結果は使い、止まったことを報告に書く。
  If the second stops, the first's result stands and the stop is reported.
- 差分は 2 人目のサービスに送られる。
  The diff is sent to the second's service.
- 実行環境のサンドボックスが外のコマンドを止めるときは、ツールのふつうのやり方で許可を求める（対話なしの実行では起動できない）。
  If a sandbox blocks the command, the tool asks for permission; non-interactive runs cannot start it.

## 進み具合を見る（Claude Code、試験的）/ Watching progress (Claude Code, experimental)

Claude Code では、プラグインを入れると、今のブランチのテストのリスト（`.codence/lists/<ブランチ>.md`）の進み具合が画面に出る。設定は要らない。リストの無いブランチでは何も出ない。

- **プロンプトの上の帯:** 「codence ▰▰▰▰▰▰▰▱▱▱ 15/19 79% · ▶ 作業中の項目 · 保留 1」。済んだぶんは緑、作業中は黄、保留は赤。
- **パネル:** 端末の幅が広ければ会話の横に自動で開く。狭いときや閉じたあとは `/codence-progress` で開く。全体とシナリオ・見出しごとのバー、作業中の項目とその出典、直前に済んだ項目、保留と判断の記録の件数、直近の操作 8 件、コミットしていない変更、直近のコミット 3 件。
- **通知:** 項目が済むたびと、リストが全部済んだとき。

リストを数秒おきと、ファイルを書き換えた直後に読み直す。手順は何も変えず、リストを読むだけ。Claude Code の試験的な仕組み（プラグインの hooks のモジュール）で作っているので、Claude Code の版によっては表示が出なくなることがある。そのときも codence の手順には影響しない。Codex では出ない。

With Claude Code, the plugin shows how far the current branch's test list has got: a coloured band above the prompt, and a pane (opened by itself on a wide terminal, or with `/codence-progress`) with per-scenario bars, the current item, recent tool calls, uncommitted changes and recent commits. It only reads the list. It uses Claude Code's experimental hooks modules, so a Claude Code release may stop it drawing; the procedures are unaffected. Not shown in Codex.

## 仕組み / How it is built

```
skills/       入口のスキル。短く、procedures/ の手順を読んで実行するだけ / thin entries that read and run a procedure
procedures/   手順の本文（共通の規律、review、TDD の各段階など）/ the procedures
lenses/       観点の本文 / the lenses
agents/       観点を新しい文脈で動かす担当（Claude 用）/ fresh-context lens runners (Claude)
examples/     言語パック（直し方と lint の設定の見本。TypeScript・Rust・Go・Python・Java/Kotlin・PHP・Ruby・C#）/ language packs (remedy and lint examples)
templates/    profile.md と config.yaml の雛形 / templates for the project settings
bench/        費用と結果を測る仕組み / the measurement harness
mods/         進み具合の帯とパネル（Claude Code の hooks のモジュール。Codex が既定で読む hooks/ には置かない）/ the progress band and pane (Claude Code hooks module; kept out of hooks/, which Codex reads by default)
types/        その状態の型 / its state types
```

- 手順と観点の本文には、ツール固有の言葉を書かない。ツールの違いは、入口の 1 行（プラグインの根元の見つけ方）と、ツールごとの設定ファイル、Claude 用の担当（`agents/`）だけに置く。
  Procedures and lenses stay tool-neutral; tool differences live only in one line of each entry, per-tool config files, and the Claude agents in `agents/`.
- 手順は、互いに依存しない読み込みを 1 往復にまとめ、検索で絞ってから要るファイルだけを開く。費用の大半は、AI がツールを呼ぶ往復の回数と、ファイルを開いたときに自動で読み込まれる規約の量で決まるからだ。
  Procedures batch independent reads and search before opening files: round trips and folder-scoped rules pulled in by opening files dominate the cost.

## bench

`bench/run.sh` は、試す先のリポジトリを、固定したコミットから毎回複製し直す。そのうえで、比べる版どうしで同じ課題を交互に（AB/BA の順で）走らせ、費用・往復の数・結果を記録する。
`bench/grade.sh` は、指摘の名前と場所、入口が呼ばれたときだけ動いたか、TDD の順番（テストが落ちてから実装を変えたか）を採点する。
採用の基準は `bench/criteria.md`。導入先の課題と結果は `bench/local/` に置き、公開しない。bench 自体のテストは `CONTRIBUTING.md` にある。

`bench/run.sh` re-clones the target repository at a fixed commit and runs the same task per version in alternating order, recording cost, turns and outcome.
`bench/grade.sh` grades findings by name and location, non-invocation, and TDD order (did a test fail before the code changed).
The adoption criteria are in `bench/criteria.md`. Target-specific tasks and results stay in `bench/local/`, unpublished. The bench's own tests are listed in `CONTRIBUTING.md`.

## 計画 / Plan

進める順番、各段階の完了の判定、決めたことと測った結果（既定の値がなぜそうなのか）は `PLAN.md` にある。
The phases, their completion criteria, decisions and measured results are in `PLAN.md`.

## 貢献 / Contributing

Issue とプルリクエストを歓迎する。手順は `CONTRIBUTING.md` にある。`main` への変更はプルリクエストだけで、`bench/tests` が GitHub Actions で通る必要がある。
Issues and pull requests are welcome; see `CONTRIBUTING.md`. `main` changes only through pull requests, with `bench/tests` passing in GitHub Actions.

## ライセンス / License

MIT
