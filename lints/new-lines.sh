#!/usr/bin/env bash
# Run `ast-grep scan` and report only the findings on lines this change added, so a rule can start
# without cleaning up what is already there.
#   new-lines.sh [<base>]   lines added since the merge base with <base> (default HEAD), untracked files included
#   new-lines.sh --staged   lines added in the index (for a pre-commit hook)
# AST_GREP names the command (default `ast-grep`; for example `npx -y -p @ast-grep/cli@0.51.3 ast-grep`).
# The rules come from sgconfig.yml next to this script when there is one, else from the root's sgconfig.yml.
# Exit 1 when a finding is on an added line, printed as <file>:<line>: <message>.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
cd "$(git rev-parse --show-toplevel)"
read -r -a sg <<< "${AST_GREP:-ast-grep}"
config=(); [ -f "$here/sgconfig.yml" ] && config=(-c "$here/sgconfig.yml")
untracked=""
if [ "${1:-}" = --staged ]; then
  range=(--cached)
else
  range=("$(git merge-base "${1:-HEAD}" HEAD)")
  untracked="$(git ls-files --others --exclude-standard)"
fi
files="$( { git diff --name-only --diff-filter=AMR "${range[@]}"; printf '%s\n' "$untracked"; } | grep -v '^$' | sort -u || true)"
[ -n "$files" ] || exit 0
added="$(mktemp)"; trap 'rm -f "$added"' EXIT
{
  git diff -U0 --diff-filter=AMR "${range[@]}" |
    awk '/^\+\+\+ b\//{f=substr($0,7)} /^@@ /{split($3,a,","); s=substr(a[1],2); n=(a[2]==""?1:a[2]); for(i=0;i<n;i++) print f":"s+i}'
  while IFS= read -r f; do [ -n "$f" ] && awk -v f="$f" '{print f":"NR}' "$f"; done <<< "$untracked"
} > "$added"
found="$(printf '%s\n' "$files" | tr '\n' '\0' | xargs -0 "${sg[@]}" scan ${config[@]+"${config[@]}"} --format github 2>/dev/null || true)"
printf '%s\n' "$found" | awk '
  NR == FNR { ok[$0] = 1; next }
  /^::/ {
    match($0, /file=[^,]*/); f = substr($0, RSTART + 5, RLENGTH - 5)
    match($0, /,line=[0-9]+/); s = substr($0, RSTART + 6, RLENGTH - 6) + 0
    match($0, /endLine=[0-9]+/); e = substr($0, RSTART + 8, RLENGTH - 8) + 0
    msg = $0; sub(/^[^:]*::[^:]*::/, "", msg)
    for (l = s; l <= e; l++) if ((f ":" l) in ok) { print f ":" s ": " msg; bad = 1; break }
  }
  END { exit bad }' "$added" -
