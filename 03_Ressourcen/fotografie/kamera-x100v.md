---
titel: X100V — meine Belegung
typ: notiz
status: aktiv
aktualisiert: 2026-08-18
---

# X100V — meine tatsächliche Belegung

Hier steht, wie die Kamera **wirklich** eingestellt ist, nicht wie sie eingestellt sein sollte. Nach jeder Änderung aktualisieren.

> **Stand 18.08.2026: Die Werte unten sind entworfen, aber noch nicht an der Kamera gesetzt.** Sie werden in Session 1 des Projekts [X100V Japan-ready](../../01_Projekte/2026-08_x100v-japan-ready/_projekt.md) eingerichtet. Bis dahin ist die Spalte „Gesetzt" leer. Was hier nicht als gesetzt markiert ist, steht so nicht in der Kamera.

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
| Fn1 (Oberseite, neben dem Auslöser) | `BEN.EINST. AUSW.` | Der wichtigste Griff überhaupt. Zeigefinger, ohne die Kamera abzusetzen |  |
| Fn2 (vorn, unter dem Auslöser) | `AUTOM. ISO-EINST.` | Licht ändert sich, das Aussehen nicht — Set wechseln ohne Bankwechsel |  |
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

**Belichtungskorrekturrad:** bleibt physisch, auf den gerasteten Stellungen. Es ist der zweite Griff nach der Bank und soll ohne Hinsehen funktionieren. Die `C`-Stellung (±5 LW über das Rad) wird nicht gebraucht.

## Offene Fragen zur Kamera

- Speichert eine Bank die Auswahl `AUTOM. ISO-EINST.` mit? Test in Session 1: AUTO1 in C1 speichern, auf AUTO3 wechseln, Bank neu aufrufen. Ergebnis hier eintragen.
- Wie langsam wird die Kamera durch `KLARHEIT`? Falls es beim Street-Tempo stört: Klarheit runter, Schärfe rauf.
- Eigene Verwacklungsgrenze bei 23 mm freihändig — in Session 3 ermitteln.

## Änderungsverlauf

| Datum | Was geändert | Warum |
|---|---|---|
| 2026-08-18 | Bankplan, Fn-Belegung, Auto-ISO-Sets und Grundeinstellungen entworfen | Vorbereitung Japan-Reise, Projekt [X100V Japan-ready](../../01_Projekte/2026-08_x100v-japan-ready/_projekt.md) |
