# Styrke & VO₂ Log

Træningsplan og log for styrke og VO₂max. Installerbar web-app (PWA). Alle data gemmes lokalt på telefonen.

## Opbygning

| Sti | Hvad |
|---|---|
| `src/js/01-…20-*.js` | Appen, delt efter område. Filerne deler ét scope og samles i rækkefølge til ét script. |
| `src/style.css` | Al styling. |
| `src/shell.html` | Sidens markup. |
| `src/engine.js` | Passemotoren (CrossFit-WOD'er). |
| `src/sw-cache.js` | Offline-cachen i service workeren. |
| `index.html`, `sw.js` | Bygget. Rettes ikke i hånden. |
| `dist/app.html` | Hele appen i én fil (forhåndsvisning). Bygget, ikke i git. |

Modulerne:

| Fil | Område |
|---|---|
| 01-grundlag | Datoer, sessionsbibliotek og vaner |
| 02-hjaelpere | Formatering og dine tal (beregnet max, kg) |
| 03-data | Gemte data, standardværdier og opgradering |
| 04-kalender | Hvilket pas der ligger på en dag, og ændringer af dagene |
| 05-styrke | Øvelsesbibliotek og tilfældige styrkepas |
| 06-log | Log af styrke og visning af et pas |
| 07-crossfit | WOD-bygger |
| 08-idag | Fanen I dag |
| 09-fuld-traening | Fuld træning A–D |
| 10-plan-motor | Planlæggerens motor, løb og VDOT |
| 11-plan-visning | Fanen Plan og spørgsmålene |
| 12-navigation | Faneskift og fanen Pas |
| 13-laeg-i-kalenderen | Læg et pas på dage |
| 14-tilpasning | Feedback og forslag til justering |
| 15-pas-og-log | Opret og rediger pas, log-skærme, grafer |
| 16-introduktion | Introduktion for nye brugere |
| 17-udvikling | Fanen Udvikling og Indstillinger |
| 18-timer | Intervaltimer og lyd |
| 19-visning-og-fejl | Render, tilbage-gestus, fejlskærm |
| 20-handlinger | Alle klik og opstart |

## Udvikling

```bash
npm install                  # første gang (ESLint)
npm run check                # byg, kodetjek og tests
node tests/run.js vdot       # kør kun tests med "vdot" i navnet
tools/release.sh "Besked"    # byg, tjek, test og commit, kun hvis alt består
```

- Cache-versionen i `sw.js` regnes ud fra indholdet, så telefoner får hver ændring uden at man hæver et tal.
- Gemte data har et versionsnummer (`SCHEMA` i `03-data.js`). Alle felter har én standardværdi i `FIELDS`. Ændres formen på data, hæves `SCHEMA`, og opgraderingen skrives i `normalize()`.
- Kalenderen ændres kun gennem funktionerne i `04-kalender.js` (`setDay`, `setManual`, `skipDay`, `addExtra` …).
