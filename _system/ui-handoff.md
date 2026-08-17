---
titel: Oberfläche — Prozess für neue Anforderungen und Optimierungen
typ: notiz
status: aktiv
angelegt: 2026-08-17
---

# Oberfläche — Prozess für neue Anforderungen und Optimierungen

Handoff-Dokument. Hält fest, was beim Bau der lokalen Vault-Oberfläche entschieden, verworfen und gelernt wurde, damit ein neuer Chat das nicht neu verhandeln muss. Vor jeder Änderung an `_system/ui/` zuerst hier lesen.

## Wo was steht — die drei Dokumente nicht verwechseln

Es gibt drei Quellen, und sie haben verschiedene Aufgaben. Wer alle drei liest, verschwendet Zeit; wer die falsche liest, baut am Ziel vorbei.

| Dokument | Enthält | Wann lesen |
|---|---|---|
| `.claude/skills/vault-oberflaeche/SKILL.md` | Das **Wie**: Modulkarte, HTTP-API, CSS-Tokens, Mobile-Checkliste, Testliste, LaunchAgent-Befehle, Python-3.9-Grenzen | Immer. Lädt bei UI-Themen automatisch |
| `_system/ui-entwurf.md` | Das **Warum**: Entscheidungstabelle mit Begründungen, Risikoliste, Phasenplan | Vor größeren Umbauten, wenn eine Entscheidung willkürlich aussieht |
| Dieses Dokument | Der **Stand**: was läuft, was fehlt, was Zeit gekostet hat, was bewusst fehlt | Vor jeder Änderung |

Der Entwurf ist ein **historisches** Dokument: er beschreibt den Plan vor der Umsetzung. An drei Stellen weicht der Code begründet ab, siehe „Abweichungen vom Entwurf". Nicht den Entwurf als Sollzustand behandeln.

## Grundprinzip, das nie verhandelt wird

**Im Code steht kein einziger Bereichs- oder Themenname.** Kein `warhammer`, kein `japan`, keine feste Bereichsliste, keine Konfigurationsdatei für Ansichten. Die gesamte Oberfläche entsteht aus Ordnerstruktur und Frontmatter.

Der Prüfstein für jede Erweiterung: ein von Hand angelegter Ordner `02_Bereiche/<name>/` mit `_bereich.md` muss **ohne Codeänderung** in Seitenleiste, Dashboard-Kachel und Bereichsauswahl erscheinen, mit stabiler eigener Farbe. Das wurde am 17.08. mit einem Testbereich `musik` verifiziert; ein erfundenes Feld `lieblingsinstrument` wurde automatisch zum Chip.

Wenn eine Anforderung verlangt, einen Namen aus dem Inhalt in den Code zu holen, ist der Entwurf falsch. Stattdessen ein Frontmatter-Feld einführen und generisch darauf reagieren.

## Stand zu diesem Zeitpunkt (2026-08-17, Commit 9ac941d)

Vollständig umgesetzt und geprüft: alle vier Phasen des Entwurfs. 2.854 Zeilen in `_system/ui/`, keine Abhängigkeit außer `marked` v4.3.0 (MIT, vendored als eine Datei), Laufzeit `/usr/bin/python3` (3.9.6), kein Build-Schritt.

Läuft dauerhaft als LaunchAgent `local.claude-life.vault-ui`, startet beim Anmelden, `KeepAlive` bringt ihn nach einem Absturz binnen 30 s zurück. Log in `~/Library/Logs/vault-ui.log` (außerhalb des Vaults, weil die Startmeldung das Token enthält). Erreichbar unter `http://mbm3.local:4173`, vom iPhone im Heimnetz genauso.

Verifiziert, nicht nur gebaut: alle Notizen lesbar, breite Tabellen scrollen im Container ohne Seiten-Scroll, `../../`-Links treffen, Speichern ohne Textänderung erzeugt genau eine Diff-Zeile (`aktualisiert`), externe Änderung führt zum Konfliktdialog statt zur stillen Überschreibung, Pfad-Traversal und `.git/` → 403, kein Token → 401, `git log --follow` folgt dem Archivieren, Commit-Knopf erzeugt genau einen Commit, Konfliktkopie stoppt ihn mit Exit 2, Commit-Nachricht mit `$(…)` hinterlässt nichts.

## Was bewusst fehlt — nicht „reparieren"

Diese Lücken sind Entscheidungen, keine Versäumnisse. Wer sie schließt, ohne den Grund zu kennen, macht das System schlechter.

- **Kein Delete-Endpunkt.** Harte Regel 1 aus `CLAUDE.md` wird durch die fehlende API erzwungen, nicht durch Disziplin. `DELETE` und `PATCH` antworten 501. Auch auf Zuruf keinen hinzufügen — archivieren ist der Weg.
- **Keine Live-Aktualisierung.** Am 17.08. gemessen: der Server cacht nichts und ist immer aktuell, aber die Browser-Seite ist ein Schnappschuss. Dokumentinhalt, Suche und Rückwärtslinks werden bei jedem Öffnen frisch geholt; Dashboard, Listen, Seitenleiste und Zähler bleiben bis zum Neuladen stehen. **Der Nutzer hat manuelles Neuladen ausdrücklich als ausreichend bezeichnet** — nicht ungefragt Polling oder SSE einbauen.
- **Kein TLS.** iOS verlangt für Self-Signed-Zertifikate eine Profilinstallation. Stattdessen Token plus Heimnetz-Schutz.
- **Kein automatisches Umschreiben fremder Dateien** beim Archivieren. Gebrochene Links werden berichtet, nie still korrigiert — das gehört in `vault-struktur-pruefen` mit Freigabe.
- **Kein YAML-Modul.** Der Frontmatter-Parser ist absichtlich selbst geschrieben und kennt nur Top-Level `key: rest`. Der Vault nutzt im Kopf keine Listen und keine Verschachtelung. Wer Listen einführen will, ändert damit die Konventionen des ganzen Vaults, nicht nur die UI.
- **Keine Konfigurationsdatei für Ansichten oder Bereiche.** Siehe Grundprinzip.

## Was Zeit gekostet hat (Diagnose, nicht nur Befund)

Dieselbe Disziplin wie bei den Bemalrezepten: Fehlschläge stehen hier mit Ursache, damit der nächste Versuch schneller ist.

- **`pkill -f "_system/ui/server.py"` greift nicht immer.** Es trifft nur Prozesse, die mit vollem Pfad gestartet wurden. Wer im UI-Ordner `python3 server.py` startet, hat eine Kommandozeile ohne `_system/ui/`. Zuverlässig ist `kill $(lsof -ti TCP:4173 -sTCP:LISTEN)`. Kostete einen falsch interpretierten Testlauf, weil der alte Prozess weiterlief und der neue still an `Address already in use` starb — **immer prüfen, dass der Port frei ist, bevor ein Test startet.**
- **`mbm3.local` löst auf dem Mac selbst zu `127.0.0.1` auf**, von anderen Geräten zur LAN-Adresse. Wer die iPhone-Sicht testen will, muss `ipconfig getifaddr en0` nehmen. Sonst testet man versehentlich localhost und übersieht genau die Prüfungen, die für Fremdgeräte gelten.
- **Cookies ignorieren Portnummern.** Ein zweiter Server auf einem anderen Port mit anderem Token überschreibt die Anmeldung des ersten. Bei Tests mit zwei Instanzen einplanen.
- **`socket.gethostname()` liefert nicht den Bonjour-Namen**, sondern den DHCP-Namen (hier `mac.fritz.box`). Der `.local`-Name kommt aus `scutil --get LocalHostName`.
- **Apple-Python puffert stdout**, wenn es nicht auf ein Terminal schreibt. Ohne `-u` erscheint die Startmeldung mit dem Token nicht im Log. Sowohl `start.command` als auch die plist starten deshalb mit `-u`.
- **`launchctl` macht `kill` wirkungslos.** Mit `KeepAlive` startet launchd sofort neu. Dauerhaft anhalten nur mit `launchctl bootout gui/$(id -u)/local.claude-life.vault-ui`.
- **Die Kopfzeile drängte Knöpfe aus dem Fenster**, weil Status-Chips ohne `min-width: 0` nicht schrumpfen. Auf Schmalgeräten war das der einzige Verursacher von horizontalem Seiten-Scroll. Nach Layoutänderungen erneut prüfen: kein Element darf über `documentElement.clientWidth` hinausragen, außer innerhalb von `.tabelle-scroll`.
- **SVG-Sprites ohne globale Größenregel** blähen sich auf die Kachelbreite auf. Es gibt jetzt ein `svg { width: 16px; height: 16px }` als Grundmaß.

## Schreibwege immer gegen einen Klon testen

Die wichtigste Technik dieser Sitzung. Anlegen, Archivieren und Commit gegen den echten Vault zu testen hinterlässt Testprojekte und Commits in der Historie, die man nicht mehr sauber entfernen kann (nichts löschen, und gepushte Historie nicht umschreiben). Stattdessen:

```bash
SP=/tmp/vault-test
rm -rf "$SP"; git clone -q ~/"Meine Ablage/Claude_Life" "$SP"
cd "$SP" && git remote remove origin      # sonst pusht commit.sh ins echte Repo
cp -R ~/"Meine Ablage/Claude_Life/_system/ui" _system/ui
/usr/bin/python3 -c "import json; json.dump({'port':4174,'bind':'127.0.0.1','token':'testtoken'}, open('_system/ui/config.json','w'))"
/usr/bin/python3 -u _system/ui/server.py
```

`git remote remove origin` ist nicht optional. Ohne das pusht `commit.sh` im Klon in das echte Repository.

Der Klon eignet sich auch für das, was am echten Vault verboten wäre: vier aktive Projekte anlegen, um die Drei-Projekte-Warnung zu sehen, oder eine Datei `test Konflikt.md` erzeugen, um Exit 2 auszulösen.

Nur-Lese-Tests (Ansichten, Suche, Tabellen, Links) laufen gefahrlos gegen den echten Vault.

## Abweichungen vom Entwurf

Drei Stellen, an denen der Code bewusst vom Plan abweicht:

1. **Rechnername** wird über `scutil --get LocalHostName` ermittelt statt als `mbm3.local` festgeschrieben. Grund siehe oben.
2. **Fehlversuchssperre** gilt nur für `/api/`-Zugriffe, und ein gültiges Cookie kommt immer durch. Der Entwurf hätte die App-Shell mitgesperrt, was zu einer weißen Seite ohne Erklärung führt; und Fehlversuche eines fremden Geräts hätten den Nutzer selbst ausgesperrt.
3. **Heimnetz-Schutz** ist neu und stand nicht im Entwurf. Er wurde nötig, als der LaunchAgent dazukam: der Entwurf verließ sich darauf, dass man „in fremden Netzen nie startet", was bei Autostart nicht mehr in der Hand des Nutzers liegt. Andere Geräte werden nur bedient, wenn die MAC des Standard-Gateways zu `heimnetz_gateway_mac` in `config.json` passt. Details im Skill.

## Bekannte Grenzen und offene Punkte

Nach Nutzen sortiert, mit Einschätzung. Unsicherheitsangaben beziehen sich darauf, ob sich der Aufwand lohnt.

**Latenter Fehler, noch nicht aufgetreten:** Die Checkbox-Zuordnung im Dokument bildet die n-te Checkbox im DOM auf das n-te Regex-Vorkommen im Rohtext ab. Steht eine Checkbox-Zeile in einem Code-Block, rendert `marked` dort keine Checkbox, das Regex zählt sie aber mit — ab dieser Stelle schreibt ein Klick in die falsche Zeile. Am 17.08. geprüft: 56 Checkboxen im Vault, **keine** in einem Code-Block, der Fehler ist also latent. Reparatur bei Bedarf: beim Zählen Code-Blöcke überspringen (Zustandsmaschine über ``` ), oder die Zeilennummer beim Rendern als `data-zeile` an die Checkbox hängen. Zweite Variante ist robuster (~90 % Zuversicht).

**Frontmatter-Formular kann nur bestehende Felder ändern.** Ein neues Feld hinzufügen oder eines entfernen geht im Editor nicht, und Dateien ganz ohne Kopf bekommen kein Formular. Das war Absicht (Risiko 7 im Entwurf: kein unerwartet großer Diff beim ersten Speichern), fühlt sich aber im Alltag als Lücke an. Empfehlung: eine Zeile „Feld hinzufügen" mit freiem Schlüsselnamen, ~25 Zeilen. Lohnt sich, sobald ein neues Feld etabliert werden soll (~75 %).

**Drei Dateien ohne Frontmatter** (`00_Inbox/_so-gehts.md`, `_system/konventionen.md`, `_system/weekly-review.md`) erscheinen im Systemzustand als Befund. Das sind Systemdokumente, keine PARA-Notizen — `vault-struktur-pruefen` hält ausdrücklich fest, dass das kein Befund ist. Die UI weiß das nicht. Sauberste Lösung: die Statusprüfung dieselbe Ausnahme kennen lassen, aber dann steht die Regel an zwei Orten. Alternative: den Systemdokumenten einen Kopf mit `typ: notiz` geben und das Thema verschwindet. Empfehlung: zweite Variante, aber das ist eine Inhaltsentscheidung des Nutzers, nicht der UI (~60 %).

**Suche ist Substring, ohne Rangfolge**, gedeckelt auf 50 Dateien und 5 Treffer je Datei, ohne Operatoren. Bei 37 Notizen völlig ausreichend. Ab etwa 200 Notizen wird Rangfolge nach Trefferzahl und Titelpriorität nötig (~50 %, hängt am Wachstum).

**Der Index wird bei jedem Aufruf komplett neu gescannt.** Bei 37 Dateien sind das 16 KB Antwort und wenige Millisekunden. Ab mehreren hundert Dateien lohnt ein Cache mit mtime-Vergleich pro Datei. Nicht vorher — der aktuelle Code ist deswegen so einfach zu verstehen.

**`/api/doc` berechnet Rückwärtslinks über einen vollen Index-Scan.** Dieselbe Größenordnung, dasselbe Argument.

**PDFs im Posteingang** sind 24 MB in vier Dateien, bewusst nicht im Repo (`*.pdf` gitignored, Ausnahme `_anhaenge/`). Sie sind über `/api/datei` lesbar und im Browser anzeigbar. Wer sie dauerhaft behalten will, verschiebt sie in ein `_anhaenge/` des passenden Bereichs — dann landen sie im Repo, was bei dieser Größe zu bedenken ist.

## Inhaltlicher Befund, noch offen

In `03_Ressourcen/warhammer/wunschliste.md` sind die Zeilen 17–18 (Mattlack, Basing-Material) Tabellenzeilen, die durch den Absatz darüber von ihrer Tabelle getrennt wurden. Sie rendern deshalb als Fließtext mit `|`-Zeichen. Der Renderer ist korrekt, die Notiz hat den Defekt. Gehört in `vault-struktur-pruefen` mit Freigabe des Nutzers, nicht in einen stillen Fix durch die UI.

## Für den nächsten Chat

Ablauf bei einer neuen Anforderung:

1. Dieses Dokument lesen, dann den Skill. Den Entwurf nur, wenn eine bestehende Entscheidung im Weg steht.
2. Prüfen, ob die Anforderung das Grundprinzip verletzt (Themenname im Code). Wenn ja: Frontmatter-Feld vorschlagen statt Sonderfall bauen.
3. Prüfen, ob sie unter „Was bewusst fehlt" steht. Wenn ja: den Grund nennen und nachfragen, statt zu bauen.
4. Bei Schreibwegen einen Klon aufsetzen. Bei Ansichten reicht der echte Vault.
5. Vor dem Commit die Testliste aus dem Skill durchgehen — es gibt keine automatisierten Tests, und das ist bei 2.854 Zeilen ohne Build-Schritt eine bewusste Entscheidung.
6. Diesen Abschnitt „Stand zu diesem Zeitpunkt" aktualisieren und neue Fehlschläge unter „Was Zeit gekostet hat" mit Ursachendiagnose ergänzen. Nichts dort löschen, auch wenn es überholt wirkt.

Bei Ablage- oder Priorisierungsfragen gilt wie überall im Vault: Optionen nennen, Empfehlung geben, Unsicherheit in Prozent. Nicht stillschweigend die bequemste Variante wählen.
