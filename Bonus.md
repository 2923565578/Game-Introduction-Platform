# Bonus Feature Document — Streamy Video Streaming Platform

**Student:** XUHAOJIE · **Neptun:** DTR5N0 · **Course:** GEIAL314-B2a Software Technology Practical Lab
**Repository:** https://github.com/2923565578/Game-Introduction-Platform

## 1. Project brief

A video streaming platform. The backend is the Streamy domain model from Lab 10–11, written
in Python. On top of it I built a browser front end that can upload videos, list them and
play them behind the lab's playback authorization flow.

## 2. Base requirements completed

- **Lab 10:** eight domain classes (`Title`, `Film`, `TVShow`, `Season`, `Episode`, `Review`,
  `Actor`, `Genre`), generalization `Film`/`TVShow` over `Title`, composition and aggregation
  collections inside the constructors, compile-safe skeletons, git feature branch and pull request.
- **Lab 11:** all stubs replaced with production logic; `play_media()` implements the
  sequence-diagram authorization branch; `purge_tv_show_data()` enforces composition by
  cascading the seasons and episodes away while leaving the actor records intact; integration
  test block executed in the terminal.

## 3. Extra features (the bonus part)

Each item below says what it does, what you can see because of it, and where the code is.

### 3.1 Full video-platform interface
`static/css/app.css`, `static/js/app.js`, `templates/index.html`

- **Does:** dark cinema layout with a header, view tabs, live search, featured hero, poster
  grid and genre chips.
- **Effect:** the repository no longer looks like a test page — it opens as a platform, with
  real cards, hover states and a working filter. Every card gets a generated gradient poster
  when no image was uploaded, so nothing looks unfinished.
- **Proof:** open the root URL. The catalogue, the counters in the hero panel and the filters
  all react to data from the server.

### 3.2 Video upload
`app.py` → `POST /api/upload`

- **Does:** drag-and-drop or browse, MP4 / WEBM / MOV / MKV / M4V up to 4 GB, optional poster
  image, full metadata form (title, year, film or show, genre, actors, runtime or seasons,
  network, synopsis), real byte-level progress bar.
- **Effect:** a new title appears in the catalogue immediately and is playable at once,
  because the domain object is rebuilt on upload instead of on restart.
- **Proof:** upload a clip, watch the progress bar move, then find the card in the grid.

### 3.3 Streaming player with range support
`app.py` → `GET /media/<file>`, `static/js/app.js`

- **Does:** serves the file with `conditional=True`, which answers with `206 Partial Content`.
  The HTML5 player is embedded in a modal.
- **Effect:** the timeline can be dragged and the video plays from that point. Without range
  support the browser would have to pull the whole file every time.
- **Proof:** see the `206` status in the server log when seeking.

### 3.4 Token gate wired to the domain logic
`app.py` → `POST /api/play/<id>`, `static/js/app.js`

- **Does:** the player asks for a playback token, calls the server, and the server runs
  `Title.play_media()` inside `contextlib.redirect_stdout` so the five printed authorization
  lines are captured and returned verbatim.
- **Effect:** the sequence diagram from Lab 11 is visible in the browser, not only in the
  terminal — the same code that the lab asks for, displayed live under the player. Any
  non-empty token returns `200 OK`; an empty token or `EXPIRED_TOKEN` returns `401`.
- **Proof:** the log panel shows `[App Engine] 1` … `[Catalog Engine] 5` for a valid token,
  and stops at `3a. Token verification failed` for an expired one.

### 3.5 Architecture lab panel (composition vs aggregation in the UI)
`app.py` → `POST /api/purge/<id>`

- **Does:** a floating panel with a one-click purge button for a TV show, plus a "replay token
  test" button.
- **Effect:** the composition cascade and the surviving actor records can be demonstrated in
  front of the examiner without opening a terminal: the panel prints
  `1 Season arrays cleared` and `Cast ledger contains 2 actors (Left Intact)`.
- **Proof:** press *Purge a TV show* and read the result line under the log.

### 3.6 REST layer over the same domain classes
`app.py` → `/api/catalog`, `/api/stats`, `/api/upload`, `/api/play/<id>`, `/api/purge/<id>`,
`DELETE /api/media/<id>`, `/media/<file>`, `/poster/<file>`

- **Does:** the browser talks only to JSON endpoints; the page never re-implements a rule.
- **Effect:** business logic stays in one file (`streamy_core.py`). Deleting a title also
  removes its files from disk, so storage does not grow silently.

### 3.7 Repair of the lab PDF source and delivery documentation
`streamy_core.py`, `Report.md`, `README.md`

- **Does:** the code printed in the Lab 11 PDF was broken by page wrapping — methods cut across
  lines, a misplaced `clear()` method, broken f-strings, `add_episode/episode_one` as a syntax
  error. The delivered file is the repaired version.
- **Effect:** `python -m py_compile streamy_core.py` passes and the integration test actually
  runs; the PDF version cannot run at all.
- **Proof:** compile check returns zero errors.

## 4. How to run

```bash
pip install flask
python app.py
```

Open <http://127.0.0.1:5000>. A bundled demo clip is included, so the player works on a fresh
clone before you upload anything.

Console-only lab evidence:

```bash
python -m py_compile streamy_core.py
python streamy_core.py
```

Environment: Python 3.8 or newer. Flask is needed only for the web layer.
