---
titel: Git-Setup
typ: notiz
angelegt: 2026-08-16
aktualisiert: 2026-10-03
---

# Git-Setup

Die Arbeitskopie liegt in `~/Meine Ablage/Claude_Life` — einem Google-Drive-synchronisierten Ordner. Das Git-Verzeichnis selbst liegt seit 2026-10-03 **außerhalb von Drive** in `~/.claude_life.git`. Im Drive-Ordner ist `.git` nur noch eine einzeilige Textdatei:

```
gitdir: /Users/philipp/.claude_life.git
```

| Feld | Wert |
|---|---|
| Git-Verzeichnis | `~/.claude_life.git` (lokal, nicht synchronisiert) |
| Remote | `origin` |
| URL | `https://github.com/sk3ptika/claude_life.git` (HTTPS) |
| Branch | `main`, trackt `origin/main` |
| Sichtbarkeit | privat |
| Authentifizierung | Personal Access Token, im macOS-Schlüsselbund (`osxkeychain`) |

## Warum `.git` außerhalb von Drive

Google Drive Desktop schreibt in `.git`, während Git dort arbeitet. Daraus entstanden beschädigte Objektdateien und Konfliktkopien. Seit dem Umzug sieht Drive nur noch die Notizen und die Verweisdatei — die Git-Daten fasst es nicht mehr an.

Folge: Das Git-Verzeichnis ist **nur auf diesem Mac**. Drive sichert es nicht mehr mit.

## Offline-Betrieb

Ziel: Notizen, Git und die Weboberfläche funktionieren **ohne Internet**. Stand 2026-10-03:

| Teil | Offline? | Warum |
|---|---|---|
| Git (Status, Log, Diff, Commit) | ja | `~/.claude_life.git` liegt lokal |
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

Alternative mit mehr Eingriff: Drive für alles auf **Spiegeln** umstellen (Drive-Einstellungen → Google Drive → Dateien spiegeln). Dann liegt die gesamte Ablage lokal, braucht aber entsprechend Platz.

## Warum ein Remote

GitHub ist damit die einzige zweite Kopie der Historie. Fällt dieser Mac aus, sind ungepushte Commits weg — die Notizen selbst liegen weiter in Drive.

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

## Störungen und Reparatur

### `fatal: not a git repository`

Die Verweisdatei `.git` im Drive-Ordner fehlt, ist beschädigt, oder `~/.claude_life.git` existiert nicht (anderer Mac, neues Benutzerkonto). Prüfen:

```bash
cat ~/"Meine Ablage/Claude_Life/.git"
```

```bash
ls ~/.claude_life.git
```

Existiert `~/.claude_life.git`, die Verweisdatei neu schreiben:

```bash
printf 'gitdir: %s\n' "$HOME/.claude_life.git" > ~/"Meine Ablage/Claude_Life/.git"
```

### Neuer oder zweiter Mac

Drive bringt die Notizen und die Verweisdatei mit, aber nicht `~/.claude_life.git`. Git-Verzeichnis aus GitHub holen, ohne die Notizen anzufassen:

```bash
git clone --bare https://github.com/sk3ptika/claude_life.git ~/.claude_life.git
```

```bash
cd ~/"Meine Ablage/Claude_Life" && git config core.bare false && git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*' && git fetch && git reset origin/main
```

`git reset` ohne `--hard` ändert keine Dateien, es gleicht nur den Index ab. Danach zeigt `git status`, was in Drive neuer ist als auf GitHub.

Den Pfad in der Verweisdatei anpassen, falls der Benutzername dort anders ist.

### Worktrees nach einem Umzug

Claude-Sitzungen legen Worktrees unter `.claude/worktrees/` an. Verschiebt sich das Git-Verzeichnis, Verweise reparieren:

```bash
cd ~/"Meine Ablage/Claude_Life" && git worktree repair
```

### Git-Verzeichnis beschädigt

Symptome: `error: object file ... is empty`, `fatal: loose object is corrupt`. Durch den Umzug unwahrscheinlich geworden. Vorgehen: altes Verzeichnis umbenennen, nicht löschen, dann neu holen wie unter „Neuer oder zweiter Mac“:

```bash
mv ~/.claude_life.git ~/.claude_life.git-kaputt
```

`~/.claude_life.git-kaputt` erst entfernen, wenn klar ist, dass nichts Ungepushtes darin fehlt.

### Bekannte Eigenheit: `git worktree list`

Weil das Git-Verzeichnis außerhalb des Arbeitsordners liegt, zeigt `git worktree list` als Hauptordner `/Users/philipp/.claude_life.git` statt `~/Meine Ablage/Claude_Life`. Das betrifft nur die Anzeige: `git rev-parse --show-toplevel` liefert den richtigen Ordner, Status, Commit und Push funktionieren.

Offen (Stand 2026-10-03): ob die Claude-App diese Liste nutzt, um neue Worktrees anzulegen. Schlägt eine neue Claude-Sitzung in diesem Ordner fehl, ist das der erste Verdacht — dann den Rückweg unten nehmen.

### Rückweg: `.git` wieder in Drive

Falls der Umzug rückgängig gemacht werden soll:

```bash
cd ~/"Meine Ablage/Claude_Life" && mv .git .git-verweis && mv ~/.claude_life.git .git && git worktree repair
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
3. `.git` nach `~/.claude_life.git` verschoben, Verweisdatei geschrieben, `git worktree repair`.

GitHub CLI (`gh`) und Homebrew sind auf diesem Rechner nicht installiert, SSH-Keys für GitHub existieren nicht. Deshalb HTTPS mit Token statt SSH. Falls SSH später eingerichtet wird, ändert sich nur die Remote-URL:

```bash
git remote set-url origin git@github.com:sk3ptika/claude_life.git
```
