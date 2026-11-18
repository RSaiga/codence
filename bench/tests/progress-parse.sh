#!/usr/bin/env bash
# hooks/parse.ts counts a test list the way tdd.md writes it: items by mark, scenarios as groups,
# the first in-progress item as the current one, parked items, and the decision log's last entry.
set -euo pipefail
kit="$(cd "$(dirname "$0")/../.." && pwd)"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
cat > "$tmp/list.md" <<'MD'
# target
## 受け入れシナリオ / Acceptance
### [x] A1 one — a.feature — 出典: x
  - [x] [O] resolver: a — 出典: x
### [~] A2 two — a.feature
  - [x] [O] b
  - [~] [E] resolver: c を返す — 出典: y
  - [ ] [O] d — 保留 D1
## 既存のテスト / Existing tests
- [change] a.test.ts:1 「x」 — y
## 今回やらない / Out of scope
- e — 理由: f
MD
printf '## D1 保留 — d\n- 迷ったこと: x\n## D2 決めた — e\n' > "$tmp/decisions.md"
cat > "$tmp/check.ts" <<EOF2
import { readFileSync } from 'node:fs'
import { parseList } from '$kit/hooks/parse.ts'
const p = parseList('b', readFileSync('$tmp/list.md', 'utf8'), readFileSync('$tmp/decisions.md', 'utf8'))
const got = JSON.stringify([p.done, p.total, p.parked, p.current, p.currentDetail, p.scenario,
  p.groups.map(g => [g.title, g.mark, g.done, g.total]), p.decisions, p.lastDecision])
const want = JSON.stringify([2, 4, 1, 'resolver: c を返す', '出典: y', 'A2 two',
  [['A1 one', 'x', 1, 1], ['A2 two', '~', 1, 3]], 2, 'D2 決めた — e'])
if (got !== want) { console.error('FAIL: progress parse\n got ' + got + '\nwant ' + want); process.exit(1) }
console.log('progress-parse: ok')
EOF2
npx -y tsx@4.19.2 "$tmp/check.ts"
