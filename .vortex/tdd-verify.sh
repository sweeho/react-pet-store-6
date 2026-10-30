#!/bin/sh
# tdd-verify: replay a pull request's [tdd:red] and [tdd:green] commits (Vortex plan 105).
#
# Installed into a project's repository as .vortex/tdd-verify.sh by the Design
# workbench's Setup stage, and run by CI on every pull request. It does NOT judge
# anything: it re-runs the tests at the two tagged commits and uploads what they
# report, and the Vortex merge gate judges the result. So it always exits 0.
#
#   sh .vortex/tdd-verify.sh <base-branch> <command> <junit-path> [<command> <junit-path> ...]
#
# One <command> <junit-path> pair per testEvidence suite, the same commands as
# .vortex/config.yaml. It needs the full history (actions/checkout fetch-depth: 0)
# and the project's dependencies already installed by an earlier CI step: each
# tagged commit is checked out IN PLACE, so the installed dependencies are reused.
#
# Writes, for the CI step that uploads the artifact `vortex-tdd-replay`:
#   vortex-replay/replay.json        {"base": ..., "red": <sha|null>, "green": <sha|null>, "suites": N}
#   vortex-replay/red-<n>.xml        suite n's JUnit report at the [tdd:red] commit
#   vortex-replay/green-<n>.xml      suite n's JUnit report at the [tdd:green] commit
#
# The newest commit whose subject ends with [tdd:red] (or [tdd:green]) between the
# merge base and HEAD is the one replayed. A pull request with neither tag writes
# only replay.json: a ticket with no linked test cases has nothing to replay.

set -u

if [ "$#" -lt 3 ] || [ $(( ($# - 1) % 2 )) -ne 0 ]; then
  echo "usage: tdd-verify.sh <base-branch> <command> <junit-path> [<command> <junit-path> ...]" >&2
  exit 0
fi

base=$1
shift
out=vortex-replay
rm -rf "$out"
mkdir -p "$out"

json_sha() {
  if [ -n "$1" ]; then printf '"%s"' "$1"; else printf 'null'; fi
}

origin_head=$(git rev-parse HEAD)
merge_base=$(git merge-base "origin/$base" HEAD 2>/dev/null || true)
if [ -z "$merge_base" ]; then
  echo "tdd-verify: no merge base with origin/$base; fetch the full history (fetch-depth: 0)" >&2
  printf '{"base":"%s","red":null,"green":null,"suites":%s,"error":"no merge base"}\n' \
    "$base" "$(( $# / 2 ))" > "$out/replay.json"
  exit 0
fi

# Newest first. --no-merges: a merge commit is never a phase commit.
tagged() {
  git log --no-merges --format='%H %s' "$merge_base..HEAD" | grep -E " .*\[tdd:$1\]\$" | head -n 1 | cut -d' ' -f1
}
red=$(tagged red)
green=$(tagged green)

suites=$(( $# / 2 ))
printf '{"base":"%s","red":%s,"green":%s,"suites":%s}\n' \
  "$base" "$(json_sha "$red")" "$(json_sha "$green")" "$suites" > "$out/replay.json"

# Run every suite at one commit, copying each report out of the tree before the
# next checkout. A suite that writes no report leaves no file; the merge gate
# reads that as a missing report.
replay() {
  phase=$1
  sha=$2
  shift 2
  git checkout -q --detach "$sha" || return 0
  n=1
  while [ "$#" -ge 2 ]; do
    cmd=$1
    report=$2
    shift 2
    rm -f "$report"
    sh -c "$cmd" > "$out/$phase-$n.log" 2>&1 || true
    if [ -f "$report" ]; then cp "$report" "$out/$phase-$n.xml"; fi
    n=$(( n + 1 ))
  done
}

if [ -n "$red" ]; then replay red "$red" "$@"; fi
if [ -n "$green" ]; then replay green "$green" "$@"; fi
git checkout -q --detach "$origin_head" || true
exit 0
