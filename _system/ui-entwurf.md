---
titel: Entwurf der Vault-Oberfläche
typ: notiz
status: erledigt
angelegt: 2026-08-17
---

# Lokale Browser-Oberfläche für den Claude_Life-Vault

## Kontext

Der Vault ist ein PARA-Ablagesystem aus 33 Markdown-Dateien (~130 KB), das bisher ausschließlich über Claude Code und Texteditor gepflegt wird. Es gibt keine Möglichkeit, den Bestand zu überblicken, zu durchsuchen oder unterwegs vom iPhone aus zu bearbeiten. Die Regeln aus `CLAUDE.md` und `_system/konventionen.md` (Templates, Dateinamens-Konvention, nichts löschen, maximal drei aktive Projekte) existieren nur als Text und werden von nichts durchgesetzt.

Ziel ist eine schlanke lokale Oberfläche, die den Vault sichtbar macht und diese Regeln in Bedienelemente übersetzt — plus drei dauerhafte Skills, die dieselbe Logik für Claude Code festhalten, damit UI und Assistent nicht auseinanderlaufen.

Der Vault ist bewusst früh gestartet; Inhalte sind erst beispielhaft (Warhammer, Japan), weitere Bereiche kommen laufend dazu. **Daraus folgt die wichtigste Bauregel: im Code steht kein einziger Bereichs- oder Themenname.** Die gesamte Oberfläche entsteht datengetrieben aus Ordnerstruktur und Frontmatter. Ein neuer Bereichsordner erscheint ohne Codeänderung.

## Getroffene Entscheidungen

| Frage | Entscheidung | Grund |
|---|---|---|
| Laufzeit | `/usr/bin/python3` (3.9.6), nur Standardbibliothek | Ist installiert, Xcode CLT vorhanden. Kein Node, kein Homebrew, kein npm, nichts zu aktualisieren. |
| Zugriff | Bind `0.0.0.0:4173`, Mac + iPhone/iPad im WLAN | Lesezeichen `http://mbm3.local:4173` (die IP 192.168.178.84 kann per DHCP wechseln). |
| Gestaltung | Dichter Überblick | Viel Information pro Bildschirm, aber zurückhaltend im Mittel: eine Akzentfarbe, 1-px-Linien statt Schatten. |
| PDFs | `*.pdf` in `.gitignore`, Ausnahme `_anhaenge/` | Die 6 Regel-PDFs (~39 MB) bleiben lokal und in Drive; das Repo bleibt schlank. |
| Markdown | `marked.min.js` vendored (MIT, ~40 KB, eine Datei) | 29 von 33 Dateien enthalten GFM-Tabellen. Selbst geschrieben wären das 400 Zeilen fehleranfälliges Regex-Geflecht. |
| Editor | Rohes `<textarea>` + generiertes Frontmatter-Formular | Auf iOS-Safari sind contenteditable-Editoren bei Cursor, Diktat und Undo unzuverlässig; ein Textarea nutzt die native Tastatur voll. |

Python 3.9 erlaubt kein `match` und keine `X | Y`-Typannotationen — beim Bauen beachten.

## Dateilayout

Alles neu unter `_system/ui/`. Kein Build-Schritt, keine Paketdatei.

| Datei | Verantwortung |
|---|---|
| `server.py` | HTTP-Server: Routing, Token- und Netzprüfung, statische Auslieferung, Fehler → Statuscodes |
| `vault.py` | Pfadsicherheit, Index-Scan, Frontmatter parsen/serialisieren, atomares Schreiben, Anlegen aus Template, Archivieren, Suche |
| `gitwrap.py` | `_system/commit.sh` aufrufen, Exit-Codes mappen, Konfliktkopien und Repo-Status melden |
| `start.command` | Doppelklick-Starter, gibt LAN-URL und Token aus |
| `config.json` | Port, Bind, Token — beim ersten Start erzeugt, gitignored |
| `public/index.html` | App-Shell plus SVG-`<symbol>`-Sprite |
| `public/app.js` | Hash-Router, Index-State, vier Ansichten, Editor, Suche |
| `public/md.js` | Vendored `marked` — Version, Herkunft und Lizenz im Kopfkommentar |
| `public/style.css` | Designsystem: Tokens, Grundgerüst, Komponenten, Tabellenregeln |

Bewusst **keine** Konfigurationsdatei für Ansichten oder Bereiche — einzige Datenquelle sind Ordner und Frontmatter.

## HTTP-API

Antworten JSON, Pfade immer vault-relativ und NFC-normalisiert.

| Methode | Pfad | Nutzlast / Antwort |
|---|---|---|
| GET | `/api/tree` | Index: je `.md` alle Frontmatter-Felder plus `pfad, mtime, h2[], checkboxen:{offen,gesamt}`; dazu Ordnerbaum und Nicht-md-Dateien. Ein Aufruf, wenige KB, Client hält alles. |
| GET | `/api/doc?pfad=` | `{frontmatter, body, roh, mtime, links[], rueckwaerts[]}` — HTML entsteht im Client |
| PUT | `/api/doc` | `{pfad, frontmatter, body, mtime_erwartet}` → `{mtime}`; **409** samt Serverfassung bei Abweichung |
| POST | `/api/neu` | `{typ, titel, bereich?, deadline?, zielordner?}` → `{pfad, warnung?}`; 409 wenn vorhanden |
| POST | `/api/archivieren` | `{pfad}` → `{neuer_pfad, gebrochene_links[]}` |
| GET | `/api/suche?q=` | `[{pfad, titel, treffer:[{zeile, kontext}]}]`, serverseitig über den In-Memory-Index |
| GET | `/api/status` | Git-Kurzstatus, Konfliktkopien, aktive Projekte, Inbox-Zähler, Dateien ohne Frontmatter, getrackte Dateien > 2 MB |
| POST | `/api/commit` | `{nachricht}` → `{code, stdout, stderr}` |
| GET | `/api/datei?pfad=` | Binärauslieferung (PDF), nur lesend, Content-Type nach Endung |

**Kein Delete-Endpunkt.** Harte Regel 1 wird durch eine fehlende API durchgesetzt, nicht durch Disziplin.

**Pfadsicherheit** — eine Funktion `sicherer_pfad(p, schreiben=False)` in `vault.py`:
`os.path.realpath` auflösen (Symlinks), dann prüfen `aufgeloest == VAULT or aufgeloest.startswith(VAULT + os.sep)`; kein String-Vergleich vor der Auflösung. `.git/` und `.tmp-*` immer verboten. Schreiben nur bei Endung exakt `.md`; `_system/templates/` und `_system/ui/` schreibgeschützt. Null-Bytes und absolute Pfade → 400.

**Token** — 16 Byte hex in `config.json`, beim ersten Start erzeugt und in der Konsole ausgegeben. Erstaufruf `http://mbm3.local:4173/?t=<token>` setzt ein `HttpOnly; SameSite=Strict; Max-Age=90d`-Cookie und leitet auf `/` um, damit das Token aus Adressleiste und Safari-History verschwindet. Jeder `/api/`-Aufruf prüft Cookie oder `X-Vault-Token` mit `hmac.compare_digest`. Zusätzlich muss die Remote-Adresse privat sein (`::1`, `127.`, `192.168.`, `10.`, `172.16–31.`), sonst 403. Nach 10 Fehlversuchen pro IP 60 s Sperre.

## Master-Layout und Designsystem

Vier generische Ansichten, keine davon kennt einen Themennamen:

1. **Dashboard** `#/` — dichtes Kachelraster: aktive Projekte (Deadline-Countdown, Fortschritt aus dem Checkbox-Anteil), Inbox-Zähler (rot bei > 0), je eine Kachel pro Ordner in `02_Bereiche/`, zuletzt geändert, anstehende Fristen (alles mit `deadline` oder `frist`), Systemzustand (Git, Konfliktkopien, Dateien ohne Frontmatter).
2. **Liste** `#/ordner/<pfad>` und `#/filter?typ=…&status=…` — eine einzige Listenkomponente. **Die Spalten werden aus der Treffermenge berechnet:** Frontmatter-Schlüssel, die in ≥ 60 % der Zeilen vorkommen, maximal 5 auf Desktop, 2 auf Mobil. Ein neues Frontmatter-Feld wird dadurch automatisch zur Spalte.
3. **Dokument** `#/doc/<pfad>` — Meta-Chips für *alle* Frontmatter-Felder (auch unbekannte), Inhalt, Inhaltsverzeichnis aus den H2, „Verlinkt von" (Rückwärtslinks), Anhänge aus `_anhaenge/`.
4. **Editor** `#/edit/<pfad>` — Frontmatter-Formular oben, Textarea unten.

Suche als Overlay (Cmd/Ctrl+K, mobil Lupe in der Tab-Leiste).

**CSS**, eine Datei, ~350 Zeilen, ausschließlich Tokens — nie Rohfarben in Regeln:
- Flächen `--flaeche-0/1/2`, `--linie`, `--text`, `--text-leise`, `--akzent`, `--warn`, `--gut`; Radien `--r-1: 6px`, `--r-2: 10px`; Abstände auf 4-px-Raster `--s-1…--s-8`; `--mass: 72ch` für Fließtext.
- Dicht heißt konkret: UI-Basis 14 px, Listenzeilen ~32 px, Kachel-Innenabstand `--s-3`, Dashboard `repeat(auto-fill, minmax(260px, 1fr))`. **Ausnahme Dokumentansicht:** dort Fließtext 16 px auf `--mass` begrenzt, damit lange Notizen lesbar bleiben.
- Hell/Dunkel über `prefers-color-scheme`, nur Token-Werte tauschen, keine Regeln duplizieren.
- **Bereichsfarbe datengetrieben:** `--akzent` aus einem optionalen Frontmatter-Feld `farbe` im jeweiligen `_bereich.md`; fehlt es, wird ein HSL-Ton deterministisch aus dem Bereichsnamen gehasht. Ein neuer Bereich hat sofort eine stabile eigene Farbe, ohne Code und ohne Pflichtpflege.
- Grundgerüst `grid-template-areas`, zwei Zustände: ≥ 900 px Sidebar 240 px / Inhalt / optionale rechte Spalte; < 900 px einspaltig, Sidebar als Drawer, unten Tab-Leiste (Dashboard, Suchen, Neu, Mehr) mit `env(safe-area-inset-bottom)`.
- **Tabellen** sind der Knackpunkt: `border-collapse: separate`, nur horizontale 1-px-Trenner, `thead` sticky, Zahlenspalten rechtsbündig über die Alignment-Klassen von marked, Wrapper `div.tabelle-scroll` mit `overflow-x: auto` und Randschatten als Scroll-Hinweis, erste Spalte auf Schmalgeräten sticky. **Keine** Card-Umwandlung auf Mobil — das zerstört die 7-spaltige Tabelle in `sammlung.md`.
- Zurückhaltung: eine Akzentfarbe, maximal drei Schriftgrade pro Ansicht, keine Schatten außer 1-px-Rand, Übergänge nur auf `background-color`/`opacity` in 120 ms, `prefers-reduced-motion` respektiert. Acht Inline-SVG-`<symbol>`, kein Icon-Font.

**HTML-Nachbearbeitung in `app.js`** (~40 Zeilen): relative `.md`-Links **relativ zum Quellverzeichnis** auflösen (die Notizen nutzen `../../`) und auf `#/doc/<pfad>` umschreiben, gegen den Index prüfen, tote Ziele mit Klasse `.tot` markieren; PDF-Ziele auf `/api/datei`; externe Links `target=_blank rel=noopener`; jede `<table>` wrappen.

## Speichern, Anlegen, Archivieren, Git

**mtime-Prüfung ist zwingend** — Google Drive und Claude Code schreiben in dieselben Dateien; ohne sie überschreibt ein am iPhone offener Tab stumm eine neuere Fassung.

`PUT /api/doc`: `os.stat` prüfen, Abweichung > 1 s → 409 mit Serverfassung, UI zeigt beide Fassungen und bietet „meine übernehmen" oder „verwerfen". Der Server setzt `aktualisiert: <heute>` — **die einzige Stelle im System, an der das passiert.** `angelegt` bleibt unangetastet; fehlt es, wird es *nicht* auf heute gesetzt. Atomar schreiben über `<datei>.tmp-<pid>` im selben Ordner plus `os.replace`.

**Frontmatter-Parser selbst geschrieben** (kein YAML-Modul in 3.9 stdlib, und PyYAML wäre eine Abhängigkeit): nur Top-Level `key: rest`, Wert roh als String, leer → `None`. Der Vault nutzt im Kopf keine Listen und keine Verschachtelung. Beim Serialisieren werden Werte mit `:`, führendem `#` oder Anführungszeichen gequotet — Titel enthalten Em-Dashes und Nicht-ASCII. Reihenfolge der Schlüssel erhalten, Body byte-genau.

`POST /api/neu`: Template aus `_system/templates/` lesen, `{{titel}}` ersetzen, Kopf füllen. Slug: NFD zerlegen, ä→ae/ö→oe/ü→ue/ß→ss, Diakritika entfernen, `[^a-z0-9]+`→`-`. Ziele: Projekt → `01_Projekte/YYYY-MM_<slug>/_projekt.md`, Bereich → `02_Bereiche/<slug>/_bereich.md`, Review → `_system/reviews/<YYYY-Www>.md`, Entscheidung/Notiz → gewählter Ordner. Beim vierten aktiven Projekt liefert die Antwort `warnung` und die UI verlangt eine zweite Bestätigung — warnen, nicht blockieren, so wie `CLAUDE.md` es formuliert.

`POST /api/archivieren`: `status: erledigt`, `aktualisiert: heute`, dann nach `04_Archiv/<Jahr>/` verschieben — `git mv` falls getrackt, sonst `os.rename`. Danach Rückwärtslink-Prüfung; gebrochene Links gehen als Liste in die Antwort und werden als To-do angezeigt. Bewusst **kein** automatisches Umschreiben fremder Dateien — das gehört in den Struktur-Skill mit Freigabe.

`POST /api/commit`: `subprocess.run(['/bin/bash', COMMIT_SH, nachricht], cwd=VAULT, timeout=60)` — **ohne `shell=True`**, damit die Nachricht nie durch eine Shell läuft. Exit 0 → Erfolg mit Log; Exit 2 → Konfliktkopien, stderr-Pfade als roter Kasten, Button gesperrt (und `/api/status` zeigt die Bedingung schon vorher, damit man nicht erst am Commit scheitert); sonst stderr anzeigen, nichts automatisch reparieren. Timeout 60 s, weil `git push` auf den Schlüsselbund warten kann. Keine Credentials im Server — Authentifizierung bleibt Sache des Nutzers.

`.gitignore` ergänzen:
```
*.pdf
!**/_anhaenge/*.pdf
_system/ui/config.json
*.tmp-*
```

## Die drei Skills

Je eine `SKILL.md` unter `.claude/skills/<name>/`:

**`vault-arbeiten`** — `description: PARA-Ablage im Claude_Life-Vault — Notizen, Projekte, Bereiche und Reviews anlegen, einsortieren, archivieren und committen. Nutze dies bei jeder Änderung im Vault: neue Notiz, Projekt starten, Inbox leeren, Weekly Review, etwas ist erledigt, oder die Frage "wohin gehört das".`
Inhalt: Entscheidungsbaum Ordnerwahl (im Zweifel Inbox), Pflichtfelder je `typ`, Slug-Regeln inklusive Umlaut-Mapping, Template-Pflicht, Drei-Projekte-Grenze mit fertig formulierter Warnung, Archivieren statt Löschen (auch auf Zuruf), Weekly-Review-Ablauf, `commit.sh` mit Exit-2-Behandlung, Ton-Regel (Optionen, Empfehlung, Unsicherheit in Prozent).

**`vault-oberflaeche`** — `description: Die lokale Vault-Oberfläche unter _system/ui/ starten, ändern und erweitern — Server, HTTP-API, Ansichten, CSS-Tokens, Editor. Nutze dies bei "UI", "Oberfläche", "Dashboard", "Server läuft nicht", neuem Ansichtstyp oder Designänderung.`
Inhalt: Start/Stopp und LAN-Zugriff, Modulkarte mit je einer Zeile, die harte Regel „keine Bereichs- oder Themennamen im Code", wie ein neues Frontmatter-Feld automatisch zu Chip und Spalte wird, Token-Liste plus „nur Tokens, nie Rohfarben", Mobile-Checkliste (Eingabefelder ≥ 16 px, `dvh`, safe-area, `visualViewport`), Vendoring-Regeln, manuelle Testliste vor jedem Commit, Python-3.9-Einschränkungen.

**`vault-struktur-pruefen`** — `description: Den Vault auf Struktur prüfen und reparieren — fehlendes oder falsches Frontmatter, Dateinamen mit Umlauten oder Leerzeichen, tote relative Links, verwaiste Ordner, Sync-Konfliktkopien, zu große getrackte Dateien. Nutze dies bei "prüf mal", "aufräumen", vor dem Weekly Review oder wenn Links ins Leere gehen.`
Inhalt: Prüfliste mit konkreten Read-only-Befehlen, Reparaturregeln inklusive „`angelegt` aus Git-Historie oder `birthtime` rekonstruieren, niemals auf heute setzen", Umbenennen immer mit `git mv` plus Umschreiben eingehender Links, NFD/NFC-Hinweis, nie löschen sondern nach `04_Archiv/` verschieben, Ausgabe als Tabelle „Datei | Befund | Vorschlag", erst zeigen, dann auf Freigabe ändern.

## Phasen

Jede Phase ist für sich lauffähig und vorführbar.

**Phase 0 — Aufräumen (~10 Min).** `.gitignore` ergänzen, die 5 offenen Änderungen committen, `_system/ui/` anlegen.
*Verifikation:* `git status` listet keine PDFs mehr; `commit.sh` läuft mit Exit 0 durch.

**Phase 1 — Lesen.** `server.py`, `vault.py`, Token, Pfadsicherheit, `/api/tree`, `/api/doc`, `/api/datei`; Client mit Dashboard, Ordnerliste, Dokumentansicht, marked, Tabellen-CSS, Tokens.
*Verifikation:* alle 33 Dateien vom iPhone über `http://mbm3.local:4173` erreichbar; die 7-spaltige Tabelle in `sammlung.md` sauber scrollbar; die `../../`-Links in `_projekt.md` springen korrekt; `?pfad=../../../etc/passwd` liefert 403; Aufruf ohne Cookie liefert 401.

**Phase 2 — Suchen und Bearbeiten.** `/api/suche` mit Overlay; Editor mit Frontmatter-Formular, Textarea, Mobile-Toolbar, Vorschau; `PUT /api/doc` mit 409, atomarem Schreiben, serverseitigem `aktualisiert`.
*Verifikation:* dieselbe Datei gleichzeitig auf iPhone und Mac ändern → Konfliktdialog statt stiller Überschreibung; Suche findet einen Begriff aus einer Tabellenzelle; `git diff` nach dem Speichern zeigt genau die geänderten Zeilen plus `aktualisiert` — keine Frontmatter-Umsortierung, keine Zeilenende-Änderung.

**Phase 3 — Anlegen, Archivieren, Commit.** `/api/neu` mit Drei-Projekte-Warnung, `/api/archivieren` mit Linkbericht, `/api/status`, `/api/commit`.
*Verifikation:* Testprojekt anlegen → `01_Projekte/2026-08_test-…/_projekt.md` korrekt benannt und gefüllt; archivieren → liegt in `04_Archiv/2026/`, `git log --follow` zeigt die Historie; Commit-Button erzeugt genau einen Commit; eine von Hand angelegte `test Konflikt.md` führt zu Exit 2 mit sichtbarer Pfadliste im UI.

**Phase 4 — Feinschliff und Skills.** Interaktive Checkboxen, Rückwärtslinks, Bereichsfarben, Dark-Mode-Durchgang, `start.command`, die drei `SKILL.md`.
*Verifikation:* einen Ordner `02_Bereiche/musik/` mit `_bereich.md` von Hand anlegen → erscheint **ohne Codeänderung** in Sidebar, Dashboard-Kachel und Bereichs-Auswahl des Anlege-Dialogs, mit eigener stabiler Akzentfarbe. Jeder Skill wird durch einen typischen Alltagssatz ausgelöst.

## Risiken

1. **Google Drive schreibt in dieselben Dateien** — kann eine Datei ersetzen, während der Editor eine alte Fassung hält. Gegenmittel: mtime-Prüfung, atomares `os.replace`, `*.tmp-*` in `.gitignore`, Konfliktkopien in `/api/status` sichtbar machen, bevor der Commit daran scheitert.
2. **NFD/NFC** — macOS liefert Verzeichnisnamen zerlegt (ä = a + U+0308), Markdown-Links stehen in NFC. Vergleiche scheitern still und erzeugen „tote" Links, die niemand erklären kann. Alle Pfade vor Vergleich und Index-Schlüsselbildung mit `unicodedata.normalize('NFC', …)`. Betrifft `_anhaenge/`- und PDF-Namen, da normale Dateinamen laut Konvention ASCII sind.
3. **Token im Klartext im WLAN** — HTTP ohne TLS. Zu Hause akzeptabel, in fremden Netzen nie starten. Kein Self-Signed-TLS, weil iOS dafür eine Profilinstallation verlangt.
4. **iOS-Safari beim Bearbeiten** — Zoom bei Eingabefeldern < 16 px, `100vh` unter der Adressleiste, Tastatur verdeckt Buttons, verworfene Hintergrundtabs. Gegenmittel: `100dvh`, `visualViewport`-Listener für die Aktionsleiste, Entwurf alle 3 s in `localStorage` (`beforeunload` hilft dort nicht).
5. **Apple-Python** — `/usr/bin/python3` ist von Apple als deprecated markiert. Langsam bewegliches Risiko; falls es entfällt, ist der Client unverändert weiterverwendbar und nur `server.py`/`vault.py`/`gitwrap.py` wechseln die Laufzeit. Deshalb keine Python-Spezifika im HTTP-Vertrag.
6. **Parallelität mit Claude Code** — beide schreiben mit denselben Rechten in denselben Vault; die mtime-Prüfung fängt nur die UI-Seite. Praktische Regel im Skill: nicht gleichzeitig im UI und in Claude Code dieselbe Datei bearbeiten.
7. **Unerwartet großer Diff beim ersten Speichern** — ergänzt wird nur, was im Formular sichtbar war. Die drei Dateien ganz ohne Frontmatter werden nicht automatisch umgebaut, sondern über den Struktur-Skill mit Freigabe.
8. **Archivieren bricht relative Links** — unvermeidlich beim Verschieben über Ordnerebenen, deshalb Bericht statt stillem Umschreiben.

## Berührte Bestandsdateien

Nur zwei: `.gitignore` (vier Zeilen ergänzen) und `_system/weekly-review.md` (verweist auf eine `SKILL.md`, die es nicht gibt — Altbestand aus der Zeit vor `CLAUDE.md`, in Phase 4 auf den neuen Skill umbiegen). `_system/commit.sh` und die Templates bleiben unverändert.
