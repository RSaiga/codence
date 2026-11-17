#!/usr/bin/env bash
# The router's table names, for each entry, the same kit files that entry's SKILL.md reads, so routing
# never runs an entry with a different set of procedures than calling it directly would.
set -euo pipefail

kit="$(cd "$(dirname "$0")/../.." && pwd)"
python3 - "$kit" <<'EOF'
import re, sys
kit = sys.argv[1]
files = lambda text: set(re.findall(r"`((?:procedures|lenses)/[\w-]+\.md)`", text)) - {"procedures/discipline.md", "procedures/second-opinion.md"}
route = open(f"{kit}/procedures/route.md").read()
rows = re.findall(r"^\| `([\w-]+)` \|(.*)$", route, re.M)
if not rows:
    sys.exit("FAIL: no entry rows in the route table")
bad = []
for entry, rest in rows:
    skill = open(f"{kit}/skills/{entry}/SKILL.md").read().split("\n\n")
    want = files("\n".join(p for p in skill if not p.startswith("In the first turn")))
    got = files(rest)
    if want != got:
        bad.append(f"{entry}: table {sorted(got)} != SKILL.md {sorted(want)}")
if bad:
    sys.exit("FAIL: " + "; ".join(bad))
print(f"route-table: {len(rows)} entries match their SKILL.md")
EOF
