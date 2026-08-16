#!/usr/bin/env bash
# Commit und Push für Claude_Life.
# Nutzung:  ./_system/commit.sh "Nachricht"
# Ohne Argument wird eine Standard-Nachricht mit Datum gesetzt.

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"

if [ ! -d .git ]; then
  echo "Kein Git-Repository in $REPO" >&2
  exit 1
fi

# Google-Drive-Konfliktkopien aufspüren, bevor sie committet werden
CONFLICTS="$(find . -path ./.git -prune -o \( -name '*(1)*' -o -name '*conflicted copy*' -o -name '*Konflikt*' \) -print 2>/dev/null || true)"
if [ -n "$CONFLICTS" ]; then
  echo "WARNUNG: mögliche Sync-Konfliktdateien gefunden:" >&2
  echo "$CONFLICTS" >&2
  echo "Erst prüfen, dann erneut ausführen." >&2
  exit 2
fi

MSG="${1:-Stand $(date +%Y-%m-%d)}"

git add -A

if git diff --cached --quiet; then
  echo "Keine Änderungen."
  exit 0
fi

git commit -m "$MSG"
echo "Commit: $MSG"

if git remote get-url origin >/dev/null 2>&1; then
  git push
  echo "Gepusht nach origin."
else
  echo "Kein Remote konfiguriert. Siehe _system/git.md, Schritt 2." >&2
fi

git --no-pager log --oneline -3
