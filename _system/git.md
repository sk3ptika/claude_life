---
titel: Git-Setup
typ: notiz
angelegt: 2026-08-16
aktualisiert: 2026-10-03
---

# Git-Setup

Repo liegt in `~/Meine Ablage/Claude_Life` — einem Google-Drive-synchronisierten Ordner, `.git` eingeschlossen.

| Feld | Wert |
|---|---|
| Remote | `origin` |
| URL | `https://github.com/sk3ptika/claude_life.git` (HTTPS) |
| Branch | `main`, trackt `origin/main` |
| Sichtbarkeit | privat |
| Authentifizierung | Personal Access Token, im macOS-Schlüsselbund (`osxkeychain`) |

## Warum `.git` in Drive bleibt

Google Drive Desktop schreibt in `.git`, während Git dort arbeitet. Daraus können beschädigte Objektdateien und Konfliktkopien entstehen. `.git` außerhalb von Drive zu legen wäre die saubere Lösung — wurde am 2026-10-03 versucht und am selben Tag zurückgenommen: Claude Desktop merkt sich pro Ordner, wo sein Repository liegt, und verweigert danach die Arbeit („could not anchor this repository … leads to a different repository“). **Nicht erneut versuchen**, solange in diesem Ordner mit Claude Desktop gearbeitet wird.

Was das Risiko stattdessen klein hält:

- `commit.sh` packt lose Objekte (`gc --auto`) — wenige große Dateien statt hunderter kleiner, die Drive einzeln synct
- regelmäßig pushen, damit ein kaputtes `.git` nur ein Neu-Klonen ist (siehe unten)

## Offline-Betrieb

Ziel: Notizen, Git und die Weboberfläche funktionieren **ohne Internet**. Stand 2026-10-03:

| Teil | Offline? | Warum |
|---|---|---|
| Git (Status, Log, Diff, Commit) | ja | `.git` liegt im offline fixierten Ordner |
| Push | nein, wird nachgeholt | `commit.sh` committet trotzdem und meldet „Push fehlgeschlagen (offline?)“ — später erneut ausführen |
| Weboberfläche auf diesem Mac | ja | Server läuft lokal, keine externen Skripte oder Schriften; `http://localhost:4173` |
| Weboberfläche von anderen Geräten | nur im Heimnetz | gewollt, siehe `_system/ui/` |
| Notizen selbst | **nur wenn in Drive fixiert** | siehe unten |

### Drive: Ordner offline verfügbar halten

Google Drive läuft im **Streaming-Modus** (`~/Meine Ablage` und `~/Library/CloudStorage/GoogleDrive-…/Meine Ablage` sind derselbe Ordner). macOS darf Dateien in diesem Modus bei Platzmangel auslagern — sie sind dann nur noch online da. Ohne Netz öffnet sich so eine Datei nicht, und die Oberfläche startet nicht, wenn es `server.py` trifft.

Abhilfe, einmalig und von Hand: im Finder Rechtsklick auf `Claude_Life` → **„Offline verfügbar machen“**. Das fixiert den Ordner samt Unterordnern lokal.

Prüfen, ob gerade etwas ausgelagert ist (Ausgabe muss leer sein):

```bash
find ~/"Meine Ablage/Claude_Life" -flags dataless -print
```

Prüfen, ob die Fixierung greift — nur über den echten Drive-Pfad, `~/Meine Ablage` liefert hier einen Fehler. Erwartet: `Effective Content Policy: 3`:

```bash
fileproviderctl evaluate ~/Library/CloudStorage/GoogleDrive-wengenroth@gmail.com/"Meine Ablage"/Claude_Life | grep "Effective Content Policy"
```

Alternative mit mehr Eingriff: Drive für alles auf **Spiegeln** umstellen (Drive-Einstellungen → Google Drive → Dateien spiegeln). Dann liegt die gesamte Ablage lokal, braucht aber entsprechend Platz.

## Warum ein Remote

Ein privates Remote macht ein kaputtes lokales `.git` zu einem Klon statt zu einem Datenverlust.

Regel: **nach jedem Weekly Review pushen.** Ohne Push ist das Remote wertlos.

## Laufender Betrieb

Script `_system/commit.sh` einmalig ausführbar machen:

```bash
chmod +x ~/"Meine Ablage/Claude_Life/_system/commit.sh"
```

Danach nach jedem Review:

```bash
~/"Meine Ablage/Claude_Life/_system/commit.sh" "Weekly Review W33"
```

Ohne Argument setzt das Script eine Standard-Nachricht mit Datum. Es bricht ab, wenn es Google-Drive-Konfliktkopien findet — dann erst prüfen, dann erneut ausführen.

Prüfen, ob alles draußen ist:

```bash
cd ~/"Meine Ablage/Claude_Life"
git status --short
git log --oneline origin/main..main
```

Beide Ausgaben müssen leer sein. Ist die erste nicht leer, greift `.gitignore` nicht richtig. Ist die zweite nicht leer, fehlt ein Push.

## Schutzschicht im Repo

Seit 2026-10-03, alles versioniert, damit es nach einem Neu-Klonen wieder da ist:

| Datei | Wirkung |
|---|---|
| `.gitattributes` | Zeilenenden einheitlich LF, Markdown-Diffs mit Überschrift als Kontext, PDFs und Bilder als binär markiert |
| `_system/hooks/pre-commit` | Blockiert Konfliktkopien, Umlaute/Leerzeichen in Pfaden und Dateien über 5 MB — nur für das, was gerade gestaged ist |
| `_system/commit.sh` | Aktiviert die Hooks selbst (`core.hooksPath`), packt lose Objekte (`gc --auto`), pusht auch Branches mit Upstream, bricht offline nicht ab |

Der Hook lässt sich bewusst umgehen: `git commit --no-verify`. Nur wenn klar ist, warum.

Nach einem frischen Klon greifen die Hooks erst nach dem ersten `commit.sh`-Lauf oder nach:

```bash
git config core.hooksPath _system/hooks
```

Leichter Klon auf einem zweiten Rechner (lädt alte Dateiversionen erst bei Bedarf):

```bash
git clone --filter=blob:none https://github.com/sk3ptika/claude_life.git
```

## Was tun, wenn Drive das Repo zerlegt

Symptome: `error: object file .git/objects/... is empty`, `fatal: loose object is corrupt`, oder Dateien wie `HEAD (1)` in `.git`.

Vorgehen:

```bash
cd ~
mv "Meine Ablage/Claude_Life" "Meine Ablage/Claude_Life_kaputt"
git clone https://github.com/sk3ptika/claude_life.git "Meine Ablage/Claude_Life"
```

Danach aus `Claude_Life_kaputt` alles übertragen, was seit dem letzten Push entstanden ist. Genau deshalb: nach jedem Review pushen.

Der alte Ordner wird **nicht** gelöscht, bevor der Abgleich fertig ist.

Claude-Sitzungen legen Worktrees unter `.claude/worktrees/` an. Melden sie nach so einer Aktion einen kaputten Verweis:

```bash
cd ~/"Meine Ablage/Claude_Life" && git worktree repair
```

## Was NICHT ins Repo gehört

Siehe `.gitignore`. Kurz: RAW-Dateien, PSD, Video, macOS-Metadaten, Drive-Konfliktkopien. PDFs nur in `_anhaenge/`, und dort nur bis 5 MB (Hook).

Hinweis: `~/.gitconfig` enthält Git-LFS-Filter, `git-lfs` selbst ist aber nicht installiert. Deshalb in `.gitattributes` **kein** `filter=lfs` setzen — sonst scheitert jeder Commit.

Wenn das Repo über ein paar hundert Megabyte wächst, liegt Bildmaterial darin, das dort nicht hingehört.

## Arbeitsteilung mit Claude

Claude kann in diesem Ordner Shell- und Git-Befehle ausführen: Status prüfen, Dateien ändern, stagen, committen, Remotes konfigurieren.

Was Claude **nicht** macht: sich bei GitHub authentifizieren. Tokens und Passwörter gibt Claude nicht ein. Der erste Push nach einer neuen Token-Einrichtung ist deshalb immer dein Schritt. Liegt ein gültiges Token im Schlüsselbund, laufen spätere Pushes ohne Rückfrage durch und Claude kann sie mit auslösen.

## Einrichtungsprotokoll

Hier nur als Nachweis — nicht erneut ausführen.

2026-08-16:

1. Erster Commit `6b5552f` — PARA-Grundstruktur, 30 Dateien.
2. Privates Repo `claude_life` auf github.com angelegt, ohne README, `.gitignore` oder Lizenz.
3. `git remote add origin https://github.com/sk3ptika/claude_life.git`
4. `git push -u origin main` — Authentifizierung per Personal Access Token.

2026-10-03:

1. Schutzschicht angelegt (`0156b34`): `.gitattributes`, Pre-commit-Hook, `commit.sh` gehärtet.
2. `git gc` — 356 lose Objekte zu 2 Packdateien.
3. `.git` nach `~/.claude_life.git` verschoben — am selben Tag zurückgenommen, weil Claude Desktop den Ordner danach nicht mehr öffnete. Siehe „Warum `.git` in Drive bleibt“.
4. Drive-Ordner `Claude_Life` auf „Offline verfügbar“ gestellt (Content Policy 3, geprüft mit `fileproviderctl evaluate`).

GitHub CLI (`gh`) und Homebrew sind auf diesem Rechner nicht installiert, SSH-Keys für GitHub existieren nicht. Deshalb HTTPS mit Token statt SSH. Falls SSH später eingerichtet wird, ändert sich nur die Remote-URL:

```bash
git remote set-url origin git@github.com:sk3ptika/claude_life.git
```
