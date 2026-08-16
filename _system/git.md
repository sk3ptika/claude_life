---
titel: Git-Setup
typ: notiz
angelegt: 2026-08-16
aktualisiert: 2026-08-16
---

# Git-Setup

Repo liegt in `~/Meine Ablage/Claude_Life` — einem Google-Drive-synchronisierten Ordner.

| Feld | Wert |
|---|---|
| Remote | `origin` |
| URL | `https://github.com/sk3ptika/claude_life.git` (HTTPS) |
| Branch | `main`, trackt `origin/main` |
| Sichtbarkeit | privat |
| Authentifizierung | Personal Access Token, im macOS-Schlüsselbund (`osxkeychain`) |

## Warum ein Remote

Google Drive Desktop schreibt in `.git`, während Git dort arbeitet. Daraus können beschädigte Objektdateien und Konfliktkopien entstehen. Ein privates Remote macht ein kaputtes lokales `.git` zu einem Klon statt zu einem Datenverlust.

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

## Was NICHT ins Repo gehört

Siehe `.gitignore`. Kurz: RAW-Dateien, PSD, Video, macOS-Metadaten, Drive-Konfliktkopien.

Wenn das Repo über ein paar hundert Megabyte wächst, liegt Bildmaterial darin, das dort nicht hingehört.

## Arbeitsteilung mit Claude

Claude kann in diesem Ordner Shell- und Git-Befehle ausführen: Status prüfen, Dateien ändern, stagen, committen, Remotes konfigurieren.

Was Claude **nicht** macht: sich bei GitHub authentifizieren. Tokens und Passwörter gibt Claude nicht ein. Der erste Push nach einer neuen Token-Einrichtung ist deshalb immer dein Schritt. Liegt ein gültiges Token im Schlüsselbund, laufen spätere Pushes ohne Rückfrage durch und Claude kann sie mit auslösen.

## Einrichtungsprotokoll

Einmalig erledigt am 2026-08-16, hier nur als Nachweis — nicht erneut ausführen:

1. Erster Commit `6b5552f` — PARA-Grundstruktur, 30 Dateien.
2. Privates Repo `claude_life` auf github.com angelegt, ohne README, `.gitignore` oder Lizenz.
3. `git remote add origin https://github.com/sk3ptika/claude_life.git`
4. `git push -u origin main` — Authentifizierung per Personal Access Token.

GitHub CLI (`gh`) und Homebrew sind auf diesem Rechner nicht installiert, SSH-Keys für GitHub existieren nicht. Deshalb HTTPS mit Token statt SSH. Falls SSH später eingerichtet wird, ändert sich nur die Remote-URL:

```bash
git remote set-url origin git@github.com:sk3ptika/claude_life.git
```
