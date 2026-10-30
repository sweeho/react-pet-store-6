#!/bin/sh
# tdd-verify: replay a pull request's [tdd:red] and [tdd:green] commits (Vortex plan 105).
# tdd-verify-version: 2
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
#   vortex-replay/replay.json        {"base": ..., "red": <sha|null>, "green": <sha|null>, "suites": N, "repeats": R}
#   vortex-replay/red-<n>.xml        suite n's JUnit report at the [tdd:red] commit
#   vortex-replay/green-<n>.xml      suite n's JUnit report at the [tdd:green] commit
#   vortex-replay/green-<n>.r<k>.xml suite n's report on repeat k (1..R) at the [tdd:green] commit
#
# The repeats catch an unreliable test: one that passes once and fails on a second
# run of the same code (a test that acts before the app is ready). R is
# TDD_VERIFY_REPEATS, default 2; 0 turns them off. The merge gate judges them only
# for the ticket's own test cases, and only while its switch is on.
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
repeats=${TDD_VERIFY_REPEATS:-2}
case "$repeats" in ''|*[!0-9]*) repeats=2 ;; esac
if [ -z "$green" ]; then repeats=0; fi
printf '{"base":"%s","red":%s,"green":%s,"suites":%s,"repeats":%s}\n' \
  "$base" "$(json_sha "$red")" "$(json_sha "$green")" "$suites" "$repeats" > "$out/replay.json"

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
if [ -n "$green" ]; then
  replay green "$green" "$@"
  k=1
  while [ "$k" -le "$repeats" ]; do
    replay "green-r$k" "$green" "$@"
    # replay names its files <phase>-<n>; the reader expects green-<n>.r<k>.
    n=1
    while [ "$n" -le "$suites" ]; do
      if [ -f "$out/green-r$k-$n.xml" ]; then mv "$out/green-r$k-$n.xml" "$out/green-$n.r$k.xml"; fi
      if [ -f "$out/green-r$k-$n.log" ]; then mv "$out/green-r$k-$n.log" "$out/green-$n.r$k.log"; fi
      n=$(( n + 1 ))
    done
    k=$(( k + 1 ))
  done
fi
git checkout -q --detach "$origin_head" || true
exit 0
