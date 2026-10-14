# The Putt Report

An interactive mini-golf scorecard and round recap, transcribed from a handwritten 18-hole card at David Graham’s Golf Complex.

**Live dashboard:** https://bradgmoore.github.io/mini-golf-scorecard/

| Player | Front 9 | Back 9 | Total | To par |
| --- | ---: | ---: | ---: | ---: |
| Phil | 28 | 22 | **50** | +14 |
| Brad | 29 | 25 | 54 | +18 |
| Taryn | 32 | 37 | 69 | +33 |

Phil wins by 4 strokes. Brad leads after hole 8 and holes 13–15; Phil regains the lead on hole 16. Ties are included in the lead timeline.

## Features

- Cumulative strokes, score to par, and gap to the overall leader
- Player visibility controls, graph tooltips, and an 18-hole lead timeline
- Round replay and a keyboard-accessible hole slider
- Hole-by-hole table, front/back filters, running totals, and CSV download
- Name and score editing with browser-local persistence and original-card restore
- Responsive design and no build dependencies

## Data notes

All holes are par 2. Names are read as Phil, Brad, and Taryn. Scores of 6 were transcribed as written, despite the printed five-stroke limit. No cap is applied. These are the recorded-score standings. Edits remain local to the visitor's browser and do not modify the hosted source. To change the shared data, update `dist/analytics.js` and push to `main`.

## Run locally

```sh
npm test
npm start
```

Open http://localhost:3000. The entire website is in `dist/`; GitHub Actions validates the calculations and publishes that folder to GitHub Pages on pushes to `main`. No package install is needed.
