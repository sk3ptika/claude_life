# -*- coding: utf-8 -*-
"""Vault-Zugriff für die lokale Oberfläche.

Pfadsicherheit, Frontmatter parsen/serialisieren, Index-Scan, atomares
Schreiben, Anlegen aus Template, Archivieren, Suche. Kein Delete —
harte Regel 1 wird durch die fehlende Funktion durchgesetzt.

Läuft auf /usr/bin/python3 (3.9): kein match, keine X|Y-Annotationen.
"""
import csv
import datetime
import io
import json
import os
import posixpath
import re
import subprocess
import unicodedata
import urllib.error
import urllib.request

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


# ---------------------------------------------------------------- Tabellen

def md_tabelle_parsen(body):
    """Extrahiert die erste Markdown-Tabelle: (header, zeilen, start_idx, end_idx).

    zeilen ist eine Liste von Dictionaries mit den Spaltennamen als Schlüssel.
    """
    if not body:
        return None, [], -1, -1
    zeilen_text = body.split('\n')
    header = []
    zeilen = []
    start_idx = -1
    end_idx = -1
    in_tabelle = False

    for i, z in enumerate(zeilen_text):
        z_str = z.strip()
        if z_str.startswith('|') and z_str.endswith('|') and len(z_str) > 1:
            zellen = [c.strip() for c in z_str.split('|')[1:-1]]
            if not in_tabelle:
                in_tabelle = True
                header = zellen
                start_idx = i
            elif len(zellen) == len(header) and all(re.match(r'^:?-+:?$', c) for c in zellen):
                continue  # Trennzeile |---|---|
            else:
                d = {}
                for idx, col in enumerate(header):
                    d[col] = zellen[idx] if idx < len(zellen) else ''
                zeilen.append(d)
                end_idx = i
        else:
            if in_tabelle:
                break

    if not in_tabelle or not header:
        return None, [], -1, -1
    return header, zeilen, start_idx, end_idx


def tabelle_zu_markdown(header, zeilen):
    """Generiert sauberen GFM-Tabellentext aus Spalten und Zeilen-Dictionaries/Listen."""
    if not header:
        return ''
    out = ['| ' + ' | '.join(header) + ' |']
    out.append('|' + '|'.join('---' for _ in header) + '|')
    for z in zeilen:
        if isinstance(z, dict):
            row_cells = [str(z.get(col, '')).replace('|', '\\|') for col in header]
        elif isinstance(z, (list, tuple)):
            row_cells = [str(c).replace('|', '\\|') for c in z]
            while len(row_cells) < len(header):
                row_cells.append('')
        else:
            continue
        out.append('| ' + ' | '.join(row_cells[:len(header)]) + ' |')
    return '\n'.join(out)


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

    tabelle_daten = None
    if kopf and (kopf.get('tabelle_interaktiv') or kopf.get('gsheet_id') or kopf.get('gsheet_url')):
        h, z, _, _ = md_tabelle_parsen(body)
        if h:
            tabelle_daten = {'header': h, 'zeilen': z}

    return {
        'pfad': rel,
        'frontmatter': kopf,
        'body': body,
        'roh': roh,
        'mtime': st.st_mtime,
        'links': md_links(rel, body),
        'rueckwaerts': rueck,
        'tabelle': tabelle_daten,
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


# ----------------------------------------------------------- Sheet Sync

def sheet_sync(pfad, aktion='pull', daten=None):
    """Synchronisiert tabellarische Daten mit Google Sheet oder speichert Tabellen-Zeilen."""
    doc = doc_lesen(pfad)
    kopf = doc.get('frontmatter') or {}
    body = doc.get('body') or ''
    sync_url = kopf.get('gsheet_sync_url') or kopf.get('gsheet_csv_url')

    header, zeilen, s_idx, e_idx = md_tabelle_parsen(body)
    if not header:
        raise ApiFehler(400, 'Keine Markdown-Tabelle im Dokument gefunden')

    if aktion == 'zeile_hinzufuegen':
        if not daten or not isinstance(daten, dict):
            raise ApiFehler(400, 'Fehlende Zeilendaten')
        zeilen.append(daten)
        neue_tabelle = tabelle_zu_markdown(header, zeilen)
        z_text = body.split('\n')
        neuer_body = '\n'.join(z_text[:s_idx]) + '\n' + neue_tabelle + '\n' + '\n'.join(z_text[e_idx + 1:])
        doc_schreiben(pfad, kopf, neuer_body, mtime_erwartet=None)
        if sync_url:
            try:
                push_daten = {'rows': [header] + [[z.get(c, '') for c in header] for z in zeilen]}
                req = urllib.request.Request(sync_url, data=json.dumps(push_daten).encode('utf-8'),
                                             headers={'Content-Type': 'application/json', 'User-Agent': 'VaultUI/1'})
                with urllib.request.urlopen(req, timeout=8):
                    pass
            except Exception:
                pass
        return {'erfolg': True, 'nachricht': 'Zeile hinzugefügt', 'doc': doc_lesen(pfad)}

    elif aktion == 'zeile_bearbeiten':
        idx = int(daten.get('index', -1)) if daten else -1
        zeile_neu = daten.get('zeile') if daten else None
        if idx < 0 or idx >= len(zeilen) or not zeile_neu:
            raise ApiFehler(400, 'Ungültiger Index oder Zeilendaten')
        zeilen[idx] = zeile_neu
        neue_tabelle = tabelle_zu_markdown(header, zeilen)
        z_text = body.split('\n')
        neuer_body = '\n'.join(z_text[:s_idx]) + '\n' + neue_tabelle + '\n' + '\n'.join(z_text[e_idx + 1:])
        doc_schreiben(pfad, kopf, neuer_body, mtime_erwartet=None)
        if sync_url:
            try:
                push_daten = {'rows': [header] + [[z.get(c, '') for c in header] for z in zeilen]}
                req = urllib.request.Request(sync_url, data=json.dumps(push_daten).encode('utf-8'),
                                             headers={'Content-Type': 'application/json', 'User-Agent': 'VaultUI/1'})
                with urllib.request.urlopen(req, timeout=8):
                    pass
            except Exception:
                pass
        return {'erfolg': True, 'nachricht': 'Zeile aktualisiert', 'doc': doc_lesen(pfad)}

    elif aktion == 'pull':
        if not sync_url:
            return {'erfolg': False, 'status': 'no_sync_url',
                    'nachricht': 'Keine gsheet_sync_url im Frontmatter hinterlegt. Lokaler Stand wird angezeigt.',
                    'doc': doc}
        try:
            req = urllib.request.Request(sync_url, headers={'User-Agent': 'VaultUI/1'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                roh = resp.read().decode('utf-8')

            neue_zeilen = []
            neuer_header = header
            try:
                json_daten = json.loads(roh)
                if isinstance(json_daten, list) and len(json_daten) > 0:
                    neuer_header = [str(c) for c in json_daten[0]]
                    for r in json_daten[1:]:
                        if any(str(v).strip() for v in r):
                            neue_zeilen.append({neuer_header[ci]: str(val) for ci, val in enumerate(r) if ci < len(neuer_header)})
                elif isinstance(json_daten, dict) and 'rows' in json_daten:
                    neuer_header = json_daten.get('headers') or header
                    for r in json_daten['rows']:
                        if any(str(v).strip() for v in r):
                            neue_zeilen.append({neuer_header[ci]: str(val) for ci, val in enumerate(r) if ci < len(neuer_header)})
            except ValueError:
                reader = csv.reader(io.StringIO(roh))
                rows = list(reader)
                if rows:
                    neuer_header = rows[0]
                    for r in rows[1:]:
                        if any(str(v).strip() for v in r):
                            neue_zeilen.append({neuer_header[ci]: str(val) for ci, val in enumerate(r) if ci < len(neuer_header)})

            if not neue_zeilen:
                return {'erfolg': False, 'nachricht': 'Keine Zeilen von der Sync-URL empfangen', 'doc': doc}

            neue_tabelle = tabelle_zu_markdown(neuer_header, neue_zeilen)
            z_text = body.split('\n')
            neuer_body = '\n'.join(z_text[:s_idx]) + '\n' + neue_tabelle + '\n' + '\n'.join(z_text[e_idx + 1:])
            doc_schreiben(pfad, kopf, neuer_body, mtime_erwartet=None)
            return {'erfolg': True, 'nachricht': '%d Zeilen aus Google Sheet aktualisiert' % len(neue_zeilen), 'doc': doc_lesen(pfad)}
        except Exception as e:
            return {'erfolg': False, 'nachricht': 'Abruf von Google Sheet nicht möglich: %s' % e, 'doc': doc}

    elif aktion == 'push':
        if not sync_url:
            raise ApiFehler(400, 'Keine gsheet_sync_url im Frontmatter hinterlegt')
        push_daten = {'rows': [header] + [[z.get(c, '') for c in header] for z in zeilen]}
        try:
            req = urllib.request.Request(sync_url, data=json.dumps(push_daten).encode('utf-8'),
                                         headers={'Content-Type': 'application/json', 'User-Agent': 'VaultUI/1'})
            with urllib.request.urlopen(req, timeout=10) as resp:
                resp.read()
            return {'erfolg': True, 'nachricht': 'Erfolgreich an Google Sheet übertragen', 'doc': doc}
        except Exception as e:
            raise ApiFehler(502, 'Push an Google Sheet fehlgeschlagen: %s' % e)

    else:
        raise ApiFehler(400, 'Unbekannte Aktion: %s' % aktion)
