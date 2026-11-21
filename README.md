<div align="center">

# codence

[![bench-tests](https://github.com/RSaiga/codence/actions/workflows/bench-tests.yml/badge.svg)](https://github.com/RSaiga/codence/actions/workflows/bench-tests.yml)
[![version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FRSaiga%2Fcodence%2Fmain%2F.claude-plugin%2Fplugin.json&query=%24.version&label=version&color=blue)](.claude-plugin/plugin.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-d97757)](#install)
[![Codex plugin](https://img.shields.io/badge/Codex-plugin-10a37f)](#install)

**English** · [日本語](README.ja.md)

[Install](#install) ·
[Use it in a project](#use-it-in-a-project) ·
[Plan](PLAN.md) ·
[Report a bug](https://github.com/RSaiga/codence/issues)

</div>

A plugin for Claude Code and Codex that keeps AI coding agents to a development discipline.

Left alone, an agent tends to write the code first and add passing tests afterwards, and to guess at your test commands and conventions.
codence fixes the procedure (plan → red → green → refactor) and has every change re-read through **lenses**: fixed perspectives that return named findings with a next move.

- **Never guesses project facts.** Test commands, locations and rules come from the project's `.codence/profile.md`; when something is missing, it stops and says which key.
- **Runs only when invoked.** No entry starts on its own.
- **Measured before it ships.** A change to the kit is adopted only when the bench shows results no worse and a lower cost, or the same cost with something simpler ([`bench/criteria.md`](bench/criteria.md)). Rejected changes and their numbers stay in the record too.

> The name blends *code*, *dance* and *cadence*: writing code with an AI as a dance kept to a steady step.

A finding from `review` looks like this (an example):

```
### [SEC-1 authorization] — src/orders/refund.ts:42  (confidence: high)
- What is wrong: the refund handler loads the order by id without checking it belongs to the caller's shop.
- Breaking input: shop A posts orderId of shop B's order → B's order is refunded.
- Remedy: load the order with both id and the caller's shopId; return not found otherwise.

## LENS FINDINGS 1
```

## What it does

Each entry is invoked as `/codence:<entry>` in Claude Code and `$codence:<entry>` in Codex.
TDD runs as a **single layer** (inner tests only) or a **double loop** (acceptance tests outside, inner tests inside), end to end with `tdd-cycle` or stage by stage.

| Entry | What it does |
|---|---|
| `go` | One entry for any request: restates it as goal, problem and expected change, picks one of the entries below, copies its steps to a todo and runs it |
| `init` | Reads the project, drafts `.codence/`, and writes it after you agree |
| `review` | Reads the working change, a branch or range, a pull request URL, or files and directories through the lenses. Read-only |
| `refactor` | Restructures outside TDD: finds smells with the structure lens and fixes, one at a time, only what existing tests guard |
| `tdd-plan` | Plans the test list (mode, scenarios, inner items, affected tests), splitting large requests into stories first; writes after approval |
| `tdd-cycle` | Runs the loop until the list is done; at the end fixes stale facts in docs, then re-reads the whole branch with every lens in a fresh context and fixes or dismisses every finding (up to three rounds) |
| `tdd-accept` | One outer-loop step: write the acceptance scenario and watch it fail, or run it and close it when green |
| `tdd-red` `tdd-green` `tdd-refactor` `tdd-commit` | Runs one TDD stage |
| `retro` | Records intent, outcome and where it stalled in `findings.md`; with `track`, judges whether countermeasures worked |

| Lens | What it checks |
|---|---|
| structure | Code smells: six generic ones always, and the project's refactoring catalog first when it has one |
| security | Authorization, tenancy, input bounds, internal leaks, secrets, injection, webhook verification (SEC-1–7) |
| concurrency | Check-then-write races, idempotency, transactions, multiple instances, shared state (CON-1–8) |
| isolation | Data that mixes: tenant filters, cross-tenant aggregates, cache and session keys, async hand-offs; and tests that share data or resources (ISO-1–8) |
| alerting | Failures the provider would first hear of from users, or never: swallowed errors, error responses that skip reporting, jobs that only log, silent degradation (ALR-1–7) |
| logging | Logs that cannot lead from a failure to its cause, or that leak or can be forged; where an important event has no log, asks whether to keep one and why not (LOG-1–5) |
| acceptance | Whether the implementation really keeps a green scenario's promise, judged in a fresh context that never saw the author's conclusion |

Only structure is on by default; add others under `lenses` in `config.yaml`.
High-confidence security and concurrency findings always come with a breaking input or interleaving.

## Install

**Claude Code**
```
claude plugin marketplace add RSaiga/codence
claude plugin install codence@codence
```
First call: `/codence:init`

**Codex**
```
codex plugin marketplace add RSaiga/codence
codex plugin add codence@codence
```
First call: `$codence:init` (the namespace is required)

`review` runs read-only git commands (`git diff`, `git ls-files`, `git hash-object`); allow them to avoid permission prompts.

**Update:** Claude Code: `claude plugin marketplace update codence`, then `claude plugin update codence@codence`, then `/reload-plugins` in the session.
Or turn on auto-update once: `/plugin` → Marketplaces → `codence` → Enable auto-update. Codex: `codex plugin marketplace upgrade codence`.

## Use it in a project

1. Invoke `init` in the project, review the draft, fill in what is missing, and agree.
2. For personal use, add `/.codence/` to `.git/info/exclude`. To share it with the team, commit it and exclude `/.codence/lists/`.
3. Invoke `review`, `tdd-cycle`, or just `go` with your request. Without settings, an entry points to `init` and stops.

```
<project>/.codence/
├── profile.md      # project facts: language, diff base, lens catalogs, test suites and locations, known failures
├── config.yaml     # how the kit runs: runner, lenses, commit policy and language
├── lists/          # per-branch TDD test lists, never committed by the kit
├── decisions/      # what tdd-cycle decided or parked, with on_doubt: log
├── backlog.md      # stories tdd-plan split out, with backlog: file
└── findings.md     # retro's log
```

Every key is explained in the templates: [`templates/profile.md`](templates/profile.md) and [`templates/config.yaml`](templates/config.yaml).
Among the optional ones, `on_doubt: log` lets `tdd-cycle` run unattended: it stops only for irreversible or foreign things, and otherwise decides the reversible way or parks the item, logging each decision. A request such as "run it overnight" switches one run.

**Precedence:** the user's instruction in the moment, then `config.yaml`, then the project's rules, then the kit.

### Which AI runs

The AI that runs the procedure is the one in the tool you invoked from; change it there (`/model` in Claude Code).
The lenses run according to `runner` in `config.yaml`:

| `runner` | Who reads | Misses / cost per run (bench) |
|---|---|---|
| `inline` (default) | the same AI, in the same context | 0 / $0.35 |
| `subagent` | a fresh-context agent of the same tool, in parallel per lens or `combined` | 0 / $0.51–0.70 |
| `command` | another CLI (e.g. Codex), prompt on stdin; the diff is sent to that service | 1 of 27 / $0.59 + that service |

`inline` missed nothing and costs least, so it is the default. `acceptance` always runs in a fresh context, whatever `runner` says.

### A second opinion

Add `--second` to `review` or `tdd-plan` to have another AI read it too.

```
/codence:review main...HEAD --second
```

```yaml
# config.yaml
second_opinion_commands:
  - ["codex", "exec", "--ephemeral", "--sandbox", "read-only", "-C", "{root}"]
  - ["claude", "-p", "--permission-mode", "plan"]
```

The first candidate whose program is not the running tool is used, so one config works from either tool.
In `review` both read in parallel and findings are paired and tagged, never dropped; in `tdd-plan` the second looks for gaps in the draft and the first answers each point.
The diff is sent to the second's service.

## Watching progress

With Claude Code, the plugin shows how far the current branch's test list has got: a band above the prompt (`codence ▰▰▰▰▰▰▰▱▱▱ 15/19 79% · ▶ current item`),
and a pane (opened by itself on a wide terminal, or with `/codence-progress`) with per-scenario bars, the current item, recent tool calls and commits.
It only reads the list. It uses Claude Code's experimental hooks modules, so a release may stop it drawing; the procedures are unaffected. Not shown in Codex.

## How it is built

```
skills/       thin entries that read and run a procedure
procedures/   the procedures (shared discipline, review, each TDD stage)
lenses/       the lenses
agents/       fresh-context lens runners (Claude)
examples/     language packs: remedy and lint examples (TypeScript, Rust, Go, Python, Java/Kotlin, PHP, Ruby, C#)
templates/    templates for the project settings
bench/        the measurement harness
mods/         the progress band and pane (Claude Code hooks module)
```

Procedures and lenses stay tool-neutral; tool differences live only in one line of each entry, the per-tool manifests, and `agents/`.
The procedures and lenses are written in Japanese with an English summary after each paragraph; the agent reports in the language set in `profile.md`.

## bench

`bench/run.sh` re-clones the target repository at a fixed commit and runs the same task for each version in alternating order, recording cost, turns and outcome.
`bench/grade.sh` grades findings by name and location, non-invocation, and TDD order (did a test fail before the code changed).
Target-specific tasks and results stay in `bench/local/`, unpublished. The phases, decisions and measured results are in [`PLAN.md`](PLAN.md).

## Contributing

Issues and pull requests are welcome; see [`CONTRIBUTING.md`](CONTRIBUTING.md). `main` changes only through pull requests, with `bench/tests` passing.

## License

MIT
