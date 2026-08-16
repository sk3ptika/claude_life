---
titel: Claude_Life — Systemübersicht
typ: notiz
angelegt: 2026-08-16
---

# Claude_Life

Privates Ablage- und Organisationssystem nach PARA.
Ort: `~/Meine Ablage/Claude_Life` (Google Drive), in Claude als vertrauenswürdiger Ordner freigegeben.
Der vollständige Pfad lautet `~/Library/CloudStorage/GoogleDrive-wengenroth@gmail.com/Meine Ablage/Claude_Life`; `~/Meine Ablage` ist die von Google Drive angelegte Verknüpfung im Benutzerordner und der Pfad, mit dem hier gearbeitet wird.

## Aufbau

| Ordner | Zweck | Frage zur Zuordnung |
|---|---|---|
| `00_Inbox` | Alles Ungeklärte | — |
| `01_Projekte` | Zeitlich begrenzt, definiertes Ergebnis | Gibt es ein Ergebnis mit Zeitpunkt? |
| `02_Bereiche` | Dauerhafte Verantwortung | Halte ich hier einen Standard ohne Enddatum? |
| `03_Ressourcen` | Wissen, Referenzen, Interessen | Brauche ich das irgendwann als Nachschlagewerk? |
| `04_Archiv` | Abgeschlossenes, nach Jahr | Ist das erledigt? |
| `_system` | Templates, Konventionen, Review-Protokolle | — |

## Die drei Regeln

1. **Inbox wöchentlich auf null.** Ohne das verfällt jedes System.
2. **Nichts löschen, alles archivieren.** `04_Archiv/<Jahr>/`.
3. **Maximal drei aktive Projekte.** Mehr führt privat zu null Abschlüssen.

## Erste Schritte

1. `_system/konventionen.md` einmal lesen — fünf Minuten.
2. Ersten Weekly Review terminieren, fester Wochentag, 45 Minuten.
3. Alles, was gerade im Kopf ist, als je eine Datei in `00_Inbox/` werfen. Unsortiert, roh.
4. Beim ersten Review sortieren.

Schritt 3 nicht überspringen. Ein leeres System bleibt leer.

## Hinweis zu .keep-Dateien

In noch leeren Ordnern liegt eine Datei `.keep`. Sie hält den Ordner am Leben und kann gelöscht werden, sobald dort echte Dateien liegen.

## Bereiche

Vorbelegt: Finanzen, Gesundheit, Wohnung, Familie/Freunde, Technik, Warhammer, Fotografie.
Jeder Bereich braucht eine `_bereich.md` mit dem Standard, den du dort halten willst. Vorlage in `_system/templates/bereich.md`. Bereiche ohne definierten Standard sind nur Ordner.

## Templates

In `_system/templates/`:

- `projekt.md` — neues Projekt
- `bereich.md` — neuer Bereich
- `review.md` — Weekly Review
- `entscheidung.md` — Entscheidungsvorlage

## Hobby-Ablagen

- `03_Ressourcen/warhammer/` — Sammlung, Farbrezepte, Spielprotokolle
- `03_Ressourcen/fotografie/` — Film-Simulation-Rezepte, Kamera-Notizen

## Backup

Google Drive ist Synchronisation, kein Backup. Gelöscht ist überall gelöscht. Siehe `_system/konventionen.md`, Abschnitt Backup.
