# -*- coding: utf-8 -*-
"""Git-Anbindung: commit.sh aufrufen, Status und Konfliktkopien melden.

Keine Credentials hier — Authentifizierung (Token im Schlüsselbund)
bleibt Sache des Nutzers.
"""
import os
import subprocess

import vault

COMMIT_SH = os.path.join(vault.VAULT, '_system', 'commit.sh')


def _git(*argumente):
    return subprocess.run(['git'] + list(argumente), cwd=vault.VAULT,
                          capture_output=True, text=True, timeout=30)


def konfliktkopien():
    """Dieselben Muster wie commit.sh: Drive-Konfliktkopien im Baum."""
    r = subprocess.run(
        ['find', '.', '-path', './.git', '-prune', '-o',
         '(', '-name', '*(1)*', '-o', '-name', '*conflicted copy*',
         '-o', '-name', '*Konflikt*', ')', '-print'],
        cwd=vault.VAULT, capture_output=True, text=True, timeout=30)
    return [z.lstrip('./') for z in r.stdout.splitlines() if z.strip()]


def grosse_getrackte_dateien(grenze=2 * 1024 * 1024):
    gross = []
    r = _git('ls-files', '-z')
    for rel in r.stdout.split('\0'):
        if not rel:
            continue
        voll = os.path.join(vault.VAULT, rel)
        try:
            groesse = os.path.getsize(voll)
        except OSError:
            continue
        if groesse > grenze:
            gross.append({'pfad': rel, 'groesse': groesse})
    return gross


def status():
    porcelain = _git('status', '--porcelain')
    aenderungen = [z for z in porcelain.stdout.splitlines() if z.strip()]
    log = _git('log', '--oneline', '-1')
    idx = vault.index_scannen()
    ohne_kopf = [d['pfad'] for d in idx['dateien'] if d['kopf'] is None]
    inbox = [d['pfad'] for d in idx['dateien'] + idx['andere']
             if d['pfad'].startswith('00_Inbox/')
             and not os.path.basename(d['pfad']).startswith('_')]
    return {
        'aenderungen': aenderungen,
        'letzter_commit': log.stdout.strip(),
        'konfliktkopien': konfliktkopien(),
        'aktive_projekte': vault.aktive_projekte(),
        'inbox': len(inbox),
        'ohne_frontmatter': ohne_kopf,
        'grosse_dateien': grosse_getrackte_dateien(),
    }


def commit(nachricht):
    """commit.sh ohne Shell aufrufen; die Nachricht läuft nie durch eine Shell.

    Timeout 60 s, weil git push auf den Schlüsselbund warten kann.
    Exit 2 heißt Konfliktkopien — der Client zeigt stderr als roten Kasten.
    """
    nachricht = (nachricht or '').strip()
    try:
        r = subprocess.run(['/bin/bash', COMMIT_SH] + ([nachricht] if nachricht else []),
                           cwd=vault.VAULT, capture_output=True, text=True, timeout=60)
    except subprocess.TimeoutExpired:
        raise vault.ApiFehler(504, 'commit.sh hat 60 s überschritten (wartet git push auf den Schlüsselbund?)')
    return {'code': r.returncode, 'stdout': r.stdout, 'stderr': r.stderr}
