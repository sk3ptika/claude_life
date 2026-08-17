---
titel: Rezepte — Prozess für neue und optimierte Anleitungen
typ: notiz
angelegt: 2026-08-16
---

# Rezepte — Prozess für neue und optimierte Anleitungen

Handoff-Dokument. Hält fest, was sich beim Aufbau der Blood-Angels- und Ork-Rezepte an Konventionen ergeben hat, damit ein neuer Chat das nicht neu verhandeln muss. Vor jeder neuen Anleitung oder Optimierung einer bestehenden zuerst hier lesen.

## Grundprinzip: zwei Rezepte pro Fraktion

- `<fraktion>-schnell.md`: Zielstandard tabletop, für Trupps/Horden im Batch, knappes Zeitbudget (Referenzwert Blood Angels: 20–25 min/Modell)
- `<fraktion>-klassisch.md`: Zielstandard tabletop-plus bis display, für Charaktermodelle/Warbosse/Testmodelle, Technik-Lernen (Referenzwert: 60–90 min/Modell)

Beide Rezepte einer Fraktion laufen über denselben sichtbaren Hauptton (bei Blood Angels: Wazdakka Red), damit Modelle aus beiden Wegen nebeneinander wie eine Armee wirken. Ein Abschnitt „Tonabgleich" hält das in beiden Dateien explizit fest — bei neuen Fraktionen genauso anlegen.

Speedpainting-Techniken (Contrast, Slapchop, Zenithal-Spray) gehören ausschließlich in `-schnell.md`, nie in `-klassisch.md` — auch wenn eine vorbereitete Vorlage sie im selben Abschnitt anbietet. Klassisch ist explizit ohne Zeitdruck definiert, das würde dem widersprechen.

## Struktur, die jede Datei einhält

1. Frontmatter: `titel`, `typ: notiz`, `angelegt` (`aktualisiert` nur bei echten inhaltlichen Änderungen ergänzen, nicht bei jedem Edit)
2. Intro: Zielstandard, Zeit je Modell, Zweck
3. „Pinsel je Technik"-Tabelle: Technik → Pinseltyp/Größe → Wofür
4. Die Farb-Leiter der Fraktion (rote Leiter bei Blood Angels, grüne Leiter bei Orks) als Kerntabelle
5. Ablauf-Tabelle(n) mit Spalten `# | Schritt | Farbe | Technik | Hinweis` — Technik-Spalte nutzt das feste Vokabular unten
6. Detail-Tabelle für Edelsteine, Symbole, Zähne etc.
7. Optionale Abschnitte klar als optional kennzeichnen (z. B. Orden-/Klan-Farbtabellen — nicht Kern des Rezepts)
8. „Was hier nicht funktioniert hat" mit Ursachendiagnose, sobald ein Versuch in der Praxis gescheitert ist — nie einfach löschen, auch wenn die Vorlage sich ändert
9. Ungetestete Alternativen klar mit „noch nicht getestet" markieren und mit Unsicherheit in Prozent versehen, nie als fertige Anleitung tarnen

## Technik-Vokabular (konsistent verwenden)

Basecoating, Priming, Zenithal Highlighting per Spray, Recess Shading/Washing, Layering, Edge Highlighting, Spot Highlighting, Glazing, Drybrushing, Stippling (Weathering), Chipping, Gemstone-/Glaseffekt, Freihand/Lettering, Texturing.

## Umgang mit vorbereiteten Vorlagen (z. B. aus anderen Chats kopiert)

Wenn eine fertige Anleitung eingefügt wird („das ist die neue Basis"):

- Nicht kommentarlos eine bestehende, am eigenen Bestand bereits getestete Datei überschreiben. Bei Unsicherheit über die Ablage erst fragen — Optionen nennen, Empfehlung geben, Unsicherheit in Prozent (siehe `_system/konventionen.md`, Abschnitt „Umgang mit Unsicherheit")
- Vorlage als Basis übernehmen, bestehende Inhalte nur einarbeiten, wenn relevant, konsistent und geprüft — sonst recherchieren statt raten
- Farbnamen, die unsicher oder ungewöhnlich klingen, per Websuche verifizieren, bevor sie ins Rezept übernommen werden. Bisher verifiziert: Baal Red, Orruk Flesh, Ogryn Camo, Nurgling Green — alle real
- Widersprüche in der Vorlage nicht stillschweigend übernehmen, sondern auflösen und die Auflösung kurz begründen (Beispiel: Warboss Green stand bei den Orks doppeldeutig als Basis- und Aufhell-Farbe, wurde als Aufhell-Stufe eingeordnet, mit Begründung im Text)
- Nichts erfinden, was weder in der Vorlage noch schon im System steht (Beispiel: Basis-Sektion bei Orks bewusst leer gelassen statt die Blood-Angels-Basis zu unterstellen)

## Continuous Improvement — was nach jedem Testmodell/Batch zurückfließt

- Tatsächliche Zeit je Modell in `../projekte-bemalen.md` eintragen (Tabelle „Abgeschlossen"), nicht nur schätzen
- Ungetestete Alternativen nach dem Testmodell im jeweiligen Rezept auflösen: welcher Weg trägt wird eingetragen, verworfene Wege bleiben unter „Was hier nicht funktioniert hat" stehen (nichts löschen)
- Neue Fehlschläge dort mit Ursachendiagnose ergänzen, nicht nur „hat nicht geklappt" vermerken — die Diagnose ist es, die den nächsten Versuch besser macht

## Stand zu diesem Zeitpunkt (2026-08-16)

Vorhandene Dateien:

- `blood-angels-schnell.md` — Zenithal + Layer, in der Praxis getestet, zwei dokumentierte Contrast-Fehlschläge, zwei ungetestete Alternativen offen (A: Wraithbone-Trennung Vertiefung/Fläche, ~70 % Zuversicht; B: Slapchop mit Grau/Weiß-Drybrush vor Contrast, ~40 % Zuversicht)
- `blood-angels-klassisch.md` — vollständig, Basis für die Struktur-Konventionen oben
- `orks-klassisch.md` — neu angelegt, noch kein Testmodell gelaufen

Offen:

- `orks-schnell.md` existiert noch nicht
- Basing-Konvention für Orks ungeklärt (siehe `orks-klassisch.md`, Abschnitt „Basis")
- Mattlack fehlt im Bestand — betrifft alle Fraktionen, siehe `../sammlung.md`

## Für den nächsten Chat

Bei einer Fraktion ohne Rezept: gleiche Zweiteilung (schnell/klassisch), gleiche Struktur, gleicher Tonabgleich-Gedanke — besonders wichtig, falls mehrere Fraktionen später nebeneinander auf dem Tisch stehen und wie eine zusammenhängende Sammlung wirken sollen.
