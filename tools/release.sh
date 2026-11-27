#!/usr/bin/env bash
# Builds, checks and tests. Only if everything passes is the change committed.
# Usage: tools/release.sh "Besked om ændringen"
set -euo pipefail
cd "$(dirname "$0")/.."
[ -n "${1:-}" ] || { echo "Skriv en besked: tools/release.sh \"...\""; exit 2; }
python3 tools/build.py
node tools/lint.js
node tests/run.js
git add -A
git commit -q -m "$1"
echo "✓ Klar. Kør git push for at udgive."
