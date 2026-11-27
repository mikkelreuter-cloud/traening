# Styrke & VO₂ Log

Træningsplan og log for styrke og VO₂max. Installerbar web-app (PWA). Alle data gemmes lokalt på telefonen.

## Udvikling

| Fil | Hvad |
|---|---|
| `src/app.html` | Hele appen i én fil. Det er her, man retter. |
| `sw.js` | Service worker og passemotoren (CrossFit). Hæv `CACHE`-versionen, når motoren ændres. |
| `index.html` | Bygget fra `src/app.html`. Rettes ikke i hånden. |
| `tools/build.py` | Bygger `index.html`. |
| `tools/lint.js` | Kodetjek: navne der ikke findes, dobbelte nøgler, død kode. |
| `tests/run.js` | Logik- og klik-tests i en rigtig browser. |

```bash
npm install            # første gang (ESLint)
npm run check          # byg, kodetjek og tests
node tests/run.js vdot # kør kun tests med "vdot" i navnet
tools/release.sh "Besked"   # byg, tjek, test og commit, kun hvis alt består
```

Gemte data har et versionsnummer (`SCHEMA` i `src/app.html`). Alle felter har én standardværdi i `FIELDS`. Ændres formen på data, hæves `SCHEMA`, og opgraderingen skrives i `normalize()`.
