---
titel: Warhammer 40.000 — Grundregeln-Companion
typ: notiz
angelegt: 2026-08-16
---

# Warhammer 40.000 — Grundregeln-Companion

## Zweck

Kompakte Referenz aus den Grundregeln, damit ich (Claude) als Sparringspartner/Spielmeister Regelfragen direkt beantworten und Züge schiedsrichtern kann, ohne das PDF jedes Mal neu zu lesen. Referenznummern in Klammern (z. B. `05.03`) verweisen auf die Originalquelle — bei Detailfragen oder Unklarheiten dort nachschlagen statt zu raten.

**Quelle:** `00_Inbox/ger_01-06_warhammer40k_new40k_core_rules-tj3qhseqbw-uofbfxlnsk.pdf`, 88 Seiten, „Grundregeln". Dateiname deutet auf Stand Juni 2026.

**Nicht eingearbeitet** (liegen noch als PDF in `00_Inbox`, gehören ins nächste Weekly Review):
- `universal_rules_updates` — allgemeine Klarstellungen/Erratas, Stand 22.07.2026, v. a. Interaktionen von Gefechtsoptionen mit Codexregeln
- `faction_pack_dark_angels` — fraktionsspezifische Regeln
- Kill-Team-PDFs — eigenständiges Regelwerk, nicht Warhammer 40.000. Beide sind am 2026-08-27 ausgewertet und liegen jetzt unter `03_Ressourcen/warhammer/spielen/kill-team/_anhaenge/`, siehe [Kill-Team-Kompendien](../kill-team/kill-team-kompendien.md).
- `warhammer_dominatus_event_companion` — Event-/Turnierformat-Leitfaden, keine Grundregeln (5 Seiten, ursprünglich mit den Grundregeln verwechselt)

## 1. Spielaufbau in Kürze

Zwei Armeen, meist 5 Schlachtrunden, Sieg über Missionsziel-Kontrolle (nicht reine Vernichtung). Eine Schlachtrunde: Spieler A zieht komplett, dann Spieler B — wer beginnt, legt die Mission fest.

## 2. Der Zug — Ablauf pro Spieler

1. **Zugbeginn** — Auslöse-Effekte
2. **Befehlsphase** (08) — BP erhalten, Erschütterung prüfen, Befehlsfähigkeiten
3. **Bewegungsphase** (09) — Einheiten bewegen, Reserven treffen ein
4. **Fernkampfphase** (10) — Schießen
5. **Angriffsphase** (11) — Angriffsbewegungen in den Nahkampf
6. **Nahkampfphase** (12) — Nachrücken → Kämpfen → Neuordnen
7. **Zugende** — Auslöse-Effekte (erst Nicht-Missionsregeln, dann Missionsregeln)

Danach ist der Gegner am Zug. Nach beiden Zügen endet die Schlachtrunde (gleiche zweistufige Reihenfolge).

## 3. Kernwürfelmechanik — Attackenabfolge (04–05)

Jedes Mal wenn eine Einheit schießt oder kämpft:

1. **Waffen wählen** — Fernkampf: beliebig viele Fernkampfwaffen. Nahkampf: genau eine Nahkampfwaffe je Modell (Ausnahme `[ZUSATZATTACKEN]`).
2. **Ziele wählen** — Fernkampf: 1 Ziel je Waffe, muss sichtbar, in Reichweite und nicht im Nahkampf sein. Nahkampf: 1+ Ziele im Nahkampf mit dem Modell, max. Anzahl = A-Wert der Waffe.
3. **Attacken abhandeln**, Waffe für Waffe, identische Attacken gebündelt:

| Schritt | Wurf | 1 (unmod.) | 6 (unmod.) | Sonst |
|---|---|---|---|---|
| Trefferwurf | W6 je Attacke | Fehlschlag | krit. Treffer | Treffer bei ≥ BF/KG |
| Verwundungswurf | W6 je Treffer | Fehlschlag | krit. Verwundung | siehe S-vs-W-Tabelle |
| Schutzwurf | W6 je Verwundung | fügt Schaden zu | — | RE-Wert oder RW±DS entscheidet |
| Schaden | LP −SW | — | — | 0 oder weniger LP → zerstört |

**S-vs-W-Tabelle (Verwundungswurf):**

| Stärke vs. Widerstand | Nötig |
|---|---|
| S ≥ 2×W | 2+ |
| S > W | 3+ |
| S = W | 4+ |
| S < W | 5+ |
| S ≤ W/2 | 6+ |

**Schutzwurf-Logik:** unmodifizierte 1 fügt immer Schaden zu. Sonst zuerst prüfen ob Rettungswurf (RE) greift (Ergebnis ≥ RE-Wert → Fehlschlag), sonst ob Rüstungswurf greift (Ergebnis nach DS-Modifikator ≥ RW-Wert → Fehlschlag). Sonst Schaden.

Kritische Treffer/Verwundungen sind immer auch normale Treffer/Verwundungen, können aber Zusatzfähigkeiten auslösen (`[TÖDLICHE TREFFER]`, `[VERHEERENDE VERWUNDUNGEN]`, `[TREFFERHAGEL]` …).

**Zuweisungsreihenfolge** bei mehreren Modellen im Ziel (05.03): verwundete Nicht-Charaktermodell-Gruppen zuerst, Charaktermodell-Gruppen nie vor normalen Gruppen, verwundete Charaktermodelle vor unverwundeten.

**Tödliche Verwundungen** (06.02) umgehen Schutzwurf/Schaden-Ablauf komplett: 1 LP direkt, Modell-Auswahl nach fester Priorität (verwundete Nicht-Charaktermodelle → andere Nicht-Charaktermodelle → verwundete Charaktermodelle → andere Charaktermodelle).

## 4. Datenblatt-Werte (02.02)

**Profile:** B (Bewegung) · W (Widerstand) · RW (Rüstungswurf) · RE (Rettungswurf, optional) · LP (Lebenspunkte) · MW (Moralwert) · MK (Missionszielkontrollwert, „-" = kann keine Missionsziele kontrollieren)

**Waffen:** R (Reichweite, „Nahkampf" = Nahkampfwaffe) · A (Anzahl Attackenwürfel) · BF/KG (Ballistische Fertigkeit/Kampfgeschick) · S (Stärke) · DS (Durchschlag, Malus auf gegnerischen Rüstungswurf) · SW (Schadenswert)

## 5. Bewegungsarten — Referenztabelle

| Art (Ref.) | Max. Entfernung | Voraussetzung | Kernpunkt |
|---|---|---|---|
| Stationär bleiben (09.04) | – | immer | keine Beginn/Ende-Bewegungsregeln ausgelöst |
| Normale Bewegung (09.05) | B-Wert | nicht im Nahkampf | — |
| Vorrückenbewegung (09.06) | B + W6 | nicht im Nahkampf | danach kein Angriff/Aktion in diesem Zug; nur Sturmbeschuss statt normalem Schießen |
| Rückzugsbewegung (09.07) | B-Wert | im Nahkampf | Geordnet (nicht erschüttert) oder Verzweifelte Flucht (Risikowurf/Modell, danach Erschütterungswurf, kein Schießen/Angriff/Aktion) |
| Angriffsbewegung (11.04) | 2W6 (Angriffswurf) | Angriff angesagt, Ziel(e) ≤12" | muss näher ans Ziel, wenn möglich in Nahkampf enden; danach Erstschlag bis Zugende |
| Nachrückenbewegung (12.03) | 3" | Nahkampfphase: im Nahkampf, Angriff gemacht, oder Überrennen | vor dem Kämpfen, um max. Modelle in Reichweite zu bringen |
| Neuordnenbewegung (12.08) | 3" | nach dem eigenen Kämpfen | Modus: Laufend / Offensiv / Missionsziel |
| Ausstiegsbewegung (18.04) | 3" oder 6" | aus Transporter | Schnell/Taktisch (3") oder Kampf (6", Risikowurf, erschüttert) |
| Notausstiegsbewegung (18.05) | 6" | Transporter gerade zerstört | Risikowurf/Modell, danach erschüttert |
| Einsatzbewegung (20.04) | 6" | aus strategischer Reserve | ab Schlachtrunde 2, >8" von Feinden, vor Runde 3 nicht in gegnerischer Aufstellungszone |
| Kundschafterbewegung (24.32) | Kundschafter X" | vor der Schlacht, in eigener Aufstellungszone | muss >8" von Feinden enden |
| Ansturmbewegung (21.02) | durch auslösende Regel vorgegeben | durch spezielle Fähigkeit ausgelöst | wie Angriffsbewegung, aber ohne Angriffswurf |

## 6. Moral & Erschütterung (01.06–01.07, 08.03)

- **Erschütterungswurf:** 2W6 gegen MW-Wert der Einheit. Gelingt = nicht erschüttert. Misslingt = Einheit erschüttert.
- **Erschüttert bedeutet:** MK-Wert wird „-" (kontrolliert keine Missionsziele mehr), kann nicht Ziel von Gefechtsoptionen sein, kann keine Aktion beginnen/abschließen.
- **Ausgelöst** in jeder eigenen Befehlsphase für jede Einheit, die bereits erschüttert ist ODER auf/unter halber Sollstärke steht.

## 7. Sichtbarkeit & Gelände (13, 06.01)

- **Sichtbar:** mind. ein Teil eines Modells sichtbar → Modell sichtbar. Alle Modelle einer Einheit sichtbar → Einheit sichtbar. Analog für „vollständig sichtbar".
- **Geländekategorien:** Exponiert (kein Effekt) · Leicht (Deckung möglich, blockiert nichts) · Dicht (blockiert Bewegung großer Modelle, versperrt Sicht, hat Fest-Regel)
- **Profitiert von Deckung** (13.08): −1 auf BF der Fernkampfattacke, wenn Ziel-Einheit entweder komplett als INFANTERIE/BESTIEN/SCHWARM in einem Geländebereich steht, oder wegen Gelände nicht vollständig sichtbar ist.
- **Versteckt** (13.09): INFANTERIE/BESTIEN/SCHWARM in dichtem Gelände, die diese und letzte Runde nicht geschossen haben → nur sichtbar für Feinde innerhalb 15" Entdeckungsreichweite.
- **Fest** (13.11): dichtes Gelände — keine Sichtlinie durch Öffnungen ≤3" Höhe (Türen, Fenster).

## 8. Missionsziele (14)

- **Kontrolle:** Summe der MK-Werte aller eigenen Modelle in Reichweite je Spieler vergleichen. Höchste Summe kontrolliert. Gleichstand → niemand (außer gesichert).
- **Gesichert** (14.03): Kontrolle bleibt erhalten, bis Gegner am Ende einer Phase eine höhere Kontrollstufe hat — auch ohne eigene Einheiten in Reichweite.

## 9. Basis-Gefechtsoptionen (15) — alle Spieler können sie einsetzen

| Name | BP | Wann | Kurz |
|---|---|---|---|
| Befehlswiederholungswurf | 1 | nach fast jedem Wurf | Wurf wiederholen (bei mehreren: einen Würfel wählen, außer Angriffswurf) |
| Epische Herausforderung | 1 | Nahkampfphase, Charaktermodell zum Kämpfen gewählt | Waffen des Modells erhalten `[PRÄZISION]` |
| Wahnsinniger Mut | 1 (1×/Schlacht) | vor Erschütterungswurf | Wurf gelingt automatisch |
| Sprengsätze | 1 | eigene Fernkampfphase | 6W6, je 4+ = 1 tödliche Verwundung auf Ziel ≤8" |
| Zerschmetternder Aufprall | 1 | nach Angriffsbewegung eines MONSTER/FAHRZEUG | W-Wert-viele W6: 1 = tödl. Verwundung gegen sich selbst, 5+ = gegen Feind (max. 6) |
| Schneller Einsatz | 1 | Ende gegn. Bewegungsphase | Einheit aus Reserve führt Einsatzbewegung aus (nicht Runde 1) |
| Abwehrfeuer geben | 1 | Ende gegn. Bewegungsphase | eiliger Beschuss: nur 6er treffen, kein Wiederholen |
| Rauchvorhang | 1 | Beginn gegn. Fernkampfphase | RAUCH-Einheit gibt Deckung gegen sich/dahinter |
| Heroische Intervention | 1 (+1) | Ende gegn. Angriffsphase | eigener Angriff außer der Reihe |
| Gegenoffensive | 2 | gegn. Nahkampfphase, direkt nach gegn. Attacken | eigene Einheit wird Erstschlag + muss als nächstes gewählt werden |

## 10. Aktionen (16)

Format: BEGINN / EINHEITEN / EINSATZLIMIT / ABSCHLUSS / EFFEKT. Eine Einheit kommt **nicht** infrage, eine Aktion zu beginnen, wenn sie: nicht auf dem Schlachtfeld ist, FLUGZEUG/BEFESTIGUNG ist, erschüttert ist, MK 0/„-" hat, im Nahkampf ist (außer TITANISCH), in diesem Zug vorgerückt/zurückgezogen ist, oder bereits eine andere Aktion begonnen hat. Solange eine Aktion läuft: kein Schießen (außer TITANISCH), kein Angriff. Bewegung (außer Nachrücken/Neuordnen) bricht die Aktion ab.

## 11. Fortgeschrittene Regeln (17–23) — kurz

- **Monster/Fahrzeuge** (17): messen über Umriss statt Base; dürfen sich durch andere Modelle bewegen (außer andere M/F); Nahbereichbeschuss im Nahkampf möglich, aber −1 auf Trefferwurf (außer `[NAHBEREICH]`-Waffen).
- **Transporter** (18): Kapazität begrenzt Passagiere. Einsteigen: nach Bewegung, innerhalb 3". Aussteigen: Schnell (3", nach Vorrücken/Einsatz des Transporters), Taktisch (3", danach eigene normale/Vorrücken-Bewegung möglich), Kampf (6", Risikowurf, erschüttert). Notausstieg bei Zerstörung: 6", Risikowurf, erschüttert.
- **Angeschlossene Einheiten** (19): Anführer-/Unterstützung-Fähigkeit + Leibwächter-Einheit = eine Einheit. Nutzt beim Verwunden den höchsten W-Wert der Leibwächter. Fähigkeiten eines Modells gelten für die ganze Einheit, bis genau jenes Modell stirbt.
- **Strategische Reserven** (20): max. 50 % des Punktlimits. Ab Schlachtrunde 2 per Einsatzbewegung einsatzbereit. Nicht eingetroffene Einheiten werden am Ende Runde 3 zerstört.
- **Fliegen** (21.03): „In den Himmel aufschwingen" kostet 2" der Bewegung, erlaubt dafür Bewegung durch alles hindurch (Modelle, Gelände) ohne vertikale Distanz zu zählen.
- **Flugzeuge** (23): müssen immer in strategischer Reserve starten, nur Einsatzbewegung möglich, am Ende von Gegners Zug zurück in Reserve, greifen nur FLIEGEN-Einheiten im Nahkampf an/werden nur von ihnen angegriffen.

## 12. Schlüsselwort-Glossar (24) — Kurzreferenz

| Schlüsselwort | Effekt in Kürze |
|---|---|
| `[ANTI-X Y+]` | gegen Zielschlüsselwort X: unmod. Verwundungswurf ≥Y = kritische Verwundung |
| `[STURM]` | ermöglicht Sturmbeschuss nach Vorrücken |
| `[EXPLOSIV X]` | +X Attackenwürfel je 5 Modelle im Ziel (Standard X=1) |
| `[SPALTEN X]` | wie Explosiv, aber nur wenn genau 1 Ziel gewählt |
| `[NAHBEREICH]` / `[PISTOLE]` | ermöglicht Nahbereichbeschuss im Nahkampf; sonst normale Fernkampfwaffe (nicht gleichzeitig mit anderen Fernkampfwaffen desselben Modells) |
| Gefährliches Ende X | bei Zerstörung: W6, bei 6 erleiden Einheiten ≤6" X tödliche Verwundungen |
| Schocktruppen | Einsatzbewegung darf auch in gegnerische Aufstellungszone (>8" von Feinden) |
| `[VERHEERENDE VERWUNDUNGEN]` | kritische Verwundung → SW-viele tödliche Verwundungen statt normalem Schaden |
| `[ZUSATZATTACKEN]` | zusätzliche Attacken parallel zur normal gewählten Nahkampfwaffe |
| Verletzungen ignorieren X+ | W6 je LP-Verlust, bei X+ kein Verlust |
| Erstschlag | kämpft vor normalen Einheiten in der Nahkampfphase |
| Feuerplattform X | Transporter kann X Waffen der Passagiere selbst abfeuern |
| `[RISKANT]` | Risikowurf je eingesetzter Waffe nach den Attacken |
| `[SCHWER]` | +1 Trefferwurf wenn Einheit stationär war (nicht im Nahkampf) |
| Schweber | kein −2"-Malus beim Aufschwingen in den Himmel |
| `[DECKUNG IGNORIEREN]` | Ziel profitiert nicht von Deckung |
| `[INDIREKTES FEUER]` | ermöglicht Beschuss unsichtbarer Ziele (Ziel bekommt Deckung, kein Wiederholen, schwerer Trefferwurf) |
| Infiltratoren | Aufstellung überall >8" von Gegner/gegn. Zone |
| `[LANZE]` | +1 Verwundungswurf nach Angriffsbewegung im selben Zug |
| Anführer / Unterstützung | siehe Angeschlossene Einheiten (19) |
| `[TÖDLICHE TREFFER]` | krit. Treffer kann automatisch verwunden (kein Verwundungswurf → keine krit. Verwundung) |
| Einsamer Wolf (X") | nur sichtbar/Ziel für Feinde innerhalb X" (Standard 12"), außer in angeschlossener Einheit |
| `[MELTER X]` | +X SW innerhalb halber Reichweite |
| `[EINMALIG EINSETZBAR]` | Waffe nur 1× pro Schlacht einsetzbar |
| `[PRÄZISION]` | kann Charaktermodell in Zieleinheit direkt anvisieren |
| `[PSIONISCH]` | ignoriert Modifikatoren auf BF/KG und Trefferwurf |
| `[SCHNELLFEUER X]` | +X Attackenwürfel innerhalb halber Reichweite |
| Kundschafter X" | Vorab-Bewegung/-Platzierung vor der Schlacht, muss >8" von Feinden enden |
| Tarnung | Einheit profitiert immer von Deckung gegen Fernkampf |
| Überschwerer Läufer | bewegt sich durch Modelle/niedriges Gelände; optional MOBIL (Risiko: W6=1 → erschüttert) |
| `[TREFFERHAGEL X]` | krit. Treffer → X zusätzliche Treffer |
| `[SCHWALL]` | trifft automatisch |
| `[SYNCHRONISIERT]` | Verwundungswurf wiederholbar |

## 13. Sollstärke, Zerstört (Regelanhang)

- **Sollstärke** = Modellanzahl der Einheit zu Beginn der ersten Schlachtrunde.
- Auf/unter (halber) Sollstärke bezieht sich bei Einzelmodellen (Sollstärke 1) auf verbleibende LP, sonst auf verbleibende Modellzahl.
- **Zerstört:** erst alle „bei Zerstörung"-Regeln abhandeln, dann Modell entfernen. Zerstörte Modelle können danach nicht mehr gewählt werden oder Ziel sein.

## 14. Meine Rolle als Spielmeister — worauf ich achten sollte

Typische Anfängerstolpersteine, die ich beim Erklären/Schiedsrichtern aktiv ansprechen sollte:

- **Erschütterungswürfe in der Befehlsphase nicht vergessen** — leicht übersehen, weil sie vor allem anderen passieren.
- **Formation nach jeder Bewegung prüfen** (2" zu min. einem, 9" zu allen anderen Modellen der Einheit) — sonst gehen am Zugende Modelle verloren.
- **Nahkampfphase-Reihenfolge strikt einhalten:** erst alle Nachrückenbewegungen (aktiver Spieler zuerst), dann Kämpfen (Erstschlag-Einheiten zuerst, abwechselnd wählen), dann Neuordnen.
- **Kämpfen ist Pflicht** für jede infrage kommende Einheit, Nachrücken und Neuordnen sind es nicht.
- **Vorrückenbewegung:** kein Schießen (außer Sturmbeschuss) und kein Angriff in diesem Zug — oft vergessen.
- **Rückzugsbewegung:** kein Schießen, kein Angriff, keine Aktion in diesem Zug.
- **Die 1-Regel gilt bei jedem Wurf-Schritt separat:** unmodifizierte 1 beim Trefferwurf, Verwundungswurf UND Schutzwurf ist jeweils automatischer Fehlschlag bzw. automatischer Erfolg (Schutzwurf).
- **DS wirkt auf den Rüstungswurf, nicht auf den Rettungswurf.** RE bleibt unverändert.
- **`[EXPLOSIV]`/`[SPALTEN]` geben Bonuswürfel pro 5 Modelle im Ziel** — wird beim Attackenwürfel-Zählen leicht übersehen.
- **Referenznummer mitgeben**, wenn ich eine Regel erkläre (z. B. „05.03"), damit im PDF nachgeschlagen werden kann, falls Zweifel bestehen.
