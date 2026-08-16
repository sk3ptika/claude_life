---
titel: Git-Setup
typ: notiz
angelegt: 2026-08-16
---

# Git-Setup

Repo liegt in `~/Meine Ablage/Claude_Life` — einem Google-Drive-synchronisierten Ordner.

## Warum ein Remote

Google Drive Desktop schreibt in `.git`, während Git dort arbeitet. Daraus können beschädigte Objektdateien und Konfliktkopien entstehen. Ein privates Remote macht ein kaputtes lokales `.git` zu einem Klon statt zu einem Datenverlust.

Regel: **nach jedem Weekly Review pushen.** Ohne Push ist das Remote wertlos.

## Einmalig einrichten

### 1. Erster Commit

```bash
cd ~/"Meine Ablage/Claude_Life"
git add -A
git commit -m "PARA-Grundstruktur"
```

### 2. Privates GitHub-Repo anlegen

Mit GitHub CLI, falls installiert (`gh --version` prüfen):

```bash
gh repo create claude-life --private --source=. --remote=origin --push
```

Ohne CLI: auf github.com ein leeres privates Repo `claude-life` anlegen, **ohne** README, .gitignore oder Lizenz. Dann:

```bash
git remote add origin git@github.com:<dein-user>/claude-life.git
git branch -M main
git push -u origin main
```

Falls SSH nicht eingerichtet ist, HTTPS verwenden:

```bash
git remote add origin https://github.com/<dein-user>/claude-life.git
```

### 3. Prüfen

```bash
git remote -v
git log --oneline
git status --short
```

`git status --short` muss leer sein. Ist es das nicht, greift `.gitignore` nicht richtig.

## Laufender Betrieb

Script `_system/commit.sh` ausführbar machen und nutzen:

```bash
chmod +x ~/"Meine Ablage/Claude_Life/_system/commit.sh"
~/"Meine Ablage/Claude_Life/_system/commit.sh" "Weekly Review W33"
```

Ohne Argument setzt das Script eine Standard-Nachricht mit Datum.

## Was tun, wenn Drive das Repo zerlegt

Symptome: `error: object file .git/objects/... is empty`, `fatal: loose object is corrupt`, oder Dateien wie `HEAD (1)` in `.git`.

Vorgehen:

```bash
cd ~
mv "Meine Ablage/Claude_Life" "Meine Ablage/Claude_Life_kaputt"
git clone git@github.com:<dein-user>/claude-life.git "Meine Ablage/Claude_Life"
```

Danach aus `Claude_Life_kaputt` alles übertragen, was seit dem letzten Push entstanden ist. Genau deshalb: nach jedem Review pushen.

## Was NICHT ins Repo gehört

Siehe `.gitignore`. Kurz: RAW-Dateien, PSD, Video, macOS-Metadaten, Drive-Konfliktkopien.

Wenn das Repo über ein paar hundert Megabyte wächst, liegt Bildmaterial darin, das dort nicht hingehört.

## Einschränkung

Claude kann auf diesem Rechner keine Shell-Befehle im Projektordner ausführen — der Mount schlägt fehl. Dateien lesen und schreiben funktioniert, Git-Befehle nicht. Alle Git-Schritte machst du selbst.
