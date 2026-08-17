---
name: vault-oberflaeche
description: Die lokale Vault-Oberfläche unter _system/ui/ starten, ändern und erweitern — Server, HTTP-API, Ansichten, CSS-Tokens, Editor. Nutze dies bei "UI", "Oberfläche", "Dashboard", "Server läuft nicht", neuem Ansichtstyp oder Designänderung.
---

# Die Vault-Oberfläche

Lokaler Python-Server plus statischer Client, der den Vault sichtbar macht und die Regeln aus `CLAUDE.md` in Bedienelemente übersetzt. Kein Build-Schritt, keine Paketdatei, keine Abhängigkeit außer einer vendorten Markdown-Bibliothek.

Das **Warum** hinter jeder Entscheidung — Laufzeitwahl, Textarea statt contenteditable, Vendoring von `marked`, die Risikoliste — steht in `_system/ui-entwurf.md`. Vor größeren Umbauten dort nachlesen: mehrere Entscheidungen sehen willkürlich aus, bis man den Grund kennt.

## Starten und stoppen

Doppelklick auf `_system/ui/start.command`, oder:

```bash
/usr/bin/python3 -u ~/"Meine Ablage/Claude_Life/_system/ui/server.py"
```

Beim ersten Start entsteht `config.json` mit Port, Bind-Adresse und einem 16-Byte-Token; die Datei ist gitignored. Die Konsole zeigt zwei Adressen. Der Erstaufruf muss `?t=<token>` enthalten — das setzt ein `HttpOnly`-Cookie für 90 Tage und leitet auf `/` um, damit das Token nicht in Adressleiste und Safari-History stehen bleibt. Danach genügt das Lesezeichen `http://<rechner>.local:4173`.

Stoppen mit Ctrl+C oder:

```bash
pkill -f "_system/ui/server.py"
```

**Nur im eigenen WLAN starten.** Es ist HTTP ohne TLS, das Token geht im Klartext über das Netz. Kein Self-Signed-TLS, weil iOS dafür eine Profilinstallation verlangt.

Läuft der Server nicht, in dieser Reihenfolge prüfen: Ist der Port belegt (`lsof -nP -iTCP:4173 -sTCP:LISTEN`)? Antwortet er lokal (`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4173/`)? Kommt 401, fehlt das Cookie — einmal mit `?t=` aufrufen. Kommt 403, ist die anfragende Adresse nicht privat.

## Modulkarte

| Datei | Verantwortung |
|---|---|
| `server.py` | Routing, Token- und Netzprüfung, statische Auslieferung, Fehler → Statuscodes |
| `vault.py` | Pfadsicherheit, Index-Scan, Frontmatter parsen/serialisieren, atomares Schreiben, Anlegen aus Template, Archivieren, Suche |
| `gitwrap.py` | `commit.sh` aufrufen, Exit-Codes mappen, Konfliktkopien und Repo-Status melden |
| `start.command` | Doppelklick-Starter, gibt LAN-Adresse und Token aus |
| `public/index.html` | App-Shell plus SVG-`<symbol>`-Sprite |
| `public/app.js` | Hash-Router, Index-State, Ansichten, Editor, Suche |
| `public/md.js` | Vendored `marked` — Version, Herkunft und Lizenz im Kopfkommentar |
| `public/style.css` | Designsystem: Tokens, Grundgerüst, Komponenten, Tabellenregeln |

## Die harte Regel: keine Themennamen im Code

**In `app.js`, `style.css` und `vault.py` steht kein einziger Bereichs- oder Themenname.** Kein `warhammer`, kein `japan`, keine feste Liste von Bereichen, keine Konfigurationsdatei für Ansichten. Alles entsteht aus Ordnerstruktur und Frontmatter.

Der Vault wächst laufend um neue Bereiche. Ein neuer Ordner `02_Bereiche/<name>/` mit `_bereich.md` erscheint **ohne Codeänderung** in Seitenleiste, Dashboard-Kachel und der Bereichsauswahl des Anlege-Dialogs, mit einer stabilen eigenen Akzentfarbe (Frontmatter-Feld `farbe`, sonst deterministisch aus dem Namen gehasht).

Daraus folgt für jede Erweiterung: Wenn eine Änderung einen Namen aus dem Inhalt in den Code holen will, ist der Entwurf falsch. Stattdessen ein Frontmatter-Feld einführen und generisch darauf reagieren.

Konkret geschieht das automatisch:

- **Ein neues Frontmatter-Feld wird zum Chip** in der Dokumentansicht — dort werden *alle* Felder gezeigt, auch unbekannte.
- **Ein neues Frontmatter-Feld wird zur Spalte**, sobald es in ≥ 60 % der Zeilen einer Treffermenge vorkommt (maximal 5 Spalten auf Desktop, 2 auf Mobil, absteigend nach Häufigkeit).
- Sonderbehandlung gibt es nur für Feld*rollen*, nicht für Feld*werte*: `deadline` und `frist` bekommen einen Countdown, `angelegt`/`aktualisiert` ein Datumsfeld im Editor.

## HTTP-API

Antworten sind JSON, Pfade immer vault-relativ und NFC-normalisiert.

| Methode | Pfad | Zweck |
|---|---|---|
| GET | `/api/tree` | Gesamtindex in einem Aufruf; der Client hält alles |
| GET | `/api/doc?pfad=` | Frontmatter, Body, mtime, Links, Rückwärtslinks |
| PUT | `/api/doc` | Speichern mit mtime-Prüfung, **409** samt Serverfassung bei Abweichung |
| POST | `/api/neu` | Anlegen aus Template, `warnung` beim vierten aktiven Projekt |
| POST | `/api/archivieren` | Nach `04_Archiv/<Jahr>/`, Bericht über gebrochene Links |
| GET | `/api/suche?q=` | Serverseitig über den Index |
| GET | `/api/status` | Git-Kurzstatus, Konfliktkopien, aktive Projekte, Inbox, Dateien ohne Kopf, getrackte Dateien > 2 MB |
| POST | `/api/commit` | `commit.sh` ohne Shell aufrufen |
| GET | `/api/datei?pfad=` | Binärauslieferung (PDF, Bilder), nur lesend |

**Es gibt keinen Delete-Endpunkt.** Harte Regel 1 aus `CLAUDE.md` wird durch eine fehlende API durchgesetzt, nicht durch Disziplin. Auch keinen hinzufügen, wenn danach gefragt wird — archivieren ist der Weg.

Beim Erweitern der API gilt: keine Python-Spezifika in den HTTP-Vertrag lassen. `/usr/bin/python3` ist von Apple als deprecated markiert; fällt es weg, soll nur die Serverseite ausgetauscht werden müssen.

## Sicherheit

`sicherer_pfad(p, schreiben=False)` in `vault.py` ist die einzige Stelle, die Pfade freigibt — jeder neue Endpunkt muss sie benutzen:

- `os.path.realpath` **zuerst** (Symlinks), Vergleich erst danach. Kein String-Vergleich vor der Auflösung.
- `.git/` und `.tmp-*` immer verboten, Null-Bytes und absolute Pfade → 400
- Schreiben nur bei Endung exakt `.md`; `_system/templates/` und `_system/ui/` sind schreibgeschützt

Jeder `/api/`-Aufruf prüft Cookie oder `X-Vault-Token` mit `hmac.compare_digest`, zusätzlich muss die Remote-Adresse privat sein (`::1`, `127.`, `192.168.`, `10.`, `172.16–31.`). Nach 10 Fehlversuchen pro IP 60 Sekunden Sperre.

`commit.sh` wird mit `subprocess.run(['/bin/bash', …])` aufgerufen, **niemals mit `shell=True`** — die Commit-Nachricht darf nie durch eine Shell laufen. Timeout 60 s, weil `git push` auf den Schlüsselbund warten kann.

## Speichern

Die mtime-Prüfung ist zwingend, nicht optional: Google Drive und Claude Code schreiben in dieselben Dateien. Ohne sie überschreibt ein am iPhone offener Tab stumm eine neuere Fassung. Abweichung über 1 s → 409 mit Serverfassung, die UI zeigt beide und bietet »meine übernehmen« oder »verwerfen«.

Geschrieben wird atomar über `.tmp-<pid>` im selben Ordner plus `os.replace`.

Der Server setzt `aktualisiert: <heute>` — **die einzige Stelle im System, an der das passiert.** `angelegt` bleibt unangetastet; fehlt es, wird es *nicht* ergänzt.

Der Frontmatter-Parser ist selbst geschrieben (kein YAML in der 3.9-stdlib, PyYAML wäre eine Abhängigkeit): nur Top-Level `key: rest`, Wert roh als String, leer → `None`, Reihenfolge der Schlüssel erhalten, Body byte-genau. Keine Listen, keine Verschachtelung — der Vault nutzt beides im Kopf nicht. Nach jeder Änderung am Parser prüfen: `git diff` nach einem Speichern ohne Textänderung darf **genau eine Zeile** zeigen (`aktualisiert`).

## CSS

Eine Datei, ausschließlich Tokens — **nie Rohfarben in Regeln**:

- Flächen `--flaeche-0/1/2`, `--linie`, `--linie-stark`, `--text`, `--text-leise`, `--akzent`, `--akzent-flaeche`, `--warn`, `--warn-flaeche`, `--gut`
- Radien `--r-1: 6px`, `--r-2: 10px`; Abstände auf 4-px-Raster `--s-1` … `--s-8`; `--mass: 72ch` für Fließtext
- Hell/Dunkel über `prefers-color-scheme`, dabei **nur Token-Werte tauschen**, keine Regeln duplizieren
- Bereichsfarbe kommt als `--bereich-farbe` aus den Daten in den Baum, nicht aus dem Stylesheet

Dicht heißt konkret: UI-Basis 14 px, Listenzeilen ~32 px, Dashboard `repeat(auto-fill, minmax(260px, 1fr))`. **Ausnahme Dokumentansicht:** Fließtext 16 px, auf `--mass` begrenzt.

Zurückhaltung: eine Akzentfarbe, maximal drei Schriftgrade pro Ansicht, keine Schatten außer 1-px-Rand, Übergänge nur auf `background-color`/`opacity` in 120 ms, `prefers-reduced-motion` respektiert. Symbole als Inline-SVG-`<symbol>`, kein Icon-Font.

**Tabellen sind der Knackpunkt.** 29 von 33 Notizen enthalten GFM-Tabellen, eine hat sieben Spalten. Regeln: `border-collapse: separate`, nur horizontale 1-px-Trenner, `thead` sticky, Wrapper `div.tabelle-scroll` mit `overflow-x: auto` und Randschatten als Scroll-Hinweis, erste Spalte auf Schmalgeräten sticky. **Keine Card-Umwandlung auf Mobil** — das zerstört breite Tabellen. Der Seitenkörper darf nie horizontal scrollen; breite Inhalte scrollen in ihrem eigenen Container.

## Mobile Checkliste

iOS-Safari bricht auf vier Wegen, alle vier sind abgedeckt und müssen es bleiben:

- **Eingabefelder ≥ 16 px** — darunter zoomt Safari beim Fokus hinein und kommt nicht zurück
- **`100dvh` statt `100vh`** — sonst schneidet die Adressleiste ab
- **`env(safe-area-inset-bottom)`** an Tab-Leiste und Toast
- **`visualViewport`-Listener** hält die Editor-Aktionsleiste über der Tastatur
- **Entwurf alle 3 s in `localStorage`** — Safari verwirft Hintergrundtabs, `beforeunload` feuert dort nicht

## Vendoring

`public/md.js` ist `marked` v4.3.0 (MIT), eine Datei, unverändert von jsDelivr, mit Version, Herkunft, Lizenz und Ladedatum im Kopfkommentar. Regeln für weitere Bibliotheken: nur wenn selbst schreiben deutlich fehleranfälliger wäre, nur eine Datei, nur permissive Lizenz, Kopfkommentar Pflicht, kein CDN zur Laufzeit (die Oberfläche muss offline funktionieren).

## Python 3.9

`/usr/bin/python3` ist 3.9.6. **Kein `match`, keine `X | Y`-Typannotationen**, kein `zoneinfo` ohne Datenpaket, kein `removeprefix` auf älteren Ständen nicht nötig (ab 3.9 vorhanden). Nur Standardbibliothek.

## Testliste vor jedem Commit

Von Hand durchgehen, es gibt keine automatisierten Tests:

1. Dashboard lädt, Zähler plausibel
2. Eine Notiz mit breiter Tabelle öffnen: Tabelle scrollt in ihrem Container, Seite scrollt **nicht** seitlich
3. Eine Notiz mit `../`-Links öffnen: Ziele springen richtig, tote Ziele sind als `.tot` markiert
4. Suche nach einem Begriff, der nur in einer Tabellenzelle steht
5. Speichern ohne Textänderung → `git diff` zeigt genau eine Zeile (`aktualisiert`)
6. Datei von außen ändern, dann im Editor speichern → Konfliktdialog statt stiller Überschreibung
7. `?pfad=../../../etc/passwd` → 403; Aufruf ohne Cookie → 401
8. Fenster unter 900 px: Drawer, Tab-Leiste, Editor-Leiste über der Tastatur
9. Dunkelmodus durchklicken
10. Einen Ordner in `02_Bereiche/` von Hand anlegen → erscheint überall ohne Codeänderung
