#!/usr/bin/env bash
# README.md (English) and README.ja.md (Japanese) carry the same sections, entries and lenses,
# so a change made to one and forgotten in the other fails here.
set -euo pipefail

kit="$(cd "$(dirname "$0")/../.." && pwd)"
python3 - "$kit" <<'PY'
import re, sys
kit = sys.argv[1]
def shape(name):
    text = open(f"{kit}/{name}").read()
    heads = [len(m) for m in re.findall(r"^(#{2,3}) ", text, re.M)]
    entries = re.findall(r"^\| `([\w-]+)`", text, re.M)
    lenses = re.findall(r"^\| ([a-z]+) \|", text, re.M)
    blocks = text.count("```")
    return {"heading levels": heads, "entry rows": entries, "lens rows": lenses, "code fences": blocks}
en, ja = shape("README.md"), shape("README.ja.md")
bad = [f"{k}: README.md {en[k]} != README.ja.md {ja[k]}" for k in en if en[k] != ja[k]]
if bad:
    sys.exit("FAIL: " + "; ".join(bad))
for f, other in (("README.md", "README.ja.md"), ("README.ja.md", "README.md")):
    if f"]({other})" not in open(f"{kit}/{f}").read():
        sys.exit(f"FAIL: {f} does not link to {other}")
print(f"readme-sync: {len(en['heading levels'])} sections, {len(en['entry rows'])} entry rows, {len(en['lens rows'])} lens rows match")
PY
