---
name: go
description: One entry for any request. Restates the goal, picks the right codence entry from the request and the project's state (plan, cycle, review, refactor, retro, init, or one TDD stage), copies its steps to a todo, and runs it. After an approved plan, goes on into the cycle.
disable-model-invocation: true
---

プラグインの根元 / Plugin root: `${CLAUDE_PLUGIN_ROOT}`（置き換わっていなければ、この SKILL.md の 2 つ上のディレクトリ / if not substituted, two directories above this SKILL.md）。以下のパスはすべてここからの相対パス。 / All paths below are relative to it.

最初の 1 回の往復で、次を**まとめて**行う:
- `procedures/discipline.md` と `procedures/route.md` を読む。
- `git rev-parse --show-toplevel; git branch --show-current; git status --short; ls .codence/lists; cat .codence/profile.md .codence/config.yaml` を、プラグインではなく**プロジェクトの現在のディレクトリで**実行する（現在のディレクトリが根元でなく読めなかったときだけ、根元のパスで読み直す）。

そのあと `procedures/route.md` を実行する。呼び出しに続く文字列は、ユーザーの依頼として扱う。

In the first turn, together: read `procedures/discipline.md` and `procedures/route.md`, and run the command above in the project's current directory, not the plugin
(re-read with the root path only if the current directory is not the root). Then run `procedures/route.md`. Any text after the invocation is the user's request.
