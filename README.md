# Streamy — Video Streaming Platform

Lab assignment for **GEIAL314-B2a Software Technology Practical Lab**, University of Miskolc.

- **Student:** XUHAOJIE
- **Neptun code:** DTR5N0
- **Labs:** Lab 10 (UML → Python skeletons) + Lab 11 (logic integration, architectural verification, delivery)
- **Bonus:** a full web front end with a real catalogue, video upload and a streaming player

## What this is

The repository contains the object-oriented backend of a video streaming platform,
translated from the UML domain model into Python, plus a browser front end built on
top of it. No business rule is duplicated in the UI: every playback decision still
comes from `Title.play_media()` inside `streamy_core.py`.

## Features

| Area | What it does |
|---|---|
| Catalogue | Cards with poster, year, genre, runtime/seasons, actor list |
| Filtering | Nav views (Films / TV Shows / With video), genre chips, live search |
| Upload | Drag & drop or browse, optional poster, metadata form, progress bar |
| Playback | Token gate, authorization log streaming in real time, HTML5 player with seek |
| Lab demo | One-click purge to show composition cascade + aggregation survival |

## Files

| File | Purpose |
|---|---|
| `streamy_core.py` | 8 domain classes, production logic, integration test |
| `app.py` | Flask adapter: catalogue, upload, streaming, purge demo |
| `templates/index.html` | Page structure |
| `static/css/app.css` | Dark cinema theme |
| `static/js/app.js` | Rendering, token gate, upload progress |
| `data/media.json` | Catalogue (created on first start) |
| `uploads/` | Uploaded videos and posters |
| `Report.md` / `*.docx` | Lab 10 & Lab 11 report |
| `Bonus.md` | Bonus feature document for the instructor |

## Run

```bash
pip install flask
python app.py
```

Then open <http://127.0.0.1:5000>.

The core lab evidence still runs on its own:

```bash
python -m py_compile streamy_core.py
python streamy_core.py
```

## HTTP API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/catalog` | All titles |
| GET | `/api/stats` | Counts, actor ledger, storage used |
| POST | `/api/upload` | Multipart upload: `video`, optional `poster`, metadata |
| POST | `/api/play/<id>` | JSON `{"token": ...}` → authorization decision + trace |
| POST | `/api/purge/<id>` | Composition cascade on a TV show |
| DELETE | `/api/media/<id>` | Remove a title and its files |
| GET | `/media/<file>` | Video stream, HTTP range supported |
| GET | `/poster/<file>` | Poster image |

## Architecture

- **Generalization:** `Film(Title)`, `TVShow(Title)`
- **Composition (\*--):** `TVShow → Season → Episode`, `Title → Review`
- **Aggregation (o--):** `Title → Actor` (actors survive parent purge)
- **Association:** `Genre ↔ Title`

See Appendix C of `Report.md` for the full Mermaid class diagram.
