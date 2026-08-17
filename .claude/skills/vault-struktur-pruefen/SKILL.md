---
name: vault-struktur-pruefen
description: Den Vault auf Struktur prüfen und reparieren — fehlendes oder falsches Frontmatter, Dateinamen mit Umlauten oder Leerzeichen, tote relative Links, verwaiste Ordner, Sync-Konfliktkopien, zu große getrackte Dateien. Nutze dies bei "prüf mal", "aufräumen", vor dem Weekly Review oder wenn Links ins Leere gehen.
---

# Struktur prüfen und reparieren

Zwei Phasen, strikt getrennt: **erst vollständig prüfen und zeigen, dann auf Freigabe ändern.** Nie in einem Zug prüfen und reparieren — die meisten Befunde haben mehrere richtige Antworten, und die Wahl gehört dem Nutzer.

Ausgabe immer als Tabelle:

| Datei | Befund | Vorschlag |
|---|---|---|

Danach: Optionen nennen, Empfehlung geben, Unsicherheit als Prozentwert. Erst nach Freigabe ändern.

## Prüfliste

Alle Befehle sind read-only. Aus dem Vault-Wurzelverzeichnis ausführen.

**1. Dateien ohne Frontmatter**

```bash
find . -name "*.md" -not -path "./.git/*" -exec sh -c 'head -1 "$1" | grep -q "^---$" || echo "$1"' _ {} \;
```

**2. Dateinamen mit Umlauten, ß, Leerzeichen oder Großbuchstaben**

```bash
find . -name "*.md" -not -path "./.git/*" | grep -Ev '^\./([A-Za-z0-9_]+/)*[a-z0-9._-]+\.md$'
```

Erwartete Ausnahmen: `CLAUDE.md`, `README.md`, `_system/`-Dateien mit Bindestrich, `_projekt.md`, `_bereich.md`.

**3. Tote relative Links**

```bash
grep -rn --include="*.md" -oE '\[[^]]*\]\([^)]+\)' . | grep -v '](http' | grep -v '](#'
```

Jedes Ziel relativ zum **Quellverzeichnis** auflösen, nicht zur Wurzel — die Notizen nutzen `../../`. Dann auf Existenz prüfen. Die Oberfläche macht dasselbe und markiert tote Ziele mit der Klasse `.tot`; ein Blick in die Dokumentansicht ist oft schneller als das Skript.

**4. Ordner ohne Kopfdatei**

Jeder Ordner in `01_Projekte/` braucht `_projekt.md`, jeder in `02_Bereiche/` braucht `_bereich.md`.

```bash
for d in 01_Projekte/*/; do [ -f "$d/_projekt.md" ] || echo "fehlt: $d_projekt.md"; done
for d in 02_Bereiche/*/; do [ -f "$d/_bereich.md" ] || echo "fehlt: $d_bereich.md"; done
```

**5. Sync-Konfliktkopien**

```bash
find . -path ./.git -prune -o \( -name '*(1)*' -o -name '*conflicted copy*' -o -name '*Konflikt*' \) -print
```

Solange hier etwas steht, bricht `commit.sh` mit Exit 2 ab. `/api/status` der Oberfläche zeigt denselben Befund vorab.

**6. Zu große getrackte Dateien**

```bash
git ls-files -z | xargs -0 -I{} sh -c 'test -f "{}" && find "{}" -size +2000k' 2>/dev/null
```

**7. Regelverstöße aus `CLAUDE.md`**

- Mehr als drei Dateien mit `typ: projekt` und `status: aktiv`
- Nicht-leere `00_Inbox/` (kein Fehler, aber eine Beobachtung für den Review)
- Anhänge außerhalb von `_anhaenge/`
- Frontmatter-Datumsfelder, die nicht `YYYY-MM-DD` entsprechen

**8. Inhaltliche Formdefekte**

Tabellenzeilen, die durch einen Absatz von ihrer Tabelle getrennt wurden, rendern als Fließtext mit `|`-Zeichen. Erkennbar an Zeilen, die mit `|` beginnen und deren Vorgängerzeile nicht leer und nicht selbst eine Tabellenzeile ist.

## Reparaturregeln

**Fehlendes `angelegt` rekonstruieren, niemals auf heute setzen:**

```bash
git log --follow --diff-filter=A --format=%ad --date=short -- <datei> | tail -1
```

Ist die Datei ungetrackt, `stat -f %SB -t %F <datei>` (birthtime) nehmen. Erst wenn beides fehlschlägt, den Nutzer fragen. Ein falsches `angelegt` ist schlimmer als ein fehlendes: es sieht richtig aus.

**Umbenennen immer mit `git mv`**, nie mit `mv` bei getrackten Dateien — sonst reißt `git log --follow` ab. Danach **alle eingehenden Links umschreiben**, im selben Arbeitsgang:

```bash
grep -rln --include="*.md" "<alter-name>" .
```

**Fehlendes Frontmatter ergänzen:** nur die Pflichtfelder des passenden `typ` (siehe [vault-arbeiten](../vault-arbeiten/SKILL.md)), Reihenfolge wie in `_system/konventionen.md`, Body byte-genau unverändert lassen. Bei Dateien, die erkennbar Systemdokumentation sind (`_system/konventionen.md`, `_system/weekly-review.md`, `README.md`, `CLAUDE.md`), ist fehlendes Frontmatter **kein Befund** — sie sind keine Notizen im PARA-Sinn. Vor dem Ergänzen fragen, in welche Kategorie eine Datei fällt.

**NFD/NFC:** macOS liefert Verzeichnisnamen zerlegt (ä = `a` + U+0308), Markdown-Links stehen in NFC. Vergleiche scheitern dann still und erzeugen »tote« Links, die niemand erklären kann. Vor jedem Pfadvergleich und jeder Index-Schlüsselbildung `unicodedata.normalize('NFC', …)`. Betrifft vor allem `_anhaenge/`- und PDF-Namen; normale Dateinamen sind laut Konvention ASCII.

Prüfen, ob ein Name zerlegt ist:

```bash
/usr/bin/python3 -c "import sys,unicodedata; [print(unicodedata.normalize('NFC',a)==a, repr(a)) for a in sys.argv[1:]]" <datei>
```

**Nie löschen.** Auch nicht bei offensichtlichem Müll, auch nicht auf Zuruf. Nach `04_Archiv/<Jahr>/` verschieben und den Befund melden. Das gilt ausdrücklich auch für Sync-Konfliktkopien: die schlechtere Fassung wandert ins Archiv, sie wird nicht entfernt.

**Fremde Dateien nicht stillschweigend anfassen.** Wenn eine Reparatur an Datei A Änderungen in B, C, D nach sich zieht, alle vier vorher zeigen.

## Nach der Reparatur

1. `git diff` durchsehen — jede Zeile erklärbar?
2. Prüfliste erneut laufen lassen: sind neue Befunde entstanden?
3. Committen über `_system/commit.sh` mit einer Nachricht, die den Befund benennt, nicht die Aktion
   (»Frontmatter in drei Ressourcennotizen ergänzt«, nicht »Fixes«)
