---
name: vault-arbeiten
description: PARA-Ablage im Claude_Life-Vault — Notizen, Projekte, Bereiche und Reviews anlegen, einsortieren, archivieren und committen. Nutze dies bei jeder Änderung im Vault: neue Notiz, Projekt starten, Inbox leeren, Weekly Review, etwas ist erledigt, oder die Frage "wohin gehört das".
---

# Im Vault arbeiten

Sprache ist durchgehend Deutsch: Notizen, Commit-Nachrichten, Antworten.

## Wohin gehört es

Die Frage in dieser Reihenfolge stellen, die erste zutreffende gewinnt:

1. Gibt es ein **Ergebnis mit Zeitpunkt**? → `01_Projekte/YYYY-MM_<slug>/`
2. Halte ich hier einen **Standard ohne Enddatum**? → `02_Bereiche/<slug>/`
3. Brauche ich das als **Nachschlagewerk**? → `03_Ressourcen/<thema>/`
4. Ist das **erledigt**? → `04_Archiv/<Jahr>/`
5. Sonst → `00_Inbox/`

Im Zweifel `00_Inbox/`. Die Zuordnung passiert im Weekly Review, nicht beim Anlegen. Eine Notiz falsch abzulegen kostet Minuten, eine erfundene Ordnerstruktur kostet Monate.

Bei mehreren plausiblen Zielen: Optionen nennen, eine Empfehlung geben, Unsicherheit als Prozentwert. Nicht stillschweigend die bequemste Variante wählen.

## Pflichtkopf

Jede neue Markdown-Datei beginnt mit Frontmatter. Felder je `typ`:

| typ | Pflicht | Zusätzlich |
|---|---|---|
| `projekt` | titel, typ, status, angelegt, deadline | bereich |
| `bereich` | titel, typ, status, angelegt | pruefrhythmus, farbe |
| `notiz` | titel, typ, status, angelegt | bereich, aktualisiert |
| `review` | titel, typ, angelegt | — |
| `entscheidung` | titel, typ, status, angelegt, frist | — |

`status`: `aktiv` | `pausiert` | `erledigt` | `gestrichen`. Datum immer `YYYY-MM-DD`, Woche `YYYY-Www` (ISO).

**`angelegt` niemals nachträglich auf heute setzen.** Fehlt es, wird es aus der Git-Historie oder `birthtime` rekonstruiert — siehe [vault-struktur-pruefen](../vault-struktur-pruefen/SKILL.md).

`aktualisiert` setzt die Oberfläche beim Speichern selbst. Von Hand nur dann pflegen, wenn ohne UI gearbeitet wird.

Das optionale Feld `farbe` in `_bereich.md` (etwa `farbe: #2f6b45`) bestimmt die Akzentfarbe des Bereichs in der Oberfläche. Fehlt es, wird eine stabile Farbe aus dem Ordnernamen abgeleitet — kein Grund, es zu pflegen.

## Dateinamen

Kleinbuchstaben, Bindestriche, **keine Umlaute, kein ß, keine Leerzeichen**. Im Dateiinhalt sind Umlaute normal und erwünscht.

Umlaut-Mapping beim Ableiten des Slugs aus dem Titel: `ä→ae`, `ö→oe`, `ü→ue`, `ß→ss`, danach übrige Diakritika entfernen, alles Nicht-Alphanumerische zu `-`, Mehrfach-Bindestriche zusammenfassen, Ränder trimmen.

```
"Ösenzange kaufen?"      → oesenzange-kaufen
"Küche streichen — Maß"  → kueche-streichen-mass
"Blood Angels (klassisch)" → blood-angels-klassisch
```

Ordner: Projekte `YYYY-MM_titel` (Startmonat, **nicht** Deadline), Bereiche nur `titel`, Reviews `_system/reviews/YYYY-Www.md`.

Anhänge in `_anhaenge/` im jeweiligen Projekt- oder Bereichsordner, nie im Wurzelverzeichnis. PDFs dort sind die einzige Ausnahme von `*.pdf` in `.gitignore`.

## Templates sind Pflicht

Neue Projekte, Bereiche, Reviews und Entscheidungen immer aus `_system/templates/` ableiten, nie frei formulieren. Die Templates enthalten die Fragen, die das System tragen (»Woran erkenne ich, dass das fertig ist?«). Wer sie umformuliert, verliert genau diese Fragen.

`{{titel}}` im Template durch den Titel ersetzen, den Kopf füllen, Rest unverändert lassen. Für `typ: notiz` gibt es kein Template — dort nur der Pflichtkopf und eine H1.

## Maximal drei aktive Projekte

Beim Anlegen eines vierten Projekts mit `status: aktiv` **warnen, nicht blockieren**. Formulierung:

> Es laufen bereits drei aktive Projekte: <Titel>. Die Regel lautet maximal drei — mehr heißt in der Praxis, dass keines vorankommt. Empfehlung: erst eines abschließen oder auf `pausiert` setzen. Soll ich es trotzdem anlegen?

Erst nach ausdrücklicher Bestätigung anlegen. Projekte auf `pausiert` oder `erledigt` zählen nicht mit.

## Nichts löschen

**Auch auf Zuruf nicht löschen.** Erledigtes wandert nach `04_Archiv/<Jahr>/`:

1. `status: erledigt` und `aktualisiert: <heute>` in den Kopf
2. Verschieben mit `git mv` (getrackt) oder `mv` (ungetrackt). Bei `_projekt.md`/`_bereich.md` wandert der **ganze Ordner**.
3. Eingehende Links prüfen und melden — Verweise auf den alten Ort brechen beim Verschieben über Ordnerebenen zwangsläufig.
4. Fremde Dateien **nicht** stillschweigend umschreiben. Liste zeigen, Freigabe abwarten.

Wenn jemand „lösch das" sagt: archivieren, dann nachfragen. Die Oberfläche unter `_system/ui/` hat aus demselben Grund keinen Delete-Endpunkt.

## Weekly Review

Vollständige Checkliste in `_system/weekly-review.md`. Kurzform:

1. `00_Inbox/` auf **null** — nicht »fast null«
2. Jedes Projekt: Ergebnis noch gültig? Nächster Schritt in einem Zug erledigbar? Termin? Fortschritt diese Woche?
3. Kein Fortschritt in zwei Reviews hintereinander → entscheiden: neu schneiden, pausieren oder streichen. »Weiterlaufen lassen« ist keine Option.
4. Jeden Bereich gegen seinen Standard halten
5. Protokoll als `_system/reviews/YYYY-Www.md` aus `_system/templates/review.md`
6. Danach pushen

**Kein Beschönigen.** Die Beobachtungszeile im Protokoll (»was hat diese Woche das System gestört?«) ist der Zweck der Übung. Wenn dort dreimal dasselbe steht, ist das ein Befund und kein Zufall.

## Commit und Push

Immer über das Script, nie über einzelne Git-Befehle:

```bash
~/"Meine Ablage/Claude_Life/_system/commit.sh" "Nachricht"
```

Exit-Codes:

- **0** — committet und gepusht (oder es gab nichts zu tun)
- **1** — kein Git-Repository. Reparaturweg in `_system/git.md`
- **2** — **Google-Drive-Konfliktkopien gefunden.** Nichts wurde committet. Die Pfade aus stderr zeigen, im Finder prüfen, die schlechtere Fassung nach `04_Archiv/` schieben oder inhaltlich zusammenführen. Nicht automatisch aufräumen — Konfliktkopien entstehen, weil zwei Geräte dieselbe Datei geändert haben, und welche Fassung gilt, kann nur der Nutzer wissen.

Authentifizierung ist Sache des Nutzers. Keine Tokens oder Passwörter eingeben. Regel: nach jedem Weekly Review pushen.

## Nicht ins System

Passwörter und Zugangsdaten (→ Passwortmanager), Termine (→ Kalender, hier nur Vorbereitungsnotizen), große Medienbibliotheken (hier nur Verweis).

## Parallelbetrieb

Die Oberfläche unter `_system/ui/`, Google Drive und Claude Code schreiben mit denselben Rechten in dieselben Dateien. Praktische Regel: **nicht gleichzeitig im UI und in Claude Code dieselbe Datei bearbeiten.** Die mtime-Prüfung der Oberfläche fängt nur ihre eigene Seite ab.
