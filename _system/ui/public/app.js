/* app.js — Oberfläche des Claude_Life-Vaults.
 *
 * Harte Bauregel: in dieser Datei steht kein Bereichs- oder Themenname.
 * Alles entsteht aus Ordnerstruktur und Frontmatter. Ein neuer Ordner in
 * 02_Bereiche/ erscheint ohne Codeänderung.
 */
'use strict';

// ----------------------------------------------------------------- Zustand

const S = {
  index: null,       // { dateien, ordner, andere }
  nachPfad: new Map(),
  status: null,
  bereiche: [],      // [{ slug, pfad, titel, farbe, kopf }]
  schmal: window.matchMedia('(max-width: 899px)').matches,
};

const el = (id) => document.getElementById(id);
const nfc = (s) => (s || '').normalize('NFC');
const heute = () => new Date().toISOString().slice(0, 10);

function h(tag, attrs, ...kinder) {
  const knoten = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') knoten.className = v;
    else if (k === 'html') knoten.innerHTML = v;
    else if (k === 'text') knoten.textContent = v;
    else if (k.startsWith('on')) knoten.addEventListener(k.slice(2), v);
    else if (k === 'style') knoten.setAttribute('style', v);
    else knoten.setAttribute(k, v);
  }
  for (const kind of kinder.flat()) {
    if (kind === null || kind === undefined || kind === false) continue;
    knoten.append(kind.nodeType ? kind : document.createTextNode(String(kind)));
  }
  return knoten;
}

function symbol(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#i-' + name);
  svg.append(use);
  return svg;
}

function toast(text, fehler) {
  const t = el('toast');
  t.textContent = text;
  t.className = fehler ? 'fehler' : '';
  t.hidden = false;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { t.hidden = true; }, fehler ? 6000 : 2600);
}

// -------------------------------------------------------------------- API

async function api(pfad, optionen) {
  const antwort = await fetch(pfad, Object.assign({
    headers: { 'Content-Type': 'application/json' },
  }, optionen || {}));
  let daten = null;
  try { daten = await antwort.json(); } catch (e) { /* leerer Body */ }
  if (!antwort.ok) {
    const fehler = new Error((daten && daten.fehler) || ('HTTP ' + antwort.status));
    fehler.status = antwort.status;
    fehler.daten = daten || {};
    throw fehler;
  }
  return daten;
}

const apiGet = (pfad) => api(pfad);
const apiPost = (pfad, koerper) => api(pfad, { method: 'POST', body: JSON.stringify(koerper) });
const apiPut = (pfad, koerper) => api(pfad, { method: 'PUT', body: JSON.stringify(koerper) });

// ------------------------------------------------------------- Hilfsdaten

function kopfVon(pfad) {
  const d = S.nachPfad.get(nfc(pfad));
  return (d && d.kopf) || {};
}

function titelVon(d) {
  if (!d) return '';
  const t = d.kopf && d.kopf.titel;
  if (t) return t;
  const name = d.pfad.split('/').pop().replace(/\.md$/, '');
  if (name === '_projekt' || name === '_bereich') {
    return d.pfad.split('/').slice(-2, -1)[0] || name;
  }
  return name;
}

/** Farbe eines Bereichs: Frontmatter-Feld `farbe`, sonst deterministisch
 *  aus dem Namen gehasht — ein neuer Bereich hat sofort eine stabile Farbe. */
function bereichsFarbe(name, farbe) {
  if (farbe) return farbe;
  let hash = 0;
  const s = nfc(name);
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) % 360;
  const dunkel = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return dunkel ? `hsl(${hash} 55% 62%)` : `hsl(${hash} 48% 38%)`;
}

function bereicheSammeln() {
  const gefunden = new Map();
  for (const ordner of S.index.ordner) {
    const teile = ordner.split('/');
    if (teile[0] === '02_Bereiche' && teile.length === 2) {
      const slug = teile[1];
      const d = S.nachPfad.get(ordner + '/_bereich.md');
      const kopf = (d && d.kopf) || {};
      gefunden.set(slug, {
        slug,
        ordner,
        pfad: d ? d.pfad : null,
        titel: kopf.titel || slug,
        kopf,
        farbe: bereichsFarbe(slug, kopf.farbe),
      });
    }
  }
  return [...gefunden.values()].sort((a, b) => a.titel.localeCompare(b.titel, 'de'));
}

function relativeZeit(mtime) {
  const sekunden = Date.now() / 1000 - mtime;
  const tage = Math.floor(sekunden / 86400);
  if (sekunden < 3600) return Math.max(1, Math.floor(sekunden / 60)) + ' Min';
  if (sekunden < 86400) return Math.floor(sekunden / 3600) + ' Std';
  if (tage === 1) return 'gestern';
  if (tage < 31) return tage + ' Tage';
  if (tage < 365) return Math.floor(tage / 30) + ' Mon';
  return Math.floor(tage / 365) + ' Jahre';
}

function tageBis(datum) {
  if (!datum || !/^\d{4}-\d{2}-\d{2}$/.test(datum.trim())) return null;
  const ziel = new Date(datum.trim() + 'T00:00:00');
  const jetzt = new Date(heute() + 'T00:00:00');
  return Math.round((ziel - jetzt) / 86400000);
}

function fristText(datum) {
  const t = tageBis(datum);
  if (t === null) return { text: datum || '—', klasse: '' };
  if (t < 0) return { text: Math.abs(t) + ' Tage überfällig', klasse: 'warn' };
  if (t === 0) return { text: 'heute', klasse: 'warn' };
  if (t <= 14) return { text: 'in ' + t + ' Tagen', klasse: 'warn' };
  return { text: 'in ' + t + ' Tagen', klasse: 'leise' };
}

const routeDoc = (pfad) => '#/doc/' + pfad.split('/').map(encodeURIComponent).join('/');
const routeEdit = (pfad) => '#/edit/' + pfad.split('/').map(encodeURIComponent).join('/');
const routeOrdner = (pfad) => '#/ordner/' + pfad.split('/').map(encodeURIComponent).join('/');

// ------------------------------------------------------------ Seitenleiste

function seitenleisteZeichnen() {
  const nav = el('seitenleiste');
  nav.textContent = '';
  const aktuell = decodeURIComponent(location.hash.slice(2) || '');

  nav.append(h('div', { class: 'nav-gruppe' },
    h('a', { class: 'nav-eintrag' + (location.hash === '#/' || !location.hash ? ' aktiv' : ''), href: '#/' },
      symbol('home'), 'Dashboard'),
    h('a', { class: 'nav-eintrag', href: '#/filter?typ=projekt&status=aktiv' },
      symbol('doc'), 'Aktive Projekte',
      h('span', { class: 'zahl' }, String((S.status && S.status.aktive_projekte.length) || 0))),
    h('a', { class: 'nav-eintrag', href: '#/status' }, symbol('git'), 'System'),
  ));

  // Wurzelordner exakt so, wie sie im Vault liegen — keine feste Liste
  const wurzeln = S.index.ordner.filter((o) => !o.includes('/')).sort();
  const gruppe = h('div', { class: 'nav-gruppe' }, h('div', { class: 'nav-titel' }, 'Ablage'));
  for (const ordner of wurzeln) {
    const anzahl = S.index.dateien.filter((d) => d.pfad.startsWith(ordner + '/')).length;
    const ist = aktuell.startsWith('ordner/' + ordner);
    gruppe.append(h('a', {
      class: 'nav-eintrag' + (ist ? ' aktiv' : ''),
      href: routeOrdner(ordner),
    }, symbol('ordner'), ordner.replace(/^\d+_/, ''), h('span', { class: 'zahl' }, String(anzahl))));

    if (ordner === '02_Bereiche') {
      for (const b of S.bereiche) {
        gruppe.append(h('a', {
          class: 'nav-eintrag tief' + (aktuell.includes(b.ordner) ? ' aktiv' : ''),
          href: b.pfad ? routeDoc(b.pfad) : routeOrdner(b.ordner),
          style: '--bereich-farbe:' + b.farbe,
        }, h('span', { class: 'punkt' }), b.titel));
      }
    }
  }
  nav.append(gruppe);

  nav.append(h('div', { class: 'nav-gruppe' },
    h('div', { class: 'nav-titel' }, 'Aktionen'),
    h('button', { class: 'nav-eintrag', onclick: neuOverlay }, symbol('plus'), 'Neu anlegen'),
    h('button', { class: 'nav-eintrag', onclick: commitOverlay }, symbol('git'), 'Commit & Push'),
  ));
}

function kopfStatusZeichnen() {
  const ziel = el('kopf-status');
  ziel.textContent = '';
  if (!S.status) return;
  const st = S.status;
  if (st.konfliktkopien.length) {
    ziel.append(h('a', { class: 'chip warn', href: '#/status' },
      String(st.konfliktkopien.length), 'Konfliktkopien'));
  }
  if (st.inbox > 0) {
    ziel.append(h('a', { class: 'chip warn', href: routeOrdner('00_Inbox') }, 'Inbox ', String(st.inbox)));
  }
  const offen = st.aenderungen.length;
  ziel.append(h('button', {
    class: 'chip' + (offen ? '' : ' gut'),
    onclick: commitOverlay,
    title: offen ? st.aenderungen.join('\n') : 'Arbeitsverzeichnis ist sauber',
  }, offen ? offen + ' ungesichert' : 'gesichert'));
}

// ---------------------------------------------------------- Markdown → DOM

/** Markdown rendern und nachbearbeiten: relative Links relativ zum
 *  Quellverzeichnis auflösen, gegen den Index prüfen, Tabellen wrappen. */
function markdownZeichnen(body, quellpfad) {
  const behaelter = h('div', { class: 'doku' });
  behaelter.innerHTML = window.marked.parse(body, { gfm: true, breaks: false, headerIds: false, mangle: false });
  const basis = quellpfad.split('/').slice(0, -1);

  for (const a of behaelter.querySelectorAll('a[href]')) {
    const roh = a.getAttribute('href');
    if (/^(https?:|mailto:|tel:)/i.test(roh)) {
      a.target = '_blank';
      a.rel = 'noopener';
      continue;
    }
    if (roh.startsWith('#')) continue;

    const [pfadteil, anker] = roh.split('#');
    const ziel = nfc(aufloesen(basis, decodeURI(pfadteil)));
    if (/\.md$/i.test(ziel)) {
      if (S.nachPfad.has(ziel)) {
        a.setAttribute('href', routeDoc(ziel) + (anker ? '#' + anker : ''));
      } else {
        a.classList.add('tot');
        a.setAttribute('href', routeDoc(ziel));
        a.title = 'Ziel existiert nicht: ' + ziel;
      }
    } else if (ziel) {
      a.setAttribute('href', '/api/datei?pfad=' + encodeURIComponent(ziel));
      a.target = '_blank';
      a.rel = 'noopener';
    }
  }

  for (const img of behaelter.querySelectorAll('img[src]')) {
    const roh = img.getAttribute('src');
    if (!/^(https?:|data:)/i.test(roh)) {
      img.setAttribute('src', '/api/datei?pfad=' + encodeURIComponent(nfc(aufloesen(basis, decodeURI(roh)))));
    }
  }

  for (const tabelle of behaelter.querySelectorAll('table')) {
    const wrapper = h('div', { class: 'tabelle-scroll' });
    tabelle.replaceWith(wrapper);
    wrapper.append(tabelle);
  }

  return behaelter;
}

function aufloesen(basisTeile, ziel) {
  if (!ziel) return '';
  if (ziel.startsWith('/')) return ziel.replace(/^\/+/, '');
  const teile = basisTeile.slice();
  for (const stueck of ziel.split('/')) {
    if (stueck === '' || stueck === '.') continue;
    if (stueck === '..') teile.pop();
    else teile.push(stueck);
  }
  return teile.join('/');
}

// ------------------------------------------------------------- Dashboard

function ansichtDashboard() {
  const inhalt = el('inhalt');
  inhalt.textContent = '';
  el('app').classList.remove('mit-rechts');
  el('rechts').hidden = true;

  const st = S.status || { aktive_projekte: [], konfliktkopien: [], ohne_frontmatter: [], grosse_dateien: [], inbox: 0, aenderungen: [] };

  inhalt.append(h('div', { class: 'seitenkopf' },
    h('h1', {}, 'Überblick'),
    h('span', { class: 'pfadzeile' }, S.index.dateien.length + ' Notizen'),
    h('div', { class: 'werkzeuge' },
      h('button', { class: 'knopf', onclick: neuOverlay }, symbol('plus'), 'Neu'),
      h('button', { class: 'knopf', onclick: commitOverlay }, symbol('git'), 'Commit'),
    ),
  ));

  const raster = h('div', { class: 'raster' });

  // Aktive Projekte mit Countdown und Fortschritt aus dem Checkbox-Anteil
  const projekte = h('div', { class: 'kachel' }, h('h3', {}, symbol('doc'), 'Aktive Projekte'));
  if (!st.aktive_projekte.length) {
    projekte.append(h('div', { class: 'leise' }, 'Keine aktiven Projekte.'));
  }
  for (const p of st.aktive_projekte) {
    const box = p.checkboxen || { offen: 0, gesamt: 0 };
    const anteil = box.gesamt ? Math.round(((box.gesamt - box.offen) / box.gesamt) * 100) : 0;
    const frist = fristText(p.deadline);
    const zeile = h('div', { class: 'kachelzeile' },
      h('a', { class: 'haupt', href: routeDoc(p.pfad) }, p.titel),
      h('span', { class: 'neben ' + frist.klasse }, frist.text));
    projekte.append(zeile);
    if (box.gesamt) {
      projekte.append(h('div', { class: 'balken', title: (box.gesamt - box.offen) + ' von ' + box.gesamt + ' erledigt' },
        h('i', { style: 'width:' + anteil + '%' })));
    }
  }
  if (st.aktive_projekte.length >= 3) {
    projekte.append(h('div', { class: 'leise', style: 'margin-top:var(--s-2);font-size:12px' },
      st.aktive_projekte.length + ' von maximal 3 — die Grenze ist erreicht.'));
  }
  raster.append(projekte);

  // Inbox
  const inbox = h('div', { class: 'kachel' + (st.inbox > 0 ? ' warnung' : '') },
    h('h3', {}, symbol('ordner'), 'Inbox'),
    h('div', { class: 'zahl-gross' + (st.inbox > 0 ? ' warn' : ' gut') }, String(st.inbox)),
    h('div', { class: 'leise', style: 'font-size:12px' },
      st.inbox > 0 ? 'wöchentlich auf null bringen' : 'leer — Regel erfüllt'),
    h('a', { class: 'knopf', style: 'margin-top:var(--s-2)', href: routeOrdner('00_Inbox') }, 'Öffnen'),
  );
  raster.append(inbox);

  // Je eine Kachel pro Ordner in 02_Bereiche/ — datengetrieben
  for (const b of S.bereiche) {
    const zugehoerig = S.index.dateien.filter((d) =>
      d.pfad !== b.pfad && (
        (d.kopf && (d.kopf.bereich === b.slug || d.kopf.bereich === b.titel)) ||
        d.pfad.split('/').includes(b.slug)));
    const kachel = h('div', { class: 'kachel bereich', style: '--bereich-farbe:' + b.farbe },
      h('h3', {}, h('span', { class: 'punkt', style: '--bereich-farbe:' + b.farbe }), b.titel));
    const chips = h('div', { class: 'chipreihe', style: 'margin-bottom:var(--s-2)' });
    for (const feld of ['status', 'pruefrhythmus', 'rhythmus']) {
      if (b.kopf[feld]) chips.append(h('span', { class: 'chip' }, h('b', {}, feld), b.kopf[feld]));
    }
    if (chips.children.length) kachel.append(chips);
    for (const d of zugehoerig.slice(0, 4)) {
      kachel.append(h('div', { class: 'kachelzeile' },
        h('a', { class: 'haupt', href: routeDoc(d.pfad) }, titelVon(d)),
        h('span', { class: 'neben' }, relativeZeit(d.mtime))));
    }
    if (zugehoerig.length > 4) {
      kachel.append(h('div', { class: 'kachelzeile' },
        h('a', { class: 'haupt leise', href: routeOrdner(b.ordner) },
          'und ' + (zugehoerig.length - 4) + ' weitere')));
    }
    if (b.pfad) {
      kachel.append(h('a', { class: 'knopf', style: 'margin-top:var(--s-2)', href: routeDoc(b.pfad) }, 'Bereichsnotiz'));
    }
    raster.append(kachel);
  }

  // Anstehende Fristen: alles mit deadline oder frist
  const mitFrist = S.index.dateien
    .map((d) => ({ d, datum: (d.kopf && (d.kopf.deadline || d.kopf.frist)) || null }))
    .filter((x) => tageBis(x.datum) !== null)
    .filter((x) => !(x.d.kopf && ['erledigt', 'gestrichen'].includes(x.d.kopf.status)))
    .sort((a, b) => a.datum.localeCompare(b.datum))
    .slice(0, 8);
  const fristen = h('div', { class: 'kachel' }, h('h3', {}, symbol('warn'), 'Anstehende Fristen'));
  if (!mitFrist.length) fristen.append(h('div', { class: 'leise' }, 'Keine Fristen im Bestand.'));
  for (const x of mitFrist) {
    const f = fristText(x.datum);
    fristen.append(h('div', { class: 'kachelzeile' },
      h('a', { class: 'haupt', href: routeDoc(x.d.pfad) }, titelVon(x.d)),
      h('span', { class: 'neben ' + f.klasse }, x.datum)));
  }
  raster.append(fristen);

  // Zuletzt geändert
  const letzte = S.index.dateien.slice().sort((a, b) => b.mtime - a.mtime).slice(0, 8);
  const zuletzt = h('div', { class: 'kachel' }, h('h3', {}, symbol('stift'), 'Zuletzt geändert'));
  for (const d of letzte) {
    zuletzt.append(h('div', { class: 'kachelzeile' },
      h('a', { class: 'haupt', href: routeDoc(d.pfad) }, titelVon(d)),
      h('span', { class: 'neben' }, relativeZeit(d.mtime))));
  }
  raster.append(zuletzt);

  // Systemzustand
  const system = h('div', { class: 'kachel' + (st.konfliktkopien.length ? ' warnung' : '') },
    h('h3', {}, symbol('git'), 'Systemzustand'));
  const zeilen = [
    ['Letzter Commit', st.letzter_commit || '—', ''],
    ['Ungesicherte Änderungen', String(st.aenderungen.length), st.aenderungen.length ? '' : 'gut'],
    ['Konfliktkopien', String(st.konfliktkopien.length), st.konfliktkopien.length ? 'warn' : 'gut'],
    ['Ohne Frontmatter', String(st.ohne_frontmatter.length), st.ohne_frontmatter.length ? 'warn' : 'gut'],
    ['Getrackt über 2 MB', String(st.grosse_dateien.length), st.grosse_dateien.length ? 'warn' : 'gut'],
  ];
  for (const [name, wert, klasse] of zeilen) {
    system.append(h('div', { class: 'kachelzeile' },
      h('span', { class: 'haupt leise' }, name),
      h('span', { class: 'neben ' + klasse }, wert)));
  }
  system.append(h('a', { class: 'knopf', style: 'margin-top:var(--s-2)', href: '#/status' }, 'Details'));
  raster.append(system);

  inhalt.append(raster);
}

// ---------------------------------------------------------------- Liste

/** Spalten aus der Treffermenge berechnen: Schlüssel, die in mindestens
 *  60 % der Zeilen vorkommen. Ein neues Frontmatter-Feld wird dadurch
 *  automatisch zur Spalte. */
function spaltenBerechnen(dateien) {
  const zaehler = new Map();
  for (const d of dateien) {
    for (const [k, v] of Object.entries(d.kopf || {})) {
      if (k === 'titel' || v === null || v === '') continue;
      zaehler.set(k, (zaehler.get(k) || 0) + 1);
    }
  }
  const grenze = Math.max(1, Math.ceil(dateien.length * 0.6));
  const maximal = S.schmal ? 2 : 5;
  return [...zaehler.entries()]
    .filter(([, n]) => n >= grenze)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, maximal)
    .map(([k]) => k);
}

function listeZeichnen(dateien, spalten) {
  const tabelle = h('table', { class: 'liste' });
  const kopf = h('tr', {}, h('th', {}, 'Titel'), spalten.map((s) => h('th', {}, s)),
    h('th', { class: 'zahl' }, 'geändert'), h('th', {}, ''));
  tabelle.append(h('thead', {}, kopf));
  const koerper = h('tbody');
  for (const d of dateien) {
    const zellen = [h('td', {}, h('a', { href: routeDoc(d.pfad) }, titelVon(d)))];
    for (const s of spalten) {
      const wert = (d.kopf || {})[s] || '';
      const f = /^\d{4}-\d{2}-\d{2}$/.test(String(wert).trim()) && (s === 'deadline' || s === 'frist')
        ? fristText(wert) : null;
      zellen.push(h('td', { class: f ? f.klasse : '', title: String(wert) }, String(wert)));
    }
    zellen.push(h('td', { class: 'zahl leise' }, relativeZeit(d.mtime)));
    zellen.push(h('td', {}, h('a', { class: 'symbolknopf', href: routeEdit(d.pfad), title: 'Bearbeiten' }, symbol('stift'))));
    koerper.append(h('tr', {}, zellen));
  }
  tabelle.append(koerper);
  if (!dateien.length) return h('div', { class: 'leise' }, 'Keine Einträge.');
  return tabelle;
}

/** Brotkrumen für einen Ordnerpfad — jedes Segment außer dem letzten
 *  verlinkt auf den jeweiligen Vorfahren, damit tiefe Strukturen
 *  (z. B. 03_Ressourcen/warhammer/malen/rezepte) navigierbar bleiben. */
function brotkrumenZeichnen(ordner) {
  const teile = ordner.split('/');
  const zeile = h('span', { class: 'pfadzeile' });
  let pfad = '';
  teile.forEach((teil, i) => {
    pfad = pfad ? pfad + '/' + teil : teil;
    if (i > 0) zeile.append(' / ');
    zeile.append(i === teile.length - 1 ? teil : h('a', { href: routeOrdner(pfad) }, teil));
  });
  return zeile;
}

/** Direkte Unterordner eines Ordners, ohne `_anhaenge` — das ist laut
 *  CLAUDE.md eine Systemkonvention für Anhänge, keine Themenstruktur, und
 *  die enthaltenen Dateien erscheinen ohnehin schon in der Dateien-Sektion. */
function unterordnerDirekt(ordner) {
  return S.index.ordner.filter((o) =>
    o.startsWith(ordner + '/') && o.slice(ordner.length + 1).indexOf('/') === -1
    && o.split('/').pop() !== '_anhaenge');
}

/** Übersichtskacheln für die direkten Unterordner eines Ordners: rekursive
 *  Notizzahl, die eigenen Unterordner als Chips (zweite Ebene ohne Klick
 *  sichtbar), Vorschau der zuletzt geänderten Notizen. Bildet mehrstufige
 *  Themenstrukturen wie bauen/malen/rezepte oder spielen/40k ab, ohne dass
 *  ein Name davon im Code steht — entsteht rein aus S.index.ordner. */
function strukturRasterZeichnen(unterordner) {
  const raster = h('div', { class: 'raster' });
  for (const o of unterordner) {
    const rekursiv = S.index.dateien.filter((d) => d.pfad.startsWith(o + '/'));
    const enkel = unterordnerDirekt(o);

    const kachel = h('div', { class: 'kachel' },
      h('h3', {}, symbol('ordner'), o.split('/').pop(),
        h('span', { style: 'margin-left:auto;font-weight:400;text-transform:none;letter-spacing:0' },
          String(rekursiv.length))));

    if (enkel.length) {
      const chips = h('div', { class: 'chipreihe', style: 'margin-bottom:var(--s-2)' });
      for (const e of enkel) {
        const n = S.index.dateien.filter((d) => d.pfad.startsWith(e + '/')).length;
        chips.append(h('a', { class: 'chip', href: routeOrdner(e) }, e.split('/').pop(), h('b', {}, String(n))));
      }
      kachel.append(chips);
    }

    const vorschau = rekursiv.slice().sort((a, b) => b.mtime - a.mtime).slice(0, 4);
    if (!vorschau.length) kachel.append(h('div', { class: 'leise' }, 'Noch leer.'));
    for (const d of vorschau) {
      kachel.append(h('div', { class: 'kachelzeile' },
        h('a', { class: 'haupt', href: routeDoc(d.pfad) }, titelVon(d)),
        h('span', { class: 'neben' }, relativeZeit(d.mtime))));
    }
    kachel.append(h('a', { class: 'knopf', style: 'margin-top:var(--s-2)', href: routeOrdner(o) }, 'Öffnen'));
    raster.append(kachel);
  }
  return raster;
}

function ansichtOrdner(ordner) {
  const inhalt = el('inhalt');
  inhalt.textContent = '';
  el('app').classList.remove('mit-rechts');
  el('rechts').hidden = true;

  const unterordner = unterordnerDirekt(ordner);
  const dateien = S.index.dateien.filter((d) => d.pfad.split('/').slice(0, -1).join('/') === ordner)
    .sort((a, b) => a.pfad.localeCompare(b.pfad, 'de'));
  const andere = S.index.andere.filter((f) => f.pfad.startsWith(ordner + '/'));

  inhalt.append(h('div', { class: 'seitenkopf' },
    h('h1', {}, ordner.split('/').pop().replace(/^\d+_/, '')),
    brotkrumenZeichnen(ordner),
    h('div', { class: 'werkzeuge' },
      h('button', { class: 'knopf', onclick: () => neuOverlay(ordner) }, symbol('plus'), 'Neu hier')),
  ));

  if (unterordner.length) {
    inhalt.append(h('h2', { class: 'abschnitt' }, 'Struktur (' + unterordner.length + ')'));
    inhalt.append(strukturRasterZeichnen(unterordner));
  }

  inhalt.append(h('h2', { class: 'abschnitt' },
    (unterordner.length ? 'Notizen direkt hier' : 'Notizen') + ' (' + dateien.length + ')'));
  inhalt.append(listeZeichnen(dateien, spaltenBerechnen(dateien)));

  if (andere.length) {
    inhalt.append(h('h2', { class: 'abschnitt' }, 'Dateien'));
    const reihe = h('div', { class: 'chipreihe' });
    for (const f of andere) {
      reihe.append(h('a', {
        class: 'chip', href: '/api/datei?pfad=' + encodeURIComponent(f.pfad), target: '_blank', rel: 'noopener',
      }, f.pfad.split('/').pop(), h('b', {}, (f.groesse / 1048576).toFixed(1) + ' MB')));
    }
    inhalt.append(reihe);
  }
}

function ansichtFilter(query) {
  const inhalt = el('inhalt');
  inhalt.textContent = '';
  el('app').classList.remove('mit-rechts');
  el('rechts').hidden = true;

  const parameter = new URLSearchParams(query);
  let dateien = S.index.dateien.slice();
  const beschreibung = [];
  for (const [k, v] of parameter.entries()) {
    dateien = dateien.filter((d) => (d.kopf || {})[k] === v);
    beschreibung.push(k + ' = ' + v);
  }
  dateien.sort((a, b) => b.mtime - a.mtime);

  inhalt.append(h('div', { class: 'seitenkopf' },
    h('h1', {}, 'Filter'),
    h('span', { class: 'pfadzeile' }, beschreibung.join(', ') || 'alle'),
  ));
  inhalt.append(listeZeichnen(dateien, spaltenBerechnen(dateien)));
}

// ------------------------------------------------------------- Dokument

async function ansichtDoc(pfad) {
  const inhalt = el('inhalt');
  inhalt.textContent = '';
  let doc;
  try {
    doc = await apiGet('/api/doc?pfad=' + encodeURIComponent(pfad));
  } catch (e) {
    inhalt.append(h('div', { class: 'meldung fehler' }, e.message));
    return;
  }

  const kopf = doc.frontmatter || {};
  const titel = kopf.titel || pfad.split('/').pop().replace(/\.md$/, '');

  inhalt.append(h('div', { class: 'seitenkopf' },
    h('h1', {}, titel),
    h('span', { class: 'pfadzeile' }, pfad),
    h('div', { class: 'werkzeuge' },
      h('a', { class: 'knopf stark', href: routeEdit(pfad) }, symbol('stift'), 'Bearbeiten'),
      !pfad.startsWith('04_Archiv/') && h('button', {
        class: 'knopf', onclick: () => archivieren(pfad, titel),
      }, symbol('archiv'), 'Archivieren'),
    ),
  ));

  if (!doc.frontmatter) {
    inhalt.append(h('div', { class: 'meldung' },
      'Diese Datei hat keinen Frontmatter-Kopf. Nachtragen gehört in den Struktur-Skill, nicht in einen stillen Automatismus.'));
  } else {
    const chips = h('div', { class: 'chipreihe', style: 'margin-bottom:var(--s-4)' });
    for (const [k, v] of Object.entries(kopf)) {
      if (v === null || v === '') continue;
      const istFrist = (k === 'deadline' || k === 'frist');
      const f = istFrist ? fristText(v) : null;
      chips.append(h('span', {
        class: 'chip' + (f && f.klasse === 'warn' ? ' warn' : ''),
        title: f ? f.text : '',
      }, h('b', {}, k), String(v)));
    }
    inhalt.append(chips);
  }

  const doku = markdownZeichnen(doc.body, pfad);
  checkboxenVerdrahten(doku, doc);
  inhalt.append(doku);

  // Bereichsnotiz mit gleichnamigem Ressourcenordner: Struktur spiegeln.
  // Feldrolle, keine Themenerkennung — greift für jeden 02_Bereiche/<slug>/,
  // zu dem ein 03_Ressourcen/<slug>/ mit Inhalt existiert.
  if (kopf.typ === 'bereich' && pfad.startsWith('02_Bereiche/')) {
    const slug = pfad.split('/').slice(-2, -1)[0];
    const ressourcenOrdner = '03_Ressourcen/' + slug;
    if (S.index.ordner.includes(ressourcenOrdner)) {
      const unter = unterordnerDirekt(ressourcenOrdner);
      const direkt = S.index.dateien.filter((d) =>
        d.pfad.split('/').slice(0, -1).join('/') === ressourcenOrdner);
      if (unter.length || direkt.length) {
        inhalt.append(h('h2', { class: 'abschnitt' }, 'Ressourcen-Struktur'),
          h('div', { class: 'pfadzeile', style: 'margin:calc(-1 * var(--s-2)) 0 var(--s-3)' },
            h('a', { href: routeOrdner(ressourcenOrdner) }, ressourcenOrdner)));
        if (direkt.length) {
          const chips = h('div', { class: 'chipreihe', style: 'margin-bottom:var(--s-3)' });
          for (const d of direkt) chips.append(h('a', { class: 'chip', href: routeDoc(d.pfad) }, titelVon(d)));
          inhalt.append(chips);
        }
        if (unter.length) inhalt.append(strukturRasterZeichnen(unter));
      }
    }
  }

  // Rechte Spalte: Inhaltsverzeichnis, Rückwärtslinks, Anhänge
  const rechts = el('rechts');
  rechts.textContent = '';
  const h2 = [...doku.querySelectorAll('h2')];
  if (h2.length) {
    rechts.append(h('h2', { class: 'abschnitt' }, 'Inhalt'));
    const verzeichnis = h('nav', { class: 'inhaltsverzeichnis' });
    h2.forEach((knoten, i) => {
      const id = 'h2-' + i;
      knoten.id = id;
      verzeichnis.append(h('a', {
        href: '#' + id,
        onclick: (ev) => { ev.preventDefault(); knoten.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
      }, knoten.textContent));
    });
    rechts.append(verzeichnis);
  }

  if (doc.rueckwaerts.length) {
    rechts.append(h('h2', { class: 'abschnitt' }, 'Verlinkt von'));
    for (const q of doc.rueckwaerts) {
      rechts.append(h('a', { class: 'trefferzeile', href: routeDoc(q) },
        h('div', { class: 'titel' }, titelVon(S.nachPfad.get(q)) || q),
        h('div', { class: 'kontext' }, q)));
    }
  }

  const ordner = pfad.split('/').slice(0, -1).join('/');
  const anhaenge = S.index.andere.filter((f) => f.pfad.startsWith(ordner + '/_anhaenge/'));
  if (anhaenge.length) {
    rechts.append(h('h2', { class: 'abschnitt' }, 'Anhänge'));
    for (const a of anhaenge) {
      rechts.append(h('a', {
        class: 'trefferzeile', href: '/api/datei?pfad=' + encodeURIComponent(a.pfad),
        target: '_blank', rel: 'noopener',
      }, h('div', { class: 'titel' }, a.pfad.split('/').pop()),
        h('div', { class: 'kontext' }, (a.groesse / 1048576).toFixed(1) + ' MB')));
    }
  }
  const hatRechts = rechts.children.length > 0;
  rechts.hidden = !hatRechts;
  el('app').classList.toggle('mit-rechts', hatRechts);
}

/** Checkboxen im gerenderten Dokument anklickbar machen: die n-te Box im
 *  DOM entspricht der n-ten Checkbox-Zeile im Body. */
function checkboxenVerdrahten(doku, doc) {
  const boxen = [...doku.querySelectorAll('input[type=checkbox]')];
  const muster = /^([ \t]*[-*] \[)([ xX])(\])/gm;
  boxen.forEach((box, i) => {
    box.disabled = false;
    box.addEventListener('change', async () => {
      let n = 0;
      const neu = doc.body.replace(muster, (treffer, vor, zeichen, nach) =>
        (n++ === i ? vor + (box.checked ? 'x' : ' ') + nach : treffer));
      try {
        const antwort = await apiPut('/api/doc', {
          pfad: doc.pfad, frontmatter: doc.frontmatter, body: neu, mtime_erwartet: doc.mtime,
        });
        doc.body = neu;
        doc.mtime = antwort.mtime;
        toast('Gespeichert.');
        indexLaden();
      } catch (e) {
        box.checked = !box.checked;
        toast(e.status === 409 ? 'Die Datei wurde inzwischen geändert — neu laden.' : e.message, true);
      }
    });
  });
}

// ---------------------------------------------------------------- Editor

async function ansichtEdit(pfad) {
  const inhalt = el('inhalt');
  inhalt.textContent = '';
  el('app').classList.remove('mit-rechts');
  el('rechts').hidden = true;

  let doc;
  try {
    doc = await apiGet('/api/doc?pfad=' + encodeURIComponent(pfad));
  } catch (e) {
    inhalt.append(h('div', { class: 'meldung fehler' }, e.message));
    return;
  }

  const entwurfSchluessel = 'entwurf:' + pfad;
  const kopfFelder = new Map(Object.entries(doc.frontmatter || {}));

  inhalt.append(h('div', { class: 'seitenkopf' },
    h('h1', {}, 'Bearbeiten'),
    h('span', { class: 'pfadzeile' }, pfad),
    h('div', { class: 'werkzeuge' }, h('a', { class: 'knopf', href: routeDoc(pfad) }, 'Ansehen')),
  ));

  const meldungen = h('div');
  inhalt.append(meldungen);

  const editor = h('div', { class: 'editor' });
  const formular = h('div', { class: 'kopfformular' });
  const eingaben = new Map();
  for (const [k, v] of kopfFelder) {
    const istDatum = ['angelegt', 'deadline', 'frist', 'aktualisiert'].includes(k);
    const eingabe = h('input', {
      type: istDatum ? 'date' : 'text',
      value: v === null ? '' : String(v),
      id: 'fm-' + k,
      readonly: k === 'aktualisiert' ? 'readonly' : null,
      title: k === 'aktualisiert' ? 'Setzt der Server beim Speichern' : null,
    });
    eingaben.set(k, eingabe);
    formular.append(h('label', { for: 'fm-' + k }, k), eingabe);
  }
  if (doc.frontmatter) editor.append(formular);

  const textfeld = h('textarea', { id: 'roh', spellcheck: 'false' });
  textfeld.value = doc.body;

  // Mobile-Toolbar: die Zeichen, die auf iOS am schwersten zu tippen sind
  const werkzeugleiste = h('div', { class: 'chipreihe' });
  for (const [beschriftung, einfuegen] of [
    ['##', '\n## '], ['-', '\n- '], ['To-do', '\n- [ ] '], ['|', ' | '],
    ['`', '`'], ['Link', '[]()'], ['—', '—'],
  ]) {
    werkzeugleiste.append(h('button', {
      class: 'chip',
      onclick: () => {
        const start = textfeld.selectionStart;
        textfeld.setRangeText(einfuegen, start, textfeld.selectionEnd, 'end');
        textfeld.focus();
      },
    }, beschriftung));
  }
  editor.append(werkzeugleiste, textfeld);

  const speichernKnopf = h('button', { class: 'knopf stark' }, 'Speichern');
  const vorschauKnopf = h('button', { class: 'knopf' }, 'Vorschau');
  const leiste = h('div', { class: 'editorleiste' },
    h('span', { class: 'leise', id: 'entwurf-hinweis' }, ''),
    h('div', { class: 'rechtsbuendig' }, vorschauKnopf, speichernKnopf));
  editor.append(leiste);

  const vorschau = h('div', { hidden: true });
  editor.append(vorschau);
  inhalt.append(editor);

  // Entwurf aus localStorage anbieten (beforeunload hilft auf iOS nicht)
  const entwurf = localStorage.getItem(entwurfSchluessel);
  if (entwurf && entwurf !== doc.body) {
    const wiederherstellen = h('button', { class: 'knopf' }, 'Entwurf übernehmen');
    const verwerfen = h('button', { class: 'knopf' }, 'Entwurf verwerfen');
    const kasten = h('div', { class: 'meldung' },
      'Es liegt ein nicht gespeicherter Entwurf aus einer früheren Sitzung vor. ',
      h('div', { class: 'chipreihe', style: 'margin-top:var(--s-2)' }, wiederherstellen, verwerfen));
    wiederherstellen.onclick = () => { textfeld.value = entwurf; kasten.remove(); };
    verwerfen.onclick = () => { localStorage.removeItem(entwurfSchluessel); kasten.remove(); };
    meldungen.append(kasten);
  }

  const entwurfTimer = setInterval(() => {
    if (textfeld.value !== doc.body) {
      localStorage.setItem(entwurfSchluessel, textfeld.value);
      el('entwurf-hinweis').textContent = 'Entwurf lokal gesichert';
    }
  }, 3000);
  S.aufraeumen = () => clearInterval(entwurfTimer);

  vorschauKnopf.onclick = () => {
    if (vorschau.hidden) {
      vorschau.textContent = '';
      vorschau.append(markdownZeichnen(textfeld.value, pfad));
      vorschau.hidden = false;
      vorschauKnopf.textContent = 'Vorschau aus';
    } else {
      vorschau.hidden = true;
      vorschauKnopf.textContent = 'Vorschau';
    }
  };

  async function speichern(erzwingen) {
    const neuerKopf = doc.frontmatter ? {} : null;
    if (neuerKopf) {
      for (const [k] of kopfFelder) {
        const wert = eingaben.get(k).value.trim();
        neuerKopf[k] = wert === '' ? null : wert;
      }
    }
    speichernKnopf.disabled = true;
    try {
      const antwort = await apiPut('/api/doc', {
        pfad, frontmatter: neuerKopf, body: textfeld.value,
        mtime_erwartet: erzwingen ? null : doc.mtime,
      });
      doc.mtime = antwort.mtime;
      doc.body = textfeld.value;
      localStorage.removeItem(entwurfSchluessel);
      el('entwurf-hinweis').textContent = '';
      meldungen.textContent = '';
      toast('Gespeichert.');
      await indexLaden();
    } catch (e) {
      if (e.status === 409) {
        konfliktZeigen(meldungen, e.daten.server, textfeld, () => speichern(true));
      } else {
        toast(e.message, true);
      }
    } finally {
      speichernKnopf.disabled = false;
    }
  }
  speichernKnopf.onclick = () => speichern(false);

  textfeld.addEventListener('keydown', (ev) => {
    if ((ev.metaKey || ev.ctrlKey) && ev.key === 's') { ev.preventDefault(); speichern(false); }
  });

  // Aktionsleiste über der iOS-Tastatur halten
  if (window.visualViewport) {
    const anpassen = () => {
      const versatz = window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop;
      leiste.style.transform = versatz > 60 ? 'translateY(-' + Math.round(versatz) + 'px)' : '';
    };
    window.visualViewport.addEventListener('resize', anpassen);
    window.visualViewport.addEventListener('scroll', anpassen);
  }
}

function konfliktZeigen(ziel, server, textfeld, uebernehmen) {
  ziel.textContent = '';
  const meine = textfeld.value;
  const kasten = h('div', { class: 'meldung fehler' },
    h('b', {}, 'Konflikt: die Datei wurde inzwischen anderweitig geändert.'),
    h('div', { style: 'margin:var(--s-2) 0' },
      'Wahrscheinlich Google Drive oder Claude Code. Serverfassung ist ' +
      (server ? relativeZeit(server.mtime) + ' alt' : 'unbekannt') + '.'),
    h('div', { class: 'chipreihe' },
      h('button', { class: 'knopf stark', onclick: uebernehmen }, 'Meine Fassung übernehmen'),
      h('button', {
        class: 'knopf',
        onclick: () => { textfeld.value = server.body; ziel.textContent = ''; toast('Serverfassung geladen.'); },
      }, 'Serverfassung laden (meine verwerfen)'),
      h('button', {
        class: 'knopf',
        onclick: () => {
          const v = h('div', { class: 'meldung' },
            h('b', {}, 'Serverfassung'), h('pre', {}, server.body.slice(0, 4000)),
            h('b', {}, 'Meine Fassung'), h('pre', {}, meine.slice(0, 4000)));
          kasten.after(v);
        },
      }, 'Beide Fassungen zeigen')),
  );
  ziel.append(kasten);
}

// ---------------------------------------------------------------- Status

function ansichtStatus() {
  const inhalt = el('inhalt');
  inhalt.textContent = '';
  el('app').classList.remove('mit-rechts');
  el('rechts').hidden = true;
  const st = S.status;

  inhalt.append(h('div', { class: 'seitenkopf' },
    h('h1', {}, 'Systemzustand'),
    h('div', { class: 'werkzeuge' },
      h('button', { class: 'knopf', onclick: async () => { await indexLaden(); ansichtStatus(); } }, 'Neu prüfen'),
      h('button', { class: 'knopf stark', onclick: commitOverlay }, symbol('git'), 'Commit & Push')),
  ));

  if (!st) { inhalt.append(h('div', { class: 'leise' }, 'Kein Status geladen.')); return; }

  if (st.konfliktkopien.length) {
    inhalt.append(h('div', { class: 'meldung fehler' },
      h('b', {}, 'Sync-Konfliktkopien gefunden — commit.sh bricht damit ab (Exit 2).'),
      h('pre', {}, st.konfliktkopien.join('\n'))));
  }

  const raster = h('div', { class: 'raster' });

  const git = h('div', { class: 'kachel' }, h('h3', {}, symbol('git'), 'Git'));
  git.append(h('div', { class: 'kachelzeile' },
    h('span', { class: 'haupt leise' }, 'Letzter Commit'), h('span', { class: 'neben' }, '')));
  git.append(h('div', { class: 'mono' }, st.letzter_commit || '—'));
  if (st.aenderungen.length) {
    git.append(h('h3', { style: 'margin-top:var(--s-3)' }, st.aenderungen.length + ' ungesicherte Änderungen'));
    git.append(h('pre', { class: 'mono', style: 'white-space:pre-wrap;margin:0' }, st.aenderungen.join('\n')));
  } else {
    git.append(h('div', { class: 'gut' }, 'Arbeitsverzeichnis ist sauber.'));
  }
  raster.append(git);

  const ohne = h('div', { class: 'kachel' + (st.ohne_frontmatter.length ? ' warnung' : '') },
    h('h3', {}, symbol('warn'), 'Ohne Frontmatter (' + st.ohne_frontmatter.length + ')'));
  for (const p of st.ohne_frontmatter) {
    ohne.append(h('div', { class: 'kachelzeile' }, h('a', { class: 'haupt', href: routeDoc(p) }, p)));
  }
  if (!st.ohne_frontmatter.length) ohne.append(h('div', { class: 'gut' }, 'Alle Notizen haben einen Kopf.'));
  raster.append(ohne);

  const gross = h('div', { class: 'kachel' + (st.grosse_dateien.length ? ' warnung' : '') },
    h('h3', {}, symbol('archiv'), 'Getrackt über 2 MB'));
  for (const f of st.grosse_dateien) {
    gross.append(h('div', { class: 'kachelzeile' },
      h('span', { class: 'haupt mono' }, f.pfad),
      h('span', { class: 'neben' }, (f.groesse / 1048576).toFixed(1) + ' MB')));
  }
  if (!st.grosse_dateien.length) gross.append(h('div', { class: 'gut' }, 'Nichts Großes im Repo.'));
  raster.append(gross);

  const regeln = h('div', { class: 'kachel' }, h('h3', {}, symbol('doc'), 'Regeln'));
  const p = st.aktive_projekte.length;
  regeln.append(h('div', { class: 'kachelzeile' },
    h('span', { class: 'haupt leise' }, 'Aktive Projekte (max. 3)'),
    h('span', { class: 'neben ' + (p > 3 ? 'warn' : 'gut') }, String(p))));
  regeln.append(h('div', { class: 'kachelzeile' },
    h('span', { class: 'haupt leise' }, 'Inbox (wöchentlich auf null)'),
    h('span', { class: 'neben ' + (st.inbox ? 'warn' : 'gut') }, String(st.inbox))));
  regeln.append(h('div', { class: 'kachelzeile' },
    h('span', { class: 'haupt leise' }, 'Löschen'),
    h('span', { class: 'neben gut' }, 'keine API vorhanden')));
  raster.append(regeln);

  inhalt.append(raster);
}

// --------------------------------------------------------------- Overlays

function overlayOeffnen(knoten) {
  const overlay = el('overlay');
  overlay.textContent = '';
  overlay.append(knoten);
  overlay.hidden = false;
  el('schleier').hidden = false;
}

function overlaySchliessen() {
  el('overlay').hidden = true;
  el('schleier').hidden = true;
  el('overlay').textContent = '';
}

function sucheOverlay() {
  const treffer = h('div');
  const feld = h('input', { type: 'text', placeholder: 'Im ganzen Vault suchen …', autocapitalize: 'off' });
  let timer = null;

  async function suchen() {
    const q = feld.value.trim();
    if (q.length < 2) { treffer.textContent = ''; return; }
    try {
      const ergebnisse = await apiGet('/api/suche?q=' + encodeURIComponent(q));
      treffer.textContent = '';
      if (!ergebnisse.length) { treffer.append(h('div', { class: 'leise' }, 'Keine Treffer.')); return; }
      for (const e of ergebnisse) {
        const zeile = h('a', {
          class: 'trefferzeile', href: routeDoc(e.pfad), onclick: overlaySchliessen,
        }, h('div', { class: 'titel' }, e.titel), h('div', { class: 'kontext' }, e.pfad));
        for (const t of e.treffer.slice(0, 3)) {
          const k = h('div', { class: 'kontext' });
          const idx = t.kontext.toLowerCase().indexOf(q.toLowerCase());
          if (idx >= 0) {
            k.append(t.kontext.slice(0, idx), h('mark', {}, t.kontext.substr(idx, q.length)),
              t.kontext.slice(idx + q.length));
          } else k.textContent = t.kontext;
          zeile.append(k);
        }
        treffer.append(zeile);
      }
    } catch (e) { toast(e.message, true); }
  }

  feld.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(suchen, 200); });
  feld.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      const erster = treffer.querySelector('a.trefferzeile');
      if (erster) { location.hash = erster.getAttribute('href'); overlaySchliessen(); }
    }
  });

  overlayOeffnen(h('div', {}, h('h2', {}, 'Suchen'), feld, treffer));
  feld.focus();
}

function neuOverlay(vorgabeOrdner) {
  const ordnerListe = S.index.ordner.filter((o) => !o.startsWith('_system') && !o.startsWith('04_Archiv')).sort();
  const typ = h('select', {},
    h('option', { value: 'notiz' }, 'Notiz'),
    h('option', { value: 'projekt' }, 'Projekt'),
    h('option', { value: 'bereich' }, 'Bereich'),
    h('option', { value: 'entscheidung' }, 'Entscheidung'),
    h('option', { value: 'review' }, 'Weekly Review (aktuelle Woche)'));
  const titel = h('input', { type: 'text', placeholder: 'Titel — Umlaute erlaubt, Dateiname wird abgeleitet' });
  const bereich = h('select', {}, h('option', { value: '' }, '— keiner —'),
    S.bereiche.map((b) => h('option', { value: b.slug }, b.titel)));
  const deadline = h('input', { type: 'date' });
  const zielordner = h('select', {}, ordnerListe.map((o) =>
    h('option', { value: o, selected: o === (vorgabeOrdner || '00_Inbox') ? 'selected' : null }, o)));

  const formular = h('div', { class: 'kopfformular' },
    h('label', {}, 'typ'), typ,
    h('label', {}, 'titel'), titel,
    h('label', {}, 'bereich'), bereich,
    h('label', {}, 'deadline / frist'), deadline,
    h('label', {}, 'zielordner'), zielordner);

  const hinweis = h('div', { class: 'leise', style: 'font-size:12px;margin:var(--s-2) 0' });
  const anlegenKnopf = h('button', { class: 'knopf stark' }, 'Anlegen');

  function felderAnpassen() {
    const t = typ.value;
    const zeigen = (label, feld, an) => {
      label.style.display = an ? '' : 'none';
      feld.style.display = an ? '' : 'none';
    };
    const kinder = [...formular.children];
    zeigen(kinder[0], kinder[1], true);
    zeigen(kinder[2], kinder[3], t !== 'review');
    zeigen(kinder[4], kinder[5], t === 'projekt');
    zeigen(kinder[6], kinder[7], t === 'projekt' || t === 'entscheidung');
    zeigen(kinder[8], kinder[9], t === 'notiz' || t === 'entscheidung');
    const ziele = {
      projekt: '01_Projekte/' + heute().slice(0, 7) + '_<slug>/_projekt.md',
      bereich: '02_Bereiche/<slug>/_bereich.md',
      review: '_system/reviews/<ISO-Woche>.md',
      notiz: '<zielordner>/<slug>.md',
      entscheidung: '<zielordner>/<slug>.md',
    };
    hinweis.textContent = 'Zielpfad: ' + ziele[t];
  }
  typ.addEventListener('change', felderAnpassen);
  felderAnpassen();

  async function anlegen(bestaetigt) {
    anlegenKnopf.disabled = true;
    try {
      const antwort = await apiPost('/api/neu', {
        typ: typ.value,
        titel: titel.value,
        bereich: bereich.value || null,
        deadline: deadline.value || null,
        zielordner: zielordner.value,
      });
      if (antwort.warnung && !bestaetigt) {
        // Warnen, nicht blockieren — so formuliert es CLAUDE.md
        toast('Angelegt, aber mit Warnung.');
      }
      await indexLaden();
      overlaySchliessen();
      location.hash = routeEdit(antwort.pfad);
      toast('Angelegt: ' + antwort.pfad);
    } catch (e) {
      toast(e.message, true);
    } finally {
      anlegenKnopf.disabled = false;
    }
  }

  anlegenKnopf.onclick = async () => {
    // Drei-Projekte-Grenze vorab prüfen, damit die zweite Bestätigung
    // kommt, bevor die Datei existiert
    if (typ.value === 'projekt' && S.status && S.status.aktive_projekte.length >= 3) {
      const namen = S.status.aktive_projekte.map((p) => p.titel).join(', ');
      overlayOeffnen(h('div', {},
        h('h2', {}, 'Vierte Baustelle?'),
        h('div', { class: 'meldung fehler' },
          'Es laufen bereits ' + S.status.aktive_projekte.length + ' aktive Projekte: ' + namen +
          '. Die Regel lautet maximal drei — mehr heißt in der Praxis, dass keines vorankommt. ' +
          'Empfehlung: erst eines abschließen oder auf pausiert setzen (Unsicherheit ~15 %).'),
        h('div', { class: 'chipreihe' },
          h('button', { class: 'knopf', onclick: overlaySchliessen }, 'Abbrechen'),
          h('button', { class: 'knopf stark', onclick: () => anlegen(true) }, 'Trotzdem anlegen'))));
      return;
    }
    anlegen(false);
  };

  overlayOeffnen(h('div', {},
    h('h2', {}, 'Neu anlegen'),
    formular, hinweis,
    h('div', { class: 'chipreihe' },
      h('button', { class: 'knopf', onclick: overlaySchliessen }, 'Abbrechen'), anlegenKnopf)));
  titel.focus();
}

async function archivieren(pfad, titel) {
  const name = pfad.split('/').pop();
  const ordnerHinweis = (name === '_projekt.md' || name === '_bereich.md')
    ? ' Der ganze Ordner wandert mit.' : '';
  overlayOeffnen(h('div', {},
    h('h2', {}, 'Archivieren'),
    h('div', { class: 'meldung' },
      '„' + titel + '" bekommt status: erledigt und wandert nach 04_Archiv/' +
      new Date().getFullYear() + '/.' + ordnerHinweis +
      ' Gelöscht wird nichts — dafür gibt es in dieser Oberfläche keine Funktion.'),
    h('div', { class: 'chipreihe' },
      h('button', { class: 'knopf', onclick: overlaySchliessen }, 'Abbrechen'),
      h('button', {
        class: 'knopf stark',
        onclick: async (ev) => {
          ev.target.disabled = true;
          try {
            const antwort = await apiPost('/api/archivieren', { pfad });
            await indexLaden();
            overlaySchliessen();
            if (antwort.gebrochene_links.length) {
              const liste = h('div', {});
              for (const g of antwort.gebrochene_links) {
                liste.append(h('div', { class: 'kachelzeile' },
                  h('a', { class: 'haupt', href: routeDoc(g.quelle) }, g.quelle),
                  h('span', { class: 'neben mono' }, '→ ' + g.ziel)));
              }
              overlayOeffnen(h('div', {},
                h('h2', {}, 'Archiviert — aber Links zeigen ins Leere'),
                h('div', { class: 'meldung fehler' },
                  antwort.gebrochene_links.length + ' Verweise zeigen noch auf den alten Ort. ' +
                  'Fremde Dateien werden absichtlich nicht automatisch umgeschrieben — ' +
                  'das gehört in den Struktur-Skill mit Freigabe.'),
                liste,
                h('div', { class: 'chipreihe' },
                  h('button', { class: 'knopf stark', onclick: overlaySchliessen }, 'Verstanden'))));
            } else {
              toast('Archiviert: ' + antwort.neuer_pfad);
            }
            location.hash = routeDoc(antwort.neuer_pfad);
          } catch (e) {
            toast(e.message, true);
            ev.target.disabled = false;
          }
        },
      }, 'Archivieren'))));
}

function commitOverlay() {
  const st = S.status || { aenderungen: [], konfliktkopien: [] };
  const nachricht = h('input', { type: 'text', placeholder: 'Was hat sich geändert?' });
  const ausgabe = h('div');
  const knopf = h('button', { class: 'knopf stark' }, 'Commit & Push');

  const kasten = h('div', {},
    h('h2', {}, 'Commit & Push'),
    st.konfliktkopien.length
      ? h('div', { class: 'meldung fehler' },
        h('b', {}, 'Konfliktkopien vorhanden — commit.sh würde mit Exit 2 abbrechen.'),
        h('pre', {}, st.konfliktkopien.join('\n')),
        'Erst im Finder prüfen und aufräumen.')
      : h('div', { class: 'leise', style: 'font-size:12px;margin-bottom:var(--s-2)' },
        st.aenderungen.length + ' Änderungen werden committet.'),
    st.aenderungen.length
      ? h('pre', { class: 'mono', style: 'white-space:pre-wrap;max-height:22dvh;overflow:auto' },
        st.aenderungen.join('\n'))
      : h('div', { class: 'gut' }, 'Keine Änderungen.'),
    nachricht,
    h('div', { class: 'chipreihe', style: 'margin-top:var(--s-3)' },
      h('button', { class: 'knopf', onclick: overlaySchliessen }, 'Schließen'), knopf),
    ausgabe);

  if (st.konfliktkopien.length) knopf.disabled = true;

  knopf.onclick = async () => {
    knopf.disabled = true;
    ausgabe.textContent = '';
    ausgabe.append(h('div', { class: 'leise', style: 'margin-top:var(--s-3)' }, 'Läuft — git push kann auf den Schlüsselbund warten …'));
    try {
      const r = await apiPost('/api/commit', { nachricht: nachricht.value });
      ausgabe.textContent = '';
      const klasse = r.code === 0 ? 'meldung' : 'meldung fehler';
      ausgabe.append(h('div', { class: klasse },
        h('b', {}, r.code === 0 ? 'Erfolg.' : 'commit.sh endete mit Exit ' + r.code +
          (r.code === 2 ? ' — Konfliktkopien gefunden.' : '.')),
        r.stdout ? h('pre', {}, r.stdout) : null,
        r.stderr ? h('pre', {}, r.stderr) : null));
      await indexLaden();
      kopfStatusZeichnen();
    } catch (e) {
      ausgabe.textContent = '';
      ausgabe.append(h('div', { class: 'meldung fehler' }, e.message));
    } finally {
      knopf.disabled = st.konfliktkopien.length > 0;
    }
  };

  overlayOeffnen(kasten);
  nachricht.focus();
}

// ---------------------------------------------------------------- Router

async function indexLaden() {
  S.index = await apiGet('/api/tree');
  S.nachPfad = new Map(S.index.dateien.map((d) => [d.pfad, d]));
  S.bereiche = bereicheSammeln();
  try {
    S.status = await apiGet('/api/status');
  } catch (e) {
    S.status = null;
  }
  seitenleiseAktualisieren();
}

function seitenleiseAktualisieren() {
  seitenleisteZeichnen();
  kopfStatusZeichnen();
}

async function route() {
  if (S.aufraeumen) { S.aufraeumen(); S.aufraeumen = null; }
  el('seitenleiste').classList.remove('offen');
  if (el('overlay').hidden) el('schleier').hidden = true;
  window.scrollTo(0, 0);

  const roh = location.hash.slice(2);
  const [pfadteil, query] = roh.split('?');
  const teile = pfadteil.split('/').filter(Boolean).map(decodeURIComponent);
  const ansicht = teile[0] || '';
  const rest = nfc(teile.slice(1).join('/'));

  try {
    if (ansicht === '') ansichtDashboard();
    else if (ansicht === 'doc') await ansichtDoc(rest);
    else if (ansicht === 'edit') await ansichtEdit(rest);
    else if (ansicht === 'ordner') ansichtOrdner(rest);
    else if (ansicht === 'filter') ansichtFilter(query || '');
    else if (ansicht === 'status') ansichtStatus();
    else el('inhalt').textContent = 'Unbekannte Ansicht.';
  } catch (e) {
    el('inhalt').textContent = '';
    el('inhalt').append(h('div', { class: 'meldung fehler' }, e.message));
  }

  seitenleiseAktualisieren();
  for (const knoten of document.querySelectorAll('#tableiste [data-tab]')) {
    knoten.classList.toggle('aktiv', (knoten.getAttribute('href') || '') === (location.hash || '#/'));
  }
}

function verdrahten() {
  window.addEventListener('hashchange', route);
  window.matchMedia('(max-width: 899px)').addEventListener('change', (ev) => {
    S.schmal = ev.matches;
    route();
  });

  el('suche-knopf').onclick = sucheOverlay;
  el('neu-knopf').onclick = () => neuOverlay();
  el('tab-suche').onclick = sucheOverlay;
  el('tab-neu').onclick = () => neuOverlay();
  el('tab-mehr').onclick = () => el('seitenleiste').classList.toggle('offen');
  el('menue-knopf').onclick = () => el('seitenleiste').classList.toggle('offen');
  el('schleier').onclick = () => {
    overlaySchliessen();
    el('seitenleiste').classList.remove('offen');
  };

  document.addEventListener('keydown', (ev) => {
    if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); sucheOverlay(); }
    if (ev.key === 'Escape') { overlaySchliessen(); el('seitenleiste').classList.remove('offen'); }
  });
}

async function start() {
  verdrahten();
  try {
    await indexLaden();
  } catch (e) {
    el('inhalt').append(h('div', { class: 'meldung fehler' },
      e.status === 401
        ? 'Nicht angemeldet. Die Adresse einmal mit ?t=<token> aufrufen — das Token steht in der Konsole des Servers.'
        : 'Index konnte nicht geladen werden: ' + e.message));
    return;
  }
  await route();
}

start();
