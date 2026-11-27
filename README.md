# Streamy — Video Streaming Platform

Lab assignment for **GEIAL314-B2a Software Technology Practical Lab**, University of Miskolc.

- **Student:** XUHAOJIE
- **Neptun code:** DTR5N0
- **Labs:** Lab 10 (UML → Python skeletons) + Lab 11 (logic integration, architectural verification, delivery)
- **Bonus:** a full web front end with a real catalogue, video upload and a streaming player

## What this is

The repository contains the object-oriented backend of a video streaming platform,
translated from the UML domain model into Python, plus a browser front end built on top of
it. No business rule is duplicated in the UI: every playback decision still comes from
`Title.play_media()` inside `streamy_core.py`, and every lifetime rule still comes from
`TVShow.purge_tv_show_data()`.

## Features

| Area | What it does |
|---|---|
| Catalogue | Poster cards with year, genre, runtime or seasons, and the actor list |
| Filtering | Nav views (Films / TV Shows / With video), genre chips, live search over titles, genres and actors |
| Upload | Drag & drop or browse, MP4 / WEBM / OGV / MOV / M4V / MKV up to 4 GB, optional poster, metadata form, byte-level progress bar |
| Playback | Token gate calling the real domain method, authorization trace printed live, HTML5 player with HTTP range support (206) |
| Lab demo | One-click purge: composition cascade clears seasons, aggregation leaves the actor ledger intact |

## Files

| File | Purpose |
|---|---|
| `streamy_core.py` | 8 domain classes, production logic, integration test |
| `app.py` | Flask adapter: catalogue, upload, streaming, token gate, purge, delete |
| `templates/index.html` | Page shell |
| `static/css/app.css` | Dark cinema theme |
| `static/js/app.js` | Rendering, filtering, upload progress, player |
| `data/media.json` | Catalogue — created on first start, not tracked |
| `uploads/` | Uploaded videos and posters — only `demo_stream.mp4` is tracked |
| `Report.md` | Lab 10 & Lab 11 report |
| `Lab10-11_Report_XUHAOJIE_DTR5N0.docx` | The same report as a Word document |
| `Bonus.md` | Bonus feature document for the instructor |
| `README.md` | This file |

## Run

```bash
pip install flask
python app.py
```

Then open <http://127.0.0.1:5000>.

A bundled demo clip ships with the repository, so the player works on a fresh clone before
anything is uploaded: the first start seeds two demo titles and attaches
`uploads/demo_stream.mp4` to the featured one.

The core lab evidence still runs on its own:

```bash
python -m py_compile streamy_core.py
python streamy_core.py
```

## Playback token

The token gate is the Lab 11 sequence diagram, not real authentication:

- any non-empty token returns **200 OK** and a stream URL;
- an empty token or the literal `EXPIRED_TOKEN` returns **401 Unauthorized**.

So `abc`, `123` or `GUEST` all pass; that is the rule the lab asks for.

## HTTP API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/catalog` | All titles |
| GET | `/api/stats` | Counts, actor ledger, storage used |
| POST | `/api/upload` | Multipart upload: `video`, optional `poster`, metadata fields |
| POST | `/api/play/<id>` | JSON `{"token": ...}` → authorization decision plus the captured trace |
| POST | `/api/purge/<id>` | Composition cascade on a TV show, returns the log |
| DELETE | `/api/media/<id>` | Remove a title and its files from disk |
| GET | `/media/<file>` | Video stream, HTTP range supported |
| GET | `/poster/<file>` | Poster image |

## Architecture

- **Generalization:** `Film(Title)`, `TVShow(Title)`
- **Composition (\*--):** `TVShow → Season → Episode`, `Title → Review`
- **Aggregation (o--):** `Title → Actor` (actors survive the parent purge)
- **Association:** `Genre ↔ Title`

See Appendix C of `Report.md` for the full Mermaid class diagram.
