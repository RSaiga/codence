#!/usr/bin/env bash
# Check grade.sh's opened / opened-before on hand-written transcripts: a Read or a shell read counts,
# a claim in the answer alone does not, and the read must come before the first write when ordered.
set -euo pipefail

here="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d "${TMPDIR:-/tmp}/codence-bench-opened.XXXXXX")"
trap 'rm -rf "$tmp"' EXIT
fail() { echo "FAIL: $*" >&2; exit 1; }

# Each step is "read <path>", "cat <path>", "edit <path>", "deny <path>" or "sh <command>"; the answer claims the log was read.
stream() {
  python3 - "$@" <<'PY'
import json, sys
print(json.dumps({"type": "system", "subtype": "init", "plugins": []}))
for n, step in enumerate(sys.argv[1:]):
    kind, arg = step.split(" ", 1)
    use = {"type": "tool_use", "id": f"t{n}"}
    out = "ok"
    if kind == "read":
        use |= {"name": "Read", "input": {"file_path": arg}}
    elif kind == "edit":
        use |= {"name": "Edit", "input": {"file_path": arg}}
    elif kind == "sh":
        use |= {"name": "Bash", "input": {"command": arg}}
    elif kind == "deny":
        use |= {"name": "Bash", "input": {"command": f"tail -50 {arg}"}}
        out = "This command requires approval"
    else:
        use |= {"name": "Bash", "input": {"command": f"tail -50 {arg} | head"}}
    print(json.dumps({"type": "assistant", "message": {"content": [use]}}))
    print(json.dumps({"type": "user", "message": {"content": [
        {"type": "tool_result", "tool_use_id": f"t{n}", "content": out, "is_error": False}]}}))
print(json.dumps({"type": "result", "subtype": "success", "is_error": False, "result": "記録: .data/server.log を見た"}))
PY
}
verdict() { "$here/grade.sh" "$1" "$2" 0 | python3 -c 'import json,sys; print(json.load(sys.stdin)["pass"])'; }

printf 'opened server\\.log$\n' > "$tmp/opened"
printf 'opened-before server\\.log$ src/\n' > "$tmp/before"

stream "read /r/.data/server.log" > "$tmp/a.jsonl"
[ "$(verdict "$tmp/opened" "$tmp/a.jsonl")" = True ] || fail "a Read of the log counts"

stream "cat /r/.data/server.log" > "$tmp/b.jsonl"
[ "$(verdict "$tmp/opened" "$tmp/b.jsonl")" = True ] || fail "a shell read of the log counts"

stream "edit /r/src/app.ts" > "$tmp/c.jsonl"
[ "$(verdict "$tmp/opened" "$tmp/c.jsonl")" = False ] || fail "a claim in the answer alone must not count"

stream "deny /r/.data/server.log" > "$tmp/d.jsonl"
[ "$(verdict "$tmp/opened" "$tmp/d.jsonl")" = False ] || fail "a denied read is not a read"

stream "read /r/.data/server.log" "edit /r/src/app.ts" > "$tmp/e.jsonl"
[ "$(verdict "$tmp/before" "$tmp/e.jsonl")" = True ] || fail "reading before the first write passes"

stream "edit /r/src/app.ts" "read /r/.data/server.log" > "$tmp/f.jsonl"
[ "$(verdict "$tmp/before" "$tmp/f.jsonl")" = False ] || fail "reading only after the first write fails"

stream "sh ls .data 2>/dev/null; cat /r/src/app.ts" "read /r/.data/server.log" "edit /r/src/app.ts" > "$tmp/g.jsonl"
[ "$(verdict "$tmp/before" "$tmp/g.jsonl")" = True ] || fail "a read with stderr sent to /dev/null is not a write"

stream "sh git add src/app.ts && git commit -m 'feat: x' -m \"Co-Authored-By: A <a@example.invalid>\"" "read /r/.data/server.log" > "$tmp/h.jsonl"
[ "$(verdict "$tmp/before" "$tmp/h.jsonl")" = True ] || fail "a > inside a quoted message is not a write"

stream "sh echo x > /r/src/app.ts" "read /r/.data/server.log" > "$tmp/i.jsonl"
[ "$(verdict "$tmp/before" "$tmp/i.jsonl")" = False ] || fail "a real redirect into src/ is still a write"

echo "opened: all checks passed"
