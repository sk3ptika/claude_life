---
titel: Vault-Oberflaeche auf einem Raspberry Pi Zero
typ: notiz
status: aktiv
angelegt: 2026-08-28
---

# Vault-Oberfläche auf einem Raspberry Pi Zero

Frage: Reicht ein Pi Zero, um `_system/ui/` dauerhaft im Heimnetz zu hosten, damit alle Geräte auf Kompendium und Projekt-UI kommen — auch wenn der Mac zu ist?

Kurz: **Ja, auf einem Zero 2 W deutlich. Auf einem Zero 1 / Zero W spürbar zäh, aber benutzbar.**

## Befund: Messung statt Bauchgefühl

Gemessen am 2026-08-28 auf dem Mac (M3, `/usr/bin/python3` 3.9, nur Standardbibliothek), Vault mit 55 Markdown-Dateien, 35 Ordnern, 544 KB Text:

| Operation | Zeit auf dem M3 | Antwortgröße |
|---|---|---|
| `/api/tree` (kompletter Index-Scan) | 10,4 ms | 31 KB JSON |
| `/api/suche` (Volltext über alle Dateien) | 13,8 ms | — |
| `/api/doc` (größte Datei, x100v-handbuch.md, 96 KB) | 11,1 ms | — |
| Statische Shell (index.html + app.js + md.js + style.css) | — | ca. 140 KB |

Der entscheidende Punkt: **der Server rechnet fast nichts.** Markdown wird im Browser gerendert (`public/md.js`), der Server liest Dateien, parst Frontmatter und gibt JSON aus. Die Arbeit liegt beim Endgerät, nicht beim Pi.

## Hochrechnung auf den Pi

Geschätzt, nicht auf dem Gerät gemessen. Grundlage sind übliche Python-Interpreter-Faktoren gegenüber einem M3-Kern.

| Gerät | Faktor | `/api/tree` | `/api/suche` | `/api/status` |
|---|---|---|---|---|
| Zero 2 W (4× Cortex-A53, 1 GHz) | ~12–18× | 0,15–0,2 s | 0,2–0,25 s | 1–2 s |
| Zero 1 / Zero W (1× ARM11, 1 GHz) | ~40–60× | 0,4–0,6 s | 0,6–0,9 s | 3–6 s |

Dazu kommt Netz und Browser. Praktisch heißt das auf dem Zero 2 W: Baum lädt in unter einer halben Sekunde, Suche fühlt sich sofort an. Auf dem Zero 1: jede Aktion hat eine knappe Sekunde Verzögerung, und der einzelne Kern bedient effektiv nur eine Anfrage gleichzeitig — `ThreadingHTTPServer` hilft bei I/O-Warten, nicht bei Rechenlast.

`/api/status` ist der Ausreißer: es startet drei Git-Prozesse plus ein `find` über den Baum. Auf dem Zero 1 sind das mehrere Sekunden. Prozessstart ist auf ARM11 teuer.

### Die echten Engpässe

1. **WLAN, nicht CPU.** Beide Zeros haben nur 2,4 GHz über SDIO, real 3–8 Mbit/s. Die 140 KB Shell brauchen damit 0,2–0,4 s — und der Server setzt heute `Cache-Control: no-store` auf *alles*, also bei jedem Laden neu.
2. **`/api/datei` liest die ganze Datei in den RAM** und schickt sie am Stück. Das 10-MB-Kill-Team-PDF passt in 512 MB, dauert über dieses WLAN aber 15–40 s. Große Anhänge auf dem Pi zu öffnen macht keinen Spaß.
3. **RAM ist unkritisch.** Der Serverprozess liegt bei 25–35 MB von 512 MB.
4. **Skalierung.** Es gibt keinen Index-Cache — jeder Aufruf scannt den kompletten Baum neu. Bei 55 Dateien egal, bei 500 Dateien ist der Zero 1 durch, der Zero 2 W nicht.

## Was am Code angepasst werden muss

Der Server ist auf macOS geschrieben. Vier Stellen brechen auf Linux:

1. **Blocker: `gateway_mac()` in `_system/ui/server.py`** nutzt `route -n get default` und `arp -n` (BSD). Auf Linux liefert das nichts, `im_heimnetz()` wird `False`, und **jedes andere Gerät bekommt 403** — genau das, was hier gewollt ist, fällt aus. Fix: `"heimnetz_pruefen": false` in der `config.json` auf dem Pi. Die Prüfung existiert, weil das MacBook das Heimnetz verlässt. Der Pi tut das nie, also ist sie dort sinnlos.
2. `bonjour_name()` nutzt `scutil` und fällt sauber auf `gethostname()` zurück. Für `.local` muss `avahi-daemon` laufen — bei Raspberry Pi OS vorinstalliert.
3. `launchagent.plist` und `start.command` sind macOS-only. Auf dem Pi braucht es eine systemd-Unit.
4. `Cache-Control: no-store` gilt auch für `app.js`, `md.js`, `style.css`. Auf dem Zero-WLAN lohnt sich ein `max-age` für die drei statischen Dateien.

Nicht kaputt, aber zu wissen:

- `config.json` ist gitignoriert. Der Pi erzeugt beim ersten Start **ein eigenes, anderes Token**. Das ist richtig so, überrascht aber.
- `*.pdf` ist gitignoriert außer unter `_anhaenge/`. Die Kompendium-PDFs (Kill Team, X100V) kommen mit, das 12-MB-Warhammer-PDF in `00_Inbox/` nicht.
- `gitwrap.commit()` ruft `commit.sh` inklusive `git push`. Auf dem Pi bräuchte das eigene Git-Credentials.

## Entscheidung: Welches Sync-Modell?

Der Pi kann Google Drive nicht sprechen. Die Verbindung zum Mac läuft zwingend über Git. Damit stellt sich die Frage, wer schreiben darf.

**Option A — Pi als Nur-Lese-Spiegel.** Mac bleibt Autorität (Drive + Claude Code + Schreiben). Pi zieht per Timer `git pull`, liefert die UI an alle Geräte, `POST`/`PUT` sind abgeschaltet.
- Pro: kein Divergenzrisiko, kein Git-Token auf dem Pi, Ausfall des Pi kostet nichts.
- Contra: vom Sofa aus nur lesen. Änderungen erst nach dem nächsten Push vom Mac sichtbar.

**Option B — Pi als Zweitschreiber.** Pi darf editieren, committet und pusht sofort, Mac zieht vor jeder Sitzung.
- Pro: volle Funktion von überall.
- Contra: zwei Arbeitskopien, dazu Drive als dritter Schreiber auf der Mac-Seite. Vergessenes `git pull` auf dem Mac erzeugt Merge-Konflikte in Notizen. Git-Token liegt auf einem Gerät, das immer läuft.

**Option C — Pi wird die Autorität.** Drive raus, Mac greift nur noch per Browser zu.
- Contra: Claude Code arbeitet auf lokalen Dateien. Damit wäre der Vault für Claude Code auf dem Mac weg. Fällt aus.

**Option D — kein Pi.** Der Mac-Server bindet schon auf `0.0.0.0:4173`. Alle Geräte im Heimnetz kommen heute schon dran, solange der Mac wach ist.
- Der Pi kauft ausschließlich **Verfügbarkeit**, wenn der Mac zu oder unterwegs ist. Wenn das kein echtes Problem ist, ist D die ehrliche Antwort.

**Empfehlung: A, Unsicherheit ~70 %.** Begründung: Der Nutzen liegt im Nachschlagen (Kompendium, Projektstände), nicht im Tippen auf dem Handy. A ist die einzige Variante ohne Konfliktrisiko in den Notizen. Die 30 % Unsicherheit: falls sich zeigt, dass Inbox-Einträge vom Sofa aus der eigentliche Zweck sind, ist A zu wenig und B richtig — dann aber mit „Pi committet nach jedem Speichern automatisch" als harter Regel.

Zur Hardware: **Zero 2 W**, Unsicherheit ~15 %. Der Preisunterschied ist zweistellig, der Leistungsunterschied vierfach, und der Zero 1 hat beim Index-Scan keinen Puffer nach oben.

## Plan 1 — Pi einrichten

1. **Material**: Pi Zero 2 W, microSD 32 GB (A1-Klasse, nicht die billigste), USB-Netzteil 5 V / 2,5 A, Gehäuse. Kein Display, kein Tastatur — Headless.
2. **Image schreiben**: Raspberry Pi Imager, „Raspberry Pi OS Lite (64-bit)". Im Zahnrad vorab setzen: Hostname `vault`, SSH aktiviert mit Public Key, WLAN-SSID und Passwort, Locale `de_DE`, Zeitzone Europe/Berlin. Benutzername nicht `pi`.
3. **Erster Start**: Karte rein, Strom dran, zwei Minuten warten, dann `ssh <benutzer>@vault.local`.
4. **Grundpflege**:
   ```bash
   sudo apt update && sudo apt full-upgrade -y
   sudo apt install -y git python3 avahi-daemon
   ```
   Mehr braucht es nicht — die UI nutzt ausschließlich die Python-Standardbibliothek.
5. **Feste Adresse**: DHCP-Reservierung im Router auf die MAC des Pi. Lesezeichen zeigen trotzdem auf `vault.local`, das überlebt einen Router-Tausch.
6. **Unbeaufsichtigte Updates**: `sudo apt install -y unattended-upgrades`. Ein Gerät, das immer läuft und nie gepflegt wird, ist die eigentliche Gefahr.
7. **Schreiblast senken** (SD-Karten sterben an Schreibzugriffen): `sudo apt install -y log2ram`, und im Serverbetrieb keine Logs in den Vault schreiben.
8. **Kein Portforwarding.** Das Ding bleibt im LAN. HTTP ohne TLS und ein Cookie-Token sind für das Heimnetz in Ordnung und für das Internet nicht.

## Plan 2 — Claude_Life auf dem Pi lauffähig machen

Reihenfolge zählt: erst Daten, dann Konfiguration, dann Dienst.

1. **Vom Mac aus alles pushen**, damit der Klon vollständig ist:
   ```bash
   ~/"Meine Ablage/Claude_Life/_system/commit.sh" "Stand vor Pi-Einrichtung"
   ```
2. **Deploy-Key statt Passwort.** Auf dem Pi `ssh-keygen -t ed25519`, den Public Key in GitHub unter dem Repo als **Deploy Key, nur Lesezugriff** hinterlegen. Kein Personal Access Token auf dem Pi. Das Anlegen des Keys in GitHub machst du selbst — Zugangsdaten bleiben deine Sache.
3. **Klonen** (nicht nach `/home`, sondern an einen sprechenden Ort):
   ```bash
   sudo mkdir -p /srv && sudo chown $USER /srv
   git clone git@github.com:sk3ptika/claude_life.git /srv/claude_life
   ```
   Erwartete Größe: knapp 20 MB, im Wesentlichen die beiden Anhang-PDFs.
4. **`config.json` auf dem Pi anlegen** — sie ist gitignoriert, existiert dort also nicht:
   ```json
   {
     "port": 4173,
     "bind": "0.0.0.0",
     "heimnetz_pruefen": false
   }
   ```
   Ohne `token` erzeugt der Server beim ersten Start selbst eines und schreibt es in die Datei. Das Token danach im Passwortmanager ablegen, nicht in einer Notiz.
5. **Probelauf im Vordergrund**:
   ```bash
   python3 /srv/claude_life/_system/ui/server.py
   ```
   Die Startmeldung enthält den Link mit `?t=<token>`. Den einmal auf jedem Gerät öffnen, danach reicht `http://vault.local:4173/`.
6. **Als Dienst einrichten**: systemd-Unit `/etc/systemd/system/vault-ui.service` mit `Restart=always`, `WorkingDirectory=/srv/claude_life/_system/ui`, Log nach journald (nicht in den Vault — die Startmeldung enthält das Token). Dann `sudo systemctl enable --now vault-ui`.
7. **Automatischer Abgleich**: systemd-Timer alle 5 Minuten mit `git -C /srv/claude_life pull --ff-only`. `--ff-only` ist wichtig: bei Option A darf auf dem Pi nie gemergt werden, ein Fehlschlag soll auffallen statt still einen Merge-Commit zu bauen.
8. **Schreibzugriff abschalten** (Option A): ein Flag `"nur_lesen": true` in der `config.json`, das `do_POST` und `do_PUT` mit 403 beantwortet. Kleiner Eingriff in `server.py`, gehört ins Repo, damit der Mac davon unberührt bleibt (dort steht das Flag nicht).
9. **Statische Dateien cachen lassen**: im Handler für `app.js`, `md.js`, `style.css` `Cache-Control: max-age=3600` statt `no-store`. API-Antworten bleiben `no-store`.
10. **Abnahme**: von Handy, Tablet und einem zweiten Rechner je einmal Baum laden, ein Kompendium öffnen (Wolf Scouts, 40 KB), eine Suche absetzen, ein Anhangs-PDF öffnen. Wenn Schritt vier davon unerträglich langsam ist, weißt du, dass es am WLAN liegt und nicht am Pi.

Schritte 8 und 9 sind Code-Änderungen am Repo und brauchen eine eigene Sitzung.

## Warum das keine Projekt-Anlage ist

Es laufen bereits drei aktive Projekte (Japan-Reise, Norwegen-Rundreise, X100V Japan-ready) — das ist das Maximum. Diese Notiz liegt deshalb im Bereich Technik. Soll die Pi-Einrichtung als viertes Projekt mit Deadline geführt werden, muss vorher eines der drei pausiert werden.

## Offen

- Zero 2 W kaufen oder Zero 1 aus der Schublade? Siehe Empfehlung oben.
- Option A oder B — vor dem Kauf entscheiden, sie ändert Schritt 2 (Deploy Key lesend vs. schreibend) und Schritt 8.
- Ist der Pi im 3-2-1-Backup relevant? Nein: er ist ein Klon, kein Original. Der Standard im Bereich Technik bleibt unberührt.
