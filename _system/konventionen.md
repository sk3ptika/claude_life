# Konventionen

## Dateinamen

- Kleinbuchstaben, Bindestrich als Trenner, keine Leerzeichen
- Keine Umlaute und kein ß im Dateinamen (Sync- und Skript-Probleme). Im Dateiinhalt sind Umlaute normal.
- Datum immer `YYYY-MM-DD`, Woche `YYYY-Www` (ISO-Woche)
- Projektordner: `YYYY-MM_titel` — das Datum ist der Start, nicht die Deadline
- Bereichsordner: nur `titel`, kein Datum

Beispiele:

```
01_Projekte/2026-08_kueche-streichen/
01_Projekte/2026-09_combat-patrol-fertig-bemalt/
02_Bereiche/finanzen/
03_Ressourcen/fotografie/
04_Archiv/2026/2026-03_urlaub-norwegen/
_system/reviews/2026-W33.md
```

## Dateikopf

Jede eigene Markdown-Datei beginnt mit:

```markdown
---
titel: Küche streichen
typ: projekt          # projekt | bereich | notiz | review | entscheidung
status: aktiv         # aktiv | pausiert | erledigt | gestrichen
angelegt: 2026-08-16
deadline: 2026-09-15  # nur bei Projekten
---
```

Der Kopf ist maschinenlesbar. Dadurch lassen sich später Übersichten erzeugen, ohne alles zu lesen.

## Anhänge

Belege, Rechnungen, Fotos, PDFs liegen im jeweiligen Projekt- oder Bereichsordner unter `_anhaenge/`. Nie im Wurzelverzeichnis.

## Was NICHT ins System gehört

- Passwörter und Zugangsdaten → Passwortmanager
- Termine → Kalender. Im System stehen nur Vorbereitungsnotizen.
- Große Medienbibliotheken (RAW-Archiv, Musik) → eigener Ort, im System nur Verweis

Grund: Das System soll durchsuchbar und leichtgewichtig bleiben. Ein 200-GB-Ordner in Google Drive macht den Weekly Review unbrauchbar.

## Backup

Google Drive ist Synchronisation, kein Backup. Eine gelöschte Datei ist auf allen Geräten gelöscht. Der Google-Drive-Papierkorb hält gelöschte Dateien 30 Tage vor und die Versionshistorie reicht 30 Tage zurück — beides ist ein Sicherheitsnetz gegen Versehen, kein Ersatz für ein Backup.

Mindeststandard (3-2-1):

- 3 Kopien der Daten
- auf 2 verschiedenen Medientypen
- 1 Kopie außer Haus

Praktisch: Time Machine auf externe Platte plus ein Cloud-Backup oder eine zweite Platte an anderem Ort. Prüfung monatlich im Review.

## Umgang mit Unsicherheit

Wenn bei einer Ablage- oder Priorisierungsentscheidung mehrere Optionen plausibel sind: Optionen nennen, Empfehlung geben, Unsicherheit als Prozentwert markieren. Nicht stillschweigend die bequemste Variante wählen.
