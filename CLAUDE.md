---
titel: Arbeitsanweisung für Claude
typ: notiz
angelegt: 2026-08-16
---

# CLAUDE.md

Dies ist kein Software-Repo, sondern ein privates Ablagesystem nach PARA. Inhalt sind Markdown-Notizen. Es gibt nichts zu bauen und nichts zu testen.

**Sprache: Deutsch.** Notizen, Commit-Nachrichten und Antworten auf Deutsch.

## Wo etwas hingehört

| Ordner | Zweck | Entscheidungsfrage |
|---|---|---|
| `00_Inbox` | Ungeklärtes, roh | — |
| `01_Projekte` | Zeitlich begrenzt, definiertes Ergebnis | Gibt es ein Ergebnis mit Zeitpunkt? |
| `02_Bereiche` | Dauerhafte Verantwortung | Halte ich hier einen Standard ohne Enddatum? |
| `03_Ressourcen` | Wissen, Referenzen, Interessen | Brauche ich das als Nachschlagewerk? |
| `04_Archiv` | Abgeschlossenes, nach Jahr | Ist das erledigt? |
| `_system` | Templates, Konventionen, Reviews | — |

Im Zweifel `00_Inbox/` — die Zuordnung passiert im Weekly Review, nicht beim Anlegen.

## Harte Regeln

1. **Nichts löschen.** Erledigtes wandert nach `04_Archiv/<Jahr>/`. Auch auf Zuruf nicht löschen, sondern archivieren und nachfragen.
2. **Maximal drei aktive Projekte.** Beim Anlegen eines vierten darauf hinweisen.
3. **Inbox wöchentlich auf null.**

## Dateikonventionen

- Dateinamen: Kleinbuchstaben, Bindestriche, **keine Umlaute, kein ß, keine Leerzeichen**. Im Dateiinhalt sind Umlaute normal.
- Datum `YYYY-MM-DD`, Woche `YYYY-Www` (ISO)
- Projektordner `YYYY-MM_titel` (Startdatum, nicht Deadline), Bereichsordner nur `titel`
- Jede neue Markdown-Datei beginnt mit dem Frontmatter-Kopf aus `_system/konventionen.md`:
  `titel`, `typ` (projekt|bereich|notiz|review|entscheidung), `status`, `angelegt`, bei Projekten `deadline`
- Anhänge in `_anhaenge/` im jeweiligen Projekt-/Bereichsordner, nie im Wurzelverzeichnis

Neue Projekte, Bereiche, Reviews und Entscheidungen immer aus `_system/templates/` ableiten, nicht frei formulieren.

## Nicht ins System

Passwörter und Zugangsdaten (→ Passwortmanager), Termine (→ Kalender, hier nur Vorbereitungsnotizen), große Medienbibliotheken (hier nur Verweis).

## Git

Repo liegt in einem Google-Drive-Ordner, Remote ist `https://github.com/sk3ptika/claude_life.git` (privat, HTTPS + Token im Schlüsselbund). Details und Reparaturweg bei Drive-Schäden: `_system/git.md`.

Commit und Push laufen über das Script, nicht über einzelne Git-Befehle:

```bash
~/"Meine Ablage/Claude_Life/_system/commit.sh" "Nachricht"
```

Es bricht ab, wenn es Drive-Konfliktkopien findet. Regel: nach jedem Weekly Review pushen.

Authentifizierung ist immer Sache des Nutzers — keine Tokens oder Passwörter eingeben.

## Ton

Bei Ablage- oder Priorisierungsentscheidungen mit mehreren plausiblen Optionen: Optionen nennen, Empfehlung geben, Unsicherheit als Prozentwert. Nicht stillschweigend die bequemste Variante wählen. Kein Beschönigen im Weekly Review — die Beobachtungszeile ist der Zweck der Übung.
