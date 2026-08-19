---
titel: X100V — meine Belegung
typ: notiz
status: aktiv
aktualisiert: 2026-08-19
---

# X100V — meine tatsächliche Belegung

Hier steht, wie die Kamera **wirklich** eingestellt ist, nicht wie sie eingestellt sein sollte. Nach jeder Änderung aktualisieren.

> **Stand 19.08.2026: Die Soll-Werte unten sind entworfen, aber noch nicht an der Kamera gesetzt.** Was tatsächlich in der Kamera steht, steht im Abschnitt [Ist-Zustand](#ist-zustand-am-19082026). Sie werden in Session 1 des Projekts [X100V Japan-ready](../../01_Projekte/2026-08_x100v-japan-ready/_projekt.md) eingerichtet. Bis dahin ist die Spalte „Gesetzt" leer. Was hier nicht als gesetzt markiert ist, steht so nicht in der Kamera.

Nachschlagewerk: [Handbuch](x100v-handbuch.md) · Rezepte im Detail: [rezepte/](rezepte/) · Für unterwegs: [Japan-Spickzettel](japan-spickzettel.md)

## Die Grundidee

Ein Griff pro Situation. **Fn1 wählt die Bank, das Belichtungskorrekturrad macht den Rest.** Alles andere bleibt, wo es ist.

Blenden- und Zeitautomatik sind auf der X100V keine Menüsache, sondern eine physische Geste: Zeitenrad auf `A` und Blende am Ring = Zeitautomatik (A), Blendenring auf `A` und Zeit am Rad = Blendenautomatik (S). Die Bänke fassen das nicht an. Sie regeln nur, **wie das Bild aussieht** und **wie die ISO-Automatik sich verhält**.

Nützlich zu wissen: Das erste Feld im Q-Menü zeigt immer die aktive Bank (`BASE` = keine). Werte, die von der Bank abweichen, erscheinen **rot**, und Änderungen im Q-Menü werden **nicht** in die Bank zurückgeschrieben. Man kann also jederzeit gefahrlos abweichen — Bank neu wählen stellt den Ausgangszustand wieder her.

## Custom-Bänke

| Bank | Zweck | Film-Sim | Auto-ISO | Rezeptdatei | Gesetzt | Zuletzt benutzt |
|---|---|---|---|---|---|---|
| C1 | Stadt und Street bei Tag | `CLASSIC CHROME` | AUTO1 | [stadt-tag.md](rezepte/stadt-tag.md) |  |  |
| C2 | Stadt bei Nacht, Neon | `KLASSISCH Schwarz` (Classic Neg.) | AUTO3 | [stadt-nacht.md](rezepte/stadt-nacht.md) |  |  |
| C3 | Landschaft und Herbstlaub | `Velvia/LEBENDIG` | AUTO1 | [landschaft-herbst.md](rezepte/landschaft-herbst.md) |  |  |
| C4 | Innenräume, Tempel, Museum | `ETERNA/KINO` | AUTO2 | [innenraum.md](rezepte/innenraum.md) |  |  |
| C5 | Kontrast, Architektur, Schwarzweiß | `ACROS+ROT-FILTER` | AUTO1 | [schwarzweiss-kontrast.md](rezepte/schwarzweiss-kontrast.md) |  |  |
| C6 | *frei* | — | — | — | — | — |
| C7 | *frei* | — | — | — | — | — |

C6 und C7 bleiben absichtlich leer — als Platz für etwas, das sich vor Ort als nötig herausstellt. Fünf Bänke kann man sich merken, sieben nicht.

Spalte „Zuletzt benutzt" nach vier Wochen auswerten. Ungenutzte Bänke ersetzen.

Anlegen und ändern: `BEN.EINST. BEARBEITEN/SPEICHER` → Bank wählen → `BEARBEITEN` (Punkt für Punkt, DISP/BACK → `OK` speichert) oder `AKT. EINST SPEICH` (schreibt den aktuellen Kamerazustand hinein). Mit `BENUTZERDEF. NAME EINGEBEN` bekommt jede Bank ihren Namen — lohnt sich, „C2" sagt unterwegs nichts, „NACHT" schon.

## Fn-Tasten

Schnellster Weg zum Belegen: **DISP/BACK gedrückt halten.**

| Bedienelement | Belegung | Warum | Gesetzt |
|---|---|---|---|
| Fn1 (Oberseite, neben dem Auslöser) | `BEN.EINST. AUSW.` | Der wichtigste Griff überhaupt. Zeigefinger, ohne die Kamera abzusetzen. **Ersetzt `ISO`** |  |
| Fn2 (vorn, unter dem Auslöser) | `AUTOM. ISO-EINST.` | Licht ändert sich, das Aussehen nicht — Set wechseln ohne Bankwechsel. **Ersetzt `GESICHTSERK. EIN/AUS`**, wird nie benutzt |  |
| AEL/AFL | `AE/AF SPERRE` (Werk) | Bleibt. Sitzt seit Jahrzehnten |  |
| Hinteres Rad drücken | `FOKUSKONTROLLE` (Werk) | Bleibt. Lupe zur Schärfekontrolle |  |
| Sucherauswahlhebel (ziehen und halten) | `ND-FILTER` (Werk) | Bleibt. −4 LW für f/2 bei Sonne und für Wasser mit langer Zeit |  |
| Q-Taste | `SCHNELLMENÜ` (Werk) | Bleibt. Der Weg für alles, was keine Bank hat |  |
| Touch hoch (T-Fn1) | *aus* | Wischgesten sind ab Werk aus und bleiben es |  |
| Touch rechts (T-Fn2) | *aus* | dito |  |
| Touch runter (T-Fn3) | *aus* | dito |  |
| Touch links (T-Fn4) | *aus* | dito |  |

**Warum die Wischgesten aus bleiben:** Beim Blick durch den Sucher liegt die Nase auf dem Display. Aktive Wischgesten lösen dann von selbst aus. Stattdessen wird das Display als Trackpad für das AF-Feld genutzt — siehe Grundeinstellungen.

Der Steuerring am Objektiv steht auf `AUS`. Er würde sonst beim Zugreifen versehentlich Filmsimulation oder Weißabgleich verstellen, und beides regeln die Bänke.

## Auto-ISO-Sets

`AUFNAHME-EINSTELLUNG > AUTOM. ISO-EINST.` Das ISO-Rad steht dafür auf `A`.

| Set | Standard | Maximum | Mindest-Verschlusszeit | Wofür | Gesetzt |
|---|---|---|---|---|---|
| AUTO1 „TAG" | 320 | 1600 | ¹⁄₁₂₅ s | Draußen bei Tag. ¹⁄₁₂₅ friert Gehende ein |  |
| AUTO2 „INNEN" | 640 | 6400 | ¹⁄₆₀ s | Tempel, Museum, Dämmerung |  |
| AUTO3 „NACHT" | 640 | 12800 | ¹⁄₆₀ s | Stadt bei Nacht |  |

**Warum Standard 320 statt 160:** `DYNAMIKBEREICH 200%` ist erst ab ISO 320 verfügbar, `400%` erst ab ISO 640. Steht der Standardwert auf 160, zieht die Kamera ihn ohnehin hoch, sobald DR200 im Rezept steht — dann lieber gleich sauber eintragen. Bei ISO 320 kostet das an der X100V praktisch nichts.

**Was die Mindest-Verschlusszeit tut:** Die Kamera bleibt beim Standardwert und hebt die Empfindlichkeit erst an, wenn die Belichtungszeit länger würde als der eingetragene Wert. Reicht das Maximum nicht, wird die Zeit trotzdem verlängert — dann wackelt es, ohne Warnung. Das ist der Moment, in dem der Wechsel in den S-Modus fällig ist.

**Nur relevant in A und P.** Im S-Modus gibt die Zeit ohnehin die Hand vor.

Die Werte für AUTO2 und AUTO3 sind Startwerte. Die eigene Verwacklungsgrenze bei 23 mm wird in Session 3 ermittelt und hier eingetragen — die X100V hat keinen Bildstabilisator.

## Grundeinstellungen

Einmal setzen, dann nie wieder anfassen. Diese Punkte liegen außerhalb der Bänke.

| Einstellung | Wert | Warum | Gesetzt |
|---|---|---|---|
| `BILDGRÖSSE` | `L 3:2` | Volle Sensorfläche. 16:9 in der Kamera wirft Pixel weg, die nie wiederkommen — das Kinoformat entsteht beim Zuschneiden danach |  |
| `BILDQUALITÄT` | `FINE+RAW` | Nur für die Reise. JPEG ist das Ergebnis, RAW das Netz |  |
| `D-BEREICHSPRIORITÄT` | `AUS` | **Pflicht.** Steht sie nicht auf `AUS`, setzt die Kamera Tonkurve und Dynamikbereich selbst — alle Rezepte wären wirkungslos |  |
| `FOKUSHEBEL-EINSTELLUNG` | `AN` | Direkt kippen, kein Vorab-Druck. Schneller |  |
| `EVF/OVF-TOUCHS. BEREICH EINST.` | rechte Hälfte | AF-Feld per Daumen verschieben, ohne dass die Nase mitredet |  |
| `TOUCH-FUNKTION` | `AUS` | Wischgesten, siehe oben |  |
| `STEUERRING-EINST.` | `AUS` | Gegen versehentliches Verstellen |  |
| `PRE-AF` | `AUS` | Frisst Akku, und die X100V hat davon wenig |  |
| `PRIO. AUSLÖSEN/FOKUS` | `AUSLÖSEN` | Auf der Straße ist ein leicht unscharfes Bild besser als keins |  |
| `AF MODUS` | `EINZELPUNKT` | Kontrolle statt Kameraraten. Fokusmodus `S` |  |
| `GES./AUGEN-ERKENN.-EINST.` | `AUS` | **Wichtig:** Ist sie an, misst die Kamera auf das Gesicht und `AE-MESSUNG` wird wirkungslos. Bei Bedarf über das Q-Menü zuschalten |  |
| `AE-MESSUNG` | `MEHRFELD` | Standard. `SPOT` bei Gegenlicht über das Q-Menü |  |
| `AUSLÖSERTYP` | `MECHANISCHER AUSLÖSER` | Der Zentralverschluss ist ohnehin fast lautlos. Der elektronische bringt Streifen unter Leuchtstofflicht, verzerrt Bewegung und lässt den Blitz nicht zünden |  |
| `AUFNEHMEN OHNE KARTE` | `OFF` | Verhindert Fotografieren ins Leere |  |
| `SELBSTAUSLÖSER SPEICHERN` | `AUS` | Sonst steht er beim nächsten Einschalten noch an |  |
| `FARBRAUM` | `sRGB` | Für Bildschirm und Weitergabe. Adobe RGB nur für Druckerei |  |
| `Integrierter Blitz` | `AUS` | In Japan durchgehend unerwünscht — Tempel, Museen, Züge, Menschen. Bei Bedarf gezielt einschalten |  |

**Belichtungskorrekturrad:** bleibt physisch, auf den gerasteten Stellungen. Es ist der zweite Griff nach der Bank und soll ohne Hinsehen funktionieren. Die `C`-Stellung (±5 LW über das Rad) wird nicht gebraucht.

## Ist-Zustand am 19.08.2026

Ausgelesen aus 14 Menü-Screenshots. Firmware ist aktuell. **Es ist keine C-Bank belegt** — die Kamera läuft auf `BASE`, alle Werte stehen direkt im Aufnahmemenü.

### Was schon richtig steht

| Einstellung | Ist | Anmerkung |
|---|---|---|
| `D-BEREICHSPRIORITÄT` | `AUS` | Der wichtigste Punkt, und er steht bereits richtig. Ohne das wäre kein Rezept wirksam |
| `FARBRAUM` | `sRGB` | passt |
| `PRE-AF` | `AUS` | passt, schont den Akku |
| `GES./AUGEN-ERKENN.-EINST.` | `AUS` | passt, `AE-MESSUNG` greift damit |
| `HILFSLICHT` | `AUS` | passt — das AF-Hilfslicht ist in Tempeln und Restaurants unhöflich |
| `FLIMMERREDUZIERUNG` | `AUS` | passt |
| `KONVERTERLINSE` / `DIGITALE TELE-KONV.` | `AUS` / `OFF` | passt |

### Aktuelles Bildaussehen (ohne Bank, direkt im Menü)

| Parameter | Ist |
|---|---|
| `FILMSIMULATION` | Classic Chrome |
| `WEISSABGLEICH` | `AUTO` |
| `DYNAMIKBEREICH` | `200%` |
| `TONKURVE` | H: +1 · S: +1 |
| `FARBE` / `SCHÄRFE` / `RAUSCHREDUKTION` / `KLARHEIT` | 0 / 0 / 0 / 0 |
| `FARBE CHROME-EFFEKT` | `SCHWACH` |
| `FARBE CHROM FX BLAU` | `AUS` |
| `KÖRNUNGSEFFEKT` | `AUS` |

Bemerkenswert: DR200 und eine angehobene Tonkurve stehen schon — der Wunsch nach mehr Dynamik ist also bereits angefangen worden. Was fehlt, ist `SCHÄRFE`, `KLARHEIT` und `FARBE`, und genau da setzt Rezept 1 an. Ein Unterschied bleibt bewusst: Im Rezept steht `TON LICHTER −1` statt +1, weil helle Fassaden und Schilder sonst ausbrennen. Härte kommt dort über die Schatten, nicht über die Lichter.

### Was geändert werden muss

| Einstellung | Ist | Soll | Warum |
|---|---|---|---|
| `BILDGRÖSSE` | **`L 16:9`** | `L 3:2` | 16:9 schneidet im JPEG dauerhaft oben und unten weg. Der Sensor ist 3:2 — der Beschnitt ist unwiederbringlich, das Zuschneiden danach nicht |
| `BILDQUALITÄT` | **`F`** | `FINE+RAW` | Nur für die Reise, als Sicherheitsnetz |
| `AUSLÖSERTYP` | **`M+E`** | `MECHANISCHER AUSLÖSER` | Der elektronische Anteil bringt Streifen unter LED- und Leuchtstofflicht und verzerrt Bewegung |
| `SELBSTAUSLÖSER SPEICHERN` | **`AN`** | `AUS` | Sonst steht der Selbstauslöser beim nächsten Einschalten noch an |
| `Integrierter Blitz` | **`AN`** | `AUS` | In Japan praktisch durchgehend unerwünscht. Bei Bedarf gezielt einschalten |
| C1–C7 | **alle leer** | fünf Bänke belegt | Kern des Projekts |
| Auto-ISO-Sets | Werkswerte, aktiv `AUTO2` | siehe oben | Standard/Maximum/Mindestzeit neu setzen |

### Noch zu prüfen

Die Screenshots decken `AUFNAHME-EINSTELLUNG 3/3`, die Setup-Menüs und `FUNKTIONEN (Fn) 2/2` nicht ab. Offen bleiben damit: Belegung des hinteren Radknopfs, des Sucherauswahlhebels und der Q-Taste, `FOKUSHEBEL-EINSTELLUNG`, `STEUERRING-EINST.`, `EVF/OVF-TOUCHS. BEREICH EINST.` und `AUFNEHMEN OHNE KARTE`. In Session 1 direkt an der Kamera nachsehen.

Auf `FUNKTIONEN (Fn) 1/2` sind T-Fn1 bis T-Fn4 belegt, die Symbole sind auf dem Foto aber nicht sicher zu lesen. Vermutlich Werksbelegung (Histogramm, Filmsimulation, Weißabgleich, Wasserwaage). `AELAFL` steht auf `AFL`.

## Offene Fragen zur Kamera

- Speichert eine Bank die Auswahl `AUTOM. ISO-EINST.` mit? Test in Session 1: AUTO1 in C1 speichern, auf AUTO3 wechseln, Bank neu aufrufen. Ergebnis hier eintragen.
- Wie langsam wird die Kamera durch `KLARHEIT`? Falls es beim Street-Tempo stört: Klarheit runter, Schärfe rauf.
- Eigene Verwacklungsgrenze bei 23 mm freihändig — in Session 3 ermitteln.

## Änderungsverlauf

| Datum | Was geändert | Warum |
|---|---|---|
| 2026-08-18 | Bankplan, Fn-Belegung, Auto-ISO-Sets und Grundeinstellungen entworfen | Vorbereitung Japan-Reise, Projekt [X100V Japan-ready](../../01_Projekte/2026-08_x100v-japan-ready/_projekt.md) |
| 2026-08-19 | Ist-Zustand aus 14 Menü-Screenshots erfasst | Firmware aktuell, keine Bank belegt, Fn1 auf ISO, Fn2 auf Gesichtserkennung |
| 2026-08-19 | Entschieden: Fn1 bekommt den Bankwechsel, ISO wandert auf Fn2 | Der Bankwechsel wird der häufigste Griff und gehört auf die besser erreichbare Taste. Gesichtserkennung auf Fn2 wird nie benutzt |
| 2026-08-19 | Entschieden: Aufnahme in `L 3:2` statt `L 16:9` | Beschnitt in der Kamera ist im JPEG endgültig. 16:9 entsteht beim Zuschneiden, nicht beim Auslösen |
