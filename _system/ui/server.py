#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""HTTP-Server der Vault-Oberfläche.

Nur Standardbibliothek, /usr/bin/python3 (3.9). Start:

    /usr/bin/python3 _system/ui/server.py

Token kommt aus config.json (beim ersten Start erzeugt) und wird per
Erstaufruf ?t=<token> als HttpOnly-Cookie gesetzt. Zugriff nur aus
privaten Netzen. Kein Delete-Endpunkt — absichtlich.
"""
import hmac
import json
import mimetypes
import os
import secrets
import socket
import subprocess
import threading
import time
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import gitwrap
import vault

UI_DIR = os.path.dirname(os.path.realpath(__file__))
PUBLIC = os.path.join(UI_DIR, 'public')
CONFIG_PFAD = os.path.join(UI_DIR, 'config.json')

COOKIE_NAME = 'vault_token'
MAX_FEHLVERSUCHE = 10
SPERRZEIT = 60  # Sekunden

_fehlversuche = {}  # ip -> [anzahl, gesperrt_bis]
_sperre_lock = threading.Lock()


def config_laden():
    if os.path.isfile(CONFIG_PFAD):
        with open(CONFIG_PFAD, encoding='utf-8') as f:
            return json.load(f)
    cfg = {'port': 4173, 'bind': '0.0.0.0', 'token': secrets.token_hex(16)}
    with open(CONFIG_PFAD, 'w', encoding='utf-8') as f:
        json.dump(cfg, f, indent=2)
    return cfg


CONFIG = config_laden()


def ip_ist_privat(ip):
    if ip.startswith('::ffff:'):
        ip = ip[7:]
    if ip in ('::1', '127.0.0.1', 'localhost'):
        return True
    if ip.startswith(('127.', '192.168.', '10.')):
        return True
    if ip.startswith('172.'):
        teile = ip.split('.')
        try:
            return 16 <= int(teile[1]) <= 31
        except (IndexError, ValueError):
            return False
    return False


class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    server_version = 'VaultUI/1'

    # ------------------------------------------------------------ Helfer

    def log_message(self, fmt, *args):
        pass  # Konsole ruhig halten; Fehler laufen über Statuscodes

    def _senden(self, status, inhalt, content_type='application/json; charset=utf-8',
                extra=None):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(inhalt)))
        self.send_header('Cache-Control', 'no-store')
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(inhalt)

    def _json(self, status, daten, extra=None):
        self._senden(status, json.dumps(daten, ensure_ascii=False).encode('utf-8'),
                     extra=extra)

    def _fehler(self, status, meldung, daten=None):
        antwort = {'fehler': meldung}
        antwort.update(daten or {})
        self._json(status, antwort)

    def _cookie_token(self):
        roh = self.headers.get('Cookie', '')
        for teil in roh.split(';'):
            k, _, w = teil.strip().partition('=')
            if k == COOKIE_NAME:
                return w
        return None

    def _ip(self):
        return self.client_address[0]

    def _gesperrt(self):
        with _sperre_lock:
            eintrag = _fehlversuche.get(self._ip())
            return bool(eintrag and eintrag[1] > time.time())

    def _fehlversuch(self):
        with _sperre_lock:
            eintrag = _fehlversuche.setdefault(self._ip(), [0, 0])
            eintrag[0] += 1
            if eintrag[0] >= MAX_FEHLVERSUCHE:
                eintrag[1] = time.time() + SPERRZEIT
                eintrag[0] = 0

    def _token_ok(self, kandidat):
        if not kandidat:
            return False
        return hmac.compare_digest(str(kandidat), CONFIG['token'])

    def _autorisiert(self):
        return self._token_ok(self._cookie_token() or self.headers.get('X-Vault-Token'))

    def _body_json(self):
        laenge = int(self.headers.get('Content-Length') or 0)
        if laenge <= 0 or laenge > 5 * 1024 * 1024:
            raise vault.ApiFehler(400, 'Fehlende oder zu große Nutzlast')
        try:
            return json.loads(self.rfile.read(laenge).decode('utf-8'))
        except (ValueError, UnicodeDecodeError):
            raise vault.ApiFehler(400, 'Ungültiges JSON')

    # ---------------------------------------------------------- Statisch

    def _statisch(self, name):
        voll = os.path.realpath(os.path.join(PUBLIC, name.lstrip('/')))
        if not voll.startswith(PUBLIC + os.sep) or not os.path.isfile(voll):
            self._fehler(404, 'Nicht gefunden')
            return
        typ = mimetypes.guess_type(voll)[0] or 'application/octet-stream'
        if typ.startswith('text/') or typ in ('application/javascript',):
            typ += '; charset=utf-8'
        with open(voll, 'rb') as f:
            self._senden(200, f.read(), content_type=typ)

    # ----------------------------------------------------------- Routing

    def _pruefe_zugang(self, api):
        """403 bei fremden Netzen, für /api/ zusätzlich 401 ohne Token.

        Die Sperre trifft nur unautorisierte Datenzugriffe. Ein gültiges
        Cookie kommt immer durch, und die App-Shell lädt auch während einer
        Sperre — so zeigt die Seite die Ursache, statt weiß zu bleiben.
        Shell-Dateien enthalten keine Vault-Inhalte.
        """
        if not ip_ist_privat(self._ip()):
            self._fehler(403, 'Nur aus privaten Netzen erreichbar')
            return False
        if not api or self._autorisiert():
            return True
        if self._gesperrt():
            self._fehler(429, 'Zu viele Fehlversuche — 60 Sekunden warten')
            return False
        if self._cookie_token() or self.headers.get('X-Vault-Token'):
            self._fehlversuch()  # nur geratene Token zählen, nicht fehlende
        self._fehler(401, 'Token fehlt oder ist falsch. Aufruf mit ?t=<token> setzt das Cookie.')
        return False

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        pfad = url.path
        query = urllib.parse.parse_qs(url.query)

        if not self._pruefe_zugang(api=pfad.startswith('/api/')):
            return

        # Erstaufruf mit ?t=<token>: Cookie setzen, Token aus der URL entfernen
        if pfad == '/' and 't' in query:
            if self._gesperrt():
                self._fehler(429, 'Zu viele Fehlversuche — 60 Sekunden warten')
            elif self._token_ok(query['t'][0]):
                cookie = ('%s=%s; HttpOnly; SameSite=Strict; Path=/; Max-Age=%d'
                          % (COOKIE_NAME, CONFIG['token'], 90 * 24 * 3600))
                self._senden(302, b'', extra={'Location': '/', 'Set-Cookie': cookie})
            else:
                self._fehlversuch()
                self._fehler(401, 'Falsches Token')
            return

        try:
            if pfad == '/' or pfad == '/index.html':
                self._statisch('index.html')
            elif pfad in ('/app.js', '/style.css', '/md.js'):
                self._statisch(pfad)
            elif pfad == '/api/tree':
                self._json(200, vault.index_scannen())
            elif pfad == '/api/doc':
                self._json(200, vault.doc_lesen(self._param(query, 'pfad')))
            elif pfad == '/api/suche':
                self._json(200, vault.suchen(self._param(query, 'q')))
            elif pfad == '/api/status':
                self._json(200, gitwrap.status())
            elif pfad == '/api/datei':
                self._datei(self._param(query, 'pfad'))
            else:
                self._fehler(404, 'Unbekannter Pfad')
        except vault.ApiFehler as e:
            self._fehler(e.status, e.meldung, e.daten)
        except Exception as e:  # noqa: BLE001 — Server soll nie sterben
            self._fehler(500, 'Interner Fehler: %s' % e)

    def do_POST(self):
        if not self._pruefe_zugang(api=True):
            return
        url = urllib.parse.urlparse(self.path)
        try:
            daten = self._body_json()
            if url.path == '/api/neu':
                self._json(200, vault.neu(
                    daten.get('typ'), daten.get('titel'),
                    bereich=daten.get('bereich'), deadline=daten.get('deadline'),
                    zielordner=daten.get('zielordner')))
            elif url.path == '/api/archivieren':
                self._json(200, vault.archivieren(daten.get('pfad')))
            elif url.path == '/api/commit':
                self._json(200, gitwrap.commit(daten.get('nachricht')))
            else:
                self._fehler(404, 'Unbekannter Pfad')
        except vault.ApiFehler as e:
            self._fehler(e.status, e.meldung, e.daten)
        except Exception as e:  # noqa: BLE001
            self._fehler(500, 'Interner Fehler: %s' % e)

    def do_PUT(self):
        if not self._pruefe_zugang(api=True):
            return
        url = urllib.parse.urlparse(self.path)
        try:
            if url.path == '/api/doc':
                daten = self._body_json()
                self._json(200, vault.doc_schreiben(
                    daten.get('pfad'), daten.get('frontmatter'),
                    daten.get('body', ''), daten.get('mtime_erwartet')))
            else:
                self._fehler(404, 'Unbekannter Pfad')
        except vault.ApiFehler as e:
            self._fehler(e.status, e.meldung, e.daten)
        except Exception as e:  # noqa: BLE001
            self._fehler(500, 'Interner Fehler: %s' % e)

    # ------------------------------------------------------------ Binär

    @staticmethod
    def _param(query, name):
        werte = query.get(name)
        if not werte:
            raise vault.ApiFehler(400, 'Parameter fehlt: %s' % name)
        return werte[0]

    def _datei(self, pfad):
        voll = vault.sicherer_pfad(pfad)  # nur lesend
        if not os.path.isfile(voll):
            raise vault.ApiFehler(404, 'Datei nicht gefunden')
        typ = mimetypes.guess_type(voll)[0] or 'application/octet-stream'
        with open(voll, 'rb') as f:
            self._senden(200, f.read(), content_type=typ)


def bonjour_name():
    """Der .local-Name kommt von LocalHostName, nicht vom DHCP-Hostnamen."""
    try:
        r = subprocess.run(['scutil', '--get', 'LocalHostName'],
                           capture_output=True, text=True, timeout=5)
        name = r.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        name = ''
    if not name:
        name = socket.gethostname().split('.')[0]
    return name.lower() + '.local'


def main():
    server = ThreadingHTTPServer((CONFIG['bind'], CONFIG['port']), Handler)
    rechner = bonjour_name()
    print('Vault-Oberfläche läuft.')
    print('  Lokal:    http://localhost:%d/?t=%s' % (CONFIG['port'], CONFIG['token']))
    print('  Im WLAN:  http://%s:%d/?t=%s' % (rechner, CONFIG['port'], CONFIG['token']))
    print('Der Link mit ?t= setzt das Cookie einmalig; danach reicht die nackte Adresse.')
    print('Beenden mit Ctrl+C.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nGestoppt.')


if __name__ == '__main__':
    main()
