# -*- coding: utf-8 -*-
"""Vault-Zugriff für die lokale Oberfläche.

Pfadsicherheit, Frontmatter parsen/serialisieren, Index-Scan, atomares
Schreiben, Anlegen aus Template, Archivieren, Suche. Kein Delete —
harte Regel 1 wird durch die fehlende Funktion durchgesetzt.

Läuft auf /usr/bin/python3 (3.9): kein match, keine X|Y-Annotationen.
"""
import datetime
import os
import posixpath
import re
import subprocess
import unicodedata

UI_DIR = os.path.dirname(os.path.realpath(__file__))
VAULT = os.path.realpath(os.path.join(UI_DIR, os.pardir, os.pardir))

AUSGESCHLOSSENE_ORDNER = ('.git', '.obsidian', '.vscode', '.claude')
TEMPLATES = os.path.join(VAULT, '_system', 'templates')


class ApiFehler(Exception):
    """Fehler mit HTTP-Status; daten wandern zusätzlich in die JSON-Antwort."""

    def __init__(self, status, meldung, daten=None):
        super().__init__(meldung)
        self.status = status
        self.meldung = meldung
        self.daten = daten or {}


def nfc(s):
    return unicodedata.normalize('NFC', s)


def heute():
    return datetime.date.today().isoformat()


# ---------------------------------------------------------------- Pfade

def sicherer_pfad(pfad, schreiben=False):
    """Vault-relativen Pfad prüfen und als absoluten Pfad zurückgeben.

    realpath zuerst (Symlinks!), Vergleich erst nach der Auflösung.
    """
    if not isinstance(pfad, str) or pfad == '' or '\x00' in pfad:
        raise ApiFehler(400, 'Ungültiger Pfad')
    pfad = nfc(pfad)
    if os.path.isabs(pfad):
        raise ApiFehler(400, 'Absolute Pfade sind nicht erlaubt')
    aufgeloest = os.path.realpath(os.path.join(VAULT, pfad))
    if not (aufgeloest == VAULT or aufgeloest.startswith(VAULT + os.sep)):
        raise ApiFehler(403, 'Pfad liegt außerhalb des Vaults')
    rel = os.path.relpath(aufgeloest, VAULT)
    teile = rel.split(os.sep)
    if '.git' in teile or any(t.startswith('.tmp-') for t in teile):
        raise ApiFehler(403, 'Verbotener Pfad')
    if schreiben:
        if not aufgeloest.endswith('.md'):
            raise ApiFehler(403, 'Geschrieben werden nur .md-Dateien')
        gesperrt = (os.path.join('_system', 'templates'), os.path.join('_system', 'ui'))
        for g in gesperrt:
            if rel == g or rel.startswith(g + os.sep):
                raise ApiFehler(403, 'Dieser Ordner ist schreibgeschützt')
    return aufgeloest


def _rel(voll):
    return nfc(os.path.relpath(voll, VAULT)).replace(os.sep, '/')


# ---------------------------------------------------------- Frontmatter

def kopf_lesen(text):
    """(kopf, body) — kopf ist None, wenn kein Frontmatter da ist.

    Nur Top-Level `key: rest`, Wert roh als String, leer wird None.
    Reihenfolge bleibt erhalten (dict ist geordnet).
    """
    zeilen = text.split('\n')
    if not zeilen or zeilen[0].strip() != '---':
        return None, text
    for i in range(1, len(zeilen)):
        if zeilen[i].strip() == '---':
            kopf = {}
            for z in zeilen[1:i]:
                if not z.strip() or z[0] in (' ', '\t') or ':' not in z:
                    continue
                k, _, w = z.partition(':')
                w = w.strip()
                if len(w) >= 2 and w[0] == w[-1] and w[0] in ('"', "'"):
                    w = w[1:-1]
                kopf[k.strip()] = w if w != '' else None
            return kopf, '\n'.join(zeilen[i + 1:])
    return None, text


def kopf_schreiben(kopf):
    zeilen = ['---']
    for k, w in kopf.items():
        if w is None or str(w) == '':
            zeilen.append('%s: ' % k)
            continue
        w = str(w)
        if w.startswith('#') or ':' in w or w != w.strip():
            anf = "'" if '"' in w else '"'
            w = anf + w + anf
        elif w[0] in ('"', "'"):
            w = '"' + w + '"' if w[0] == "'" else "'" + w + "'"
        zeilen.append('%s: %s' % (k, w))
    zeilen.append('---')
    return '\n'.join(zeilen) + '\n'


def atomar_schreiben(voll, text):
    tmp = os.path.join(os.path.dirname(voll), '.tmp-%d' % os.getpid())
    with open(tmp, 'w', encoding='utf-8', newline='') as f:
        f.write(text)
    os.replace(tmp, voll)


# ----------------------------------------------------------------- Index

_LINK_RE = re.compile(r'\[[^\]]*\]\(([^)]+)\)')


def md_links(quelle, body):
    """Relative Linkziele einer Datei, aufgelöst zum Vault-relativen Pfad."""
    basis = posixpath.dirname(quelle)
    ziele = []
    for m in _LINK_RE.finditer(body):
        z = m.group(1).strip()
        if z.startswith(('http://', 'https://', 'mailto:', '#', 'tel:')):
            continue
        z = z.split('#')[0].strip()
        if not z:
            continue
        z = nfc(posixpath.normpath(posixpath.join(basis, z)))
        if not z.startswith('..'):
            ziele.append(z)
    return ziele


def _md_analysieren(rel, text):
    kopf, body = kopf_lesen(text)
    h2 = [z[3:].strip() for z in body.split('\n') if z.startswith('## ')]
    offen = len(re.findall(r'^\s*[-*] \[ \]', body, re.M))
    erledigt = len(re.findall(r'^\s*[-*] \[[xX]\]', body, re.M))
    return {
        'kopf': kopf,
        'h2': h2,
        'checkboxen': {'offen': offen, 'gesamt': offen + erledigt},
        'links': md_links(rel, body),
    }


def index_scannen():
    """Kompletter Scan: alle .md mit Kopf-Feldern, Ordnerbaum, Nicht-md-Dateien."""
    dateien, andere, ordner = [], [], []
    for root, dirs, files in os.walk(VAULT):
        rel_root = os.path.relpath(root, VAULT)
        if rel_root == '.':
            rel_root = ''
        dirs[:] = sorted(d for d in dirs
                         if d not in AUSGESCHLOSSENE_ORDNER and not d.startswith('.'))
        if rel_root == '_system' and 'ui' in dirs:
            dirs.remove('ui')
        for d in dirs:
            ordner.append(nfc(posixpath.join(rel_root.replace(os.sep, '/'), d)))
        for name in sorted(files):
            if name.startswith('.'):
                continue
            voll = os.path.join(root, name)
            rel = nfc(posixpath.join(rel_root.replace(os.sep, '/'), name))
            try:
                st = os.stat(voll)
            except OSError:
                continue
            if name.endswith('.md'):
                try:
                    with open(voll, encoding='utf-8') as f:
                        text = f.read()
                except (OSError, UnicodeDecodeError):
                    continue
                eintrag = {'pfad': rel, 'mtime': st.st_mtime, 'groesse': st.st_size}
                eintrag.update(_md_analysieren(rel, text))
                dateien.append(eintrag)
            else:
                andere.append({'pfad': rel, 'mtime': st.st_mtime, 'groesse': st.st_size})
    return {'dateien': dateien, 'ordner': sorted(ordner), 'andere': andere}


# ------------------------------------------------------------------ Doku

def doc_lesen(pfad):
    voll = sicherer_pfad(pfad)
    if not os.path.isfile(voll) or not voll.endswith('.md'):
        raise ApiFehler(404, 'Datei nicht gefunden: %s' % pfad)
    with open(voll, encoding='utf-8') as f:
        roh = f.read()
    st = os.stat(voll)
    kopf, body = kopf_lesen(roh)
    rel = _rel(voll)
    rueck = [d['pfad'] for d in index_scannen()['dateien']
             if rel in d['links'] and d['pfad'] != rel]
    return {
        'pfad': rel,
        'frontmatter': kopf,
        'body': body,
        'roh': roh,
        'mtime': st.st_mtime,
        'links': md_links(rel, body),
        'rueckwaerts': rueck,
    }


def doc_schreiben(pfad, frontmatter, body, mtime_erwartet):
    """Speichern mit mtime-Prüfung; setzt als einzige Stelle `aktualisiert`."""
    voll = sicherer_pfad(pfad, schreiben=True)
    existiert = os.path.isfile(voll)
    if existiert and mtime_erwartet is not None:
        st = os.stat(voll)
        if abs(st.st_mtime - float(mtime_erwartet)) > 1.0:
            raise ApiFehler(409, 'Die Datei wurde inzwischen anderweitig geändert',
                            {'server': doc_lesen(_rel(voll))})
    if not existiert:
        raise ApiFehler(404, 'Datei nicht gefunden: %s' % pfad)
    if frontmatter:
        kopf = dict(frontmatter)
        kopf['aktualisiert'] = heute()  # angelegt bleibt unangetastet
        text = kopf_schreiben(kopf) + body
    else:
        text = body
    atomar_schreiben(voll, text)
    return {'mtime': os.stat(voll).st_mtime}


# ---------------------------------------------------------------- Suche

def suchen(q):
    q = nfc(q).strip().lower()
    if not q:
        return []
    ergebnisse = []
    for d in index_scannen()['dateien']:
        voll = os.path.join(VAULT, d['pfad'])
        try:
            with open(voll, encoding='utf-8') as f:
                text = f.read()
        except (OSError, UnicodeDecodeError):
            continue
        treffer = []
        for nr, zeile in enumerate(text.split('\n'), 1):
            if q in nfc(zeile).lower():
                treffer.append({'zeile': nr, 'kontext': zeile.strip()[:200]})
                if len(treffer) >= 5:
                    break
        if treffer:
            kopf = d['kopf'] or {}
            titel = kopf.get('titel') or posixpath.basename(d['pfad'])
            ergebnisse.append({'pfad': d['pfad'], 'titel': titel, 'treffer': treffer})
        if len(ergebnisse) >= 50:
            break
    return ergebnisse


# --------------------------------------------------------------- Anlegen

def slug_bilden(titel):
    s = nfc(titel).lower()
    for a, b in (('ä', 'ae'), ('ö', 'oe'), ('ü', 'ue'), ('ß', 'ss')):
        s = s.replace(a, b)
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s or 'ohne-titel'


def aktive_projekte():
    aktiv = []
    for d in index_scannen()['dateien']:
        kopf = d['kopf'] or {}
        if (d['pfad'].startswith('01_Projekte/')
                and posixpath.basename(d['pfad']) == '_projekt.md'
                and kopf.get('status') == 'aktiv'):
            aktiv.append({'pfad': d['pfad'], 'titel': kopf.get('titel') or d['pfad'],
                          'deadline': kopf.get('deadline'),
                          'checkboxen': d['checkboxen']})
    return aktiv


def _template_lesen(name):
    voll = os.path.join(TEMPLATES, name)
    if not os.path.isfile(voll):
        raise ApiFehler(500, 'Template fehlt: %s' % name)
    with open(voll, encoding='utf-8') as f:
        return f.read()


def neu(typ, titel, bereich=None, deadline=None, zielordner=None):
    titel = (titel or '').strip()
    if typ not in ('projekt', 'bereich', 'notiz', 'review', 'entscheidung'):
        raise ApiFehler(400, 'Unbekannter Typ: %s' % typ)
    if typ != 'review' and not titel:
        raise ApiFehler(400, 'Titel fehlt')
    slug = slug_bilden(titel)
    tag = heute()
    warnung = None

    if typ == 'projekt':
        monat = tag[:7]
        rel = '01_Projekte/%s_%s/_projekt.md' % (monat, slug)
        text = _template_lesen('projekt.md')
        aktiv = aktive_projekte()
        if len(aktiv) >= 3:
            warnung = ('Es gibt bereits %d aktive Projekte (%s). Die Regel lautet: '
                       'maximal drei. Wirklich anlegen?'
                       % (len(aktiv), ', '.join(p['titel'] for p in aktiv)))
    elif typ == 'bereich':
        rel = '02_Bereiche/%s/_bereich.md' % slug
        text = _template_lesen('bereich.md')
    elif typ == 'review':
        jahr, woche, _ = datetime.date.today().isocalendar()
        wo = '%d-W%02d' % (jahr, woche)
        rel = '_system/reviews/%s.md' % wo
        text = _template_lesen('review.md').replace('YYYY-Www', wo)
        titel = titel or 'Weekly Review %s' % wo
    elif typ == 'entscheidung':
        basis = (zielordner or '00_Inbox').strip('/')
        rel = '%s/%s.md' % (basis, slug)
        text = _template_lesen('entscheidung.md')
    else:  # notiz — dafür gibt es kein Template, nur den Pflichtkopf
        basis = (zielordner or '00_Inbox').strip('/')
        rel = '%s/%s.md' % (basis, slug)
        text = ('---\ntitel: \ntyp: notiz\nstatus: aktiv\nangelegt: %s\n---\n\n# {{titel}}\n\n'
                % 'YYYY-MM-DD')

    voll = sicherer_pfad(rel, schreiben=True)
    if os.path.exists(voll):
        raise ApiFehler(409, 'Existiert bereits: %s' % rel)

    text = text.replace('{{titel}}', titel)
    kopf, body = kopf_lesen(text)
    if kopf is None:
        raise ApiFehler(500, 'Template ohne Frontmatter: %s' % typ)
    kopf['titel'] = titel
    kopf['angelegt'] = tag
    if typ == 'projekt':
        kopf['deadline'] = deadline or None
        kopf['bereich'] = bereich or None
    if typ == 'entscheidung' and deadline:
        kopf['frist'] = deadline

    os.makedirs(os.path.dirname(voll), exist_ok=True)
    atomar_schreiben(voll, kopf_schreiben(kopf) + body)
    antwort = {'pfad': _rel(voll)}
    if warnung:
        antwort['warnung'] = warnung
    return antwort


# ----------------------------------------------------------- Archivieren

def _ist_getrackt(voll):
    r = subprocess.run(['git', 'ls-files', '--', os.path.relpath(voll, VAULT)],
                       cwd=VAULT, capture_output=True, text=True)
    return bool(r.stdout.strip())


def archivieren(pfad):
    """status→erledigt, aktualisiert→heute, dann nach 04_Archiv/<Jahr>/.

    Bei _projekt.md/_bereich.md wandert der ganze Ordner. Gebrochene
    Links werden gemeldet, nie automatisch umgeschrieben.
    """
    voll = sicherer_pfad(pfad, schreiben=True)
    if not os.path.isfile(voll):
        raise ApiFehler(404, 'Datei nicht gefunden: %s' % pfad)
    with open(voll, encoding='utf-8') as f:
        text = f.read()
    kopf, body = kopf_lesen(text)
    if kopf is not None:
        kopf['status'] = 'erledigt'
        kopf['aktualisiert'] = heute()
        atomar_schreiben(voll, kopf_schreiben(kopf) + body)

    name = os.path.basename(voll)
    if name in ('_projekt.md', '_bereich.md'):
        quelle = os.path.dirname(voll)
    else:
        quelle = voll
    quelle_rel = _rel(quelle)
    if quelle_rel.startswith('04_Archiv/'):
        raise ApiFehler(400, 'Liegt bereits im Archiv')

    jahr = str(datetime.date.today().year)
    ziel_dir = os.path.join(VAULT, '04_Archiv', jahr)
    os.makedirs(ziel_dir, exist_ok=True)
    ziel = os.path.join(ziel_dir, os.path.basename(quelle))
    if os.path.exists(ziel):
        raise ApiFehler(409, 'Ziel existiert bereits: %s' % _rel(ziel))

    if _ist_getrackt(quelle):
        r = subprocess.run(['git', 'mv', '--', os.path.relpath(quelle, VAULT),
                            os.path.relpath(ziel, VAULT)],
                           cwd=VAULT, capture_output=True, text=True)
        if r.returncode != 0:
            raise ApiFehler(500, 'git mv fehlgeschlagen: %s' % r.stderr.strip())
    else:
        os.rename(quelle, ziel)

    gebrochen = []
    for d in index_scannen()['dateien']:
        for ziel_link in d['links']:
            if ziel_link == quelle_rel or ziel_link.startswith(quelle_rel + '/'):
                gebrochen.append({'quelle': d['pfad'], 'ziel': ziel_link})
    return {'neuer_pfad': _rel(ziel), 'gebrochene_links': gebrochen}
