#!/usr/bin/env bash
# Doppelklick-Starter für die Vault-Oberfläche.
# Gibt LAN-Adresse und Token aus und bleibt im Vordergrund; Fenster
# schließen oder Ctrl+C beendet den Server.

set -euo pipefail

UI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$UI"

PORT="$(/usr/bin/python3 - <<'PY'
import json, os
p = os.path.join(os.getcwd(), 'config.json')
print(json.load(open(p))['port'] if os.path.isfile(p) else 4173)
PY
)"

if /usr/bin/nc -z 127.0.0.1 "$PORT" 2>/dev/null; then
  echo "Auf Port $PORT läuft schon etwas. Vermutlich der Server selbst."
  echo "Beenden mit:  pkill -f '_system/ui/server.py'"
  exit 1
fi

IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo '')"
echo "Rechnername: $(scutil --get LocalHostName 2>/dev/null || hostname).local"
[ -n "$IP" ] && echo "IP im WLAN:  $IP (kann per DHCP wechseln — Lesezeichen besser auf .local)"
echo

exec /usr/bin/python3 -u "$UI/server.py"
