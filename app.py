"""
Streamy Video Streaming Platform - Web Front End (GEIAL314-B2a bonus UI)

Backend layer only. All business rules (playback authorization, composition /
aggregation life cycle) still live inside streamy_core.py. This file is a thin
adapter: it stores files, keeps a small JSON catalogue, and calls the domain
classes for every decision.
"""

import contextlib
import io
import json
import os
import uuid
from datetime import datetime
from pathlib import Path

from flask import Flask, abort, jsonify, render_template, request, send_from_directory

from streamy_core import Actor, Episode, Film, Genre, Season, TVShow

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
DATA_DIR = BASE_DIR / "data"
DATA_FILE = DATA_DIR / "media.json"

VIDEO_EXTS = {".mp4", ".webm", ".ogv", ".ogg", ".mov", ".m4v", ".mkv"}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

UPLOAD_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 4 * 1024 * 1024 * 1024  # 4 GB per request

# id -> domain object (rebuildable from the JSON catalogue)
TITLES = {}
CATALOG = []


# ---------------------------------------------------------------- persistence
def save_catalog():
    DATA_FILE.write_text(
        json.dumps(CATALOG, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def build_title(record):
    """Rebuild a domain object from a catalogue row."""
    if record["kind"] == "show":
        title = TVShow(record["title"], record["year"], record.get("network") or "Streamy")
        for number in range(1, int(record.get("seasons") or 1) + 1):
            season = Season(number)
            season.add_episode(Episode(f"Season {number} · Episode 1", 2700))
            title.add_season(season)
    else:
        title = Film(record["title"], record["year"], int(record.get("minutes") or 0))

    for name in record.get("actors", []):
        title.link_actor(Actor(name))
    return title


def rebuild_index():
    TITLES.clear()
    for record in CATALOG:
        TITLES[record["id"]] = build_title(record)


def public_record(record):
    """Shape a record for the browser (no server paths leaked)."""
    return {
        "id": record["id"],
        "title": record["title"],
        "year": record["year"],
        "kind": record["kind"],
        "genre": record.get("genre") or "Drama",
        "network": record.get("network") or "",
        "minutes": record.get("minutes") or 0,
        "seasons": record.get("seasons") or 0,
        "actors": record.get("actors") or [],
        "hasVideo": bool(record.get("filename")),
        "hasPoster": bool(record.get("poster")),
        "posterUrl": f"/poster/{record['poster']}" if record.get("poster") else "",
        "size": record.get("size") or 0,
        "created": record.get("created") or "",
        "description": record.get("description") or "",
    }


def seed_catalog():
    """First start gets one demo show and one demo film, no file attached."""
    now = datetime.now().isoformat(timespec="seconds")
    return [
        {
            "id": uuid.uuid4().hex[:10],
            "title": "Stranger Things",
            "year": 2016,
            "kind": "show",
            "genre": "Sci-Fi",
            "network": "Netflix",
            "seasons": 1,
            "actors": ["Ashley Peacock", "Eddy Gerbil"],
            "filename": "",
            "poster": "",
            "size": 0,
            "created": now,
            "description": "When a young boy vanishes, a small town uncovers a mystery "
            "involving secret experiments and terrifying forces.",
        },
        {
            "id": uuid.uuid4().hex[:10],
            "title": "The Quiet Signal",
            "year": 2024,
            "kind": "film",
            "genre": "Thriller",
            "minutes": 118,
            "actors": ["Mara Voss", "Ilya Renner"],
            "filename": "",
            "poster": "",
            "size": 0,
            "created": now,
            "description": "A radio astronomer hears a pattern that should not exist, "
            "and someone starts deleting the evidence.",
        },
    ]


def attach_demo_clip():
    """On a fresh clone, wire the bundled demo clip to the featured title."""
    demo = UPLOAD_DIR / "demo_stream.mp4"
    if not demo.exists():
        return
    for record in CATALOG:
        if record["kind"] == "show" and not record.get("filename"):
            record["filename"] = demo.name
            record["size"] = demo.stat().st_size
            record["description"] = (
                "A bundled demo stream: it proves the token gate, the HTTP range "
                "requests and the player work end to end."
            )
            return


def load_catalog():
    global CATALOG
    if DATA_FILE.exists():
        try:
            CATALOG = json.loads(DATA_FILE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            CATALOG = seed_catalog()
    else:
        CATALOG = seed_catalog()
        attach_demo_clip()
        save_catalog()
    rebuild_index()


load_catalog()


# ---------------------------------------------------------------------- views
@app.route("/")
def index():
    return render_template("index.html")


@app.get("/api/catalog")
def api_catalog():
    return jsonify({"items": [public_record(r) for r in CATALOG], "count": len(CATALOG)})


@app.get("/api/stats")
def api_stats():
    actors = sorted({name for r in CATALOG for name in r.get("actors", [])})
    video_count = sum(1 for r in CATALOG if r.get("filename"))
    total_bytes = sum(r.get("size") or 0 for r in CATALOG)
    return jsonify(
        {
            "titles": len(CATALOG),
            "withVideo": video_count,
            "shows": sum(1 for r in CATALOG if r["kind"] == "show"),
            "films": sum(1 for r in CATALOG if r["kind"] == "film"),
            "actors": actors,
            "actorCount": len(actors),
            "storageMB": round(total_bytes / (1024 * 1024), 2),
        }
    )


@app.post("/api/upload")
def api_upload():
    """Accept a video file (plus optional poster) and register it in the catalogue."""
    video = request.files.get("video")
    if video is None or video.filename == "":
        return jsonify({"ok": False, "error": "No video file received."}), 400

    ext = Path(video.filename).suffix.lower()
    if ext not in VIDEO_EXTS:
        return jsonify({"ok": False, "error": f"Unsupported format: {ext or 'unknown'}"}), 400

    stored = f"{uuid.uuid4().hex}{ext}"
    target = UPLOAD_DIR / stored
    video.save(target)

    poster_name = ""
    poster = request.files.get("poster")
    if poster is not None and poster.filename:
        poster_ext = Path(poster.filename).suffix.lower()
        if poster_ext in IMAGE_EXTS:
            poster_name = f"{uuid.uuid4().hex}{poster_ext}"
            poster.save(UPLOAD_DIR / poster_name)

    title = (request.form.get("title") or "").strip() or Path(video.filename).stem
    try:
        year = int(request.form.get("year") or 2026)
    except ValueError:
        year = 2026
    kind = request.form.get("kind") if request.form.get("kind") in {"film", "show"} else "film"

    try:
        minutes = int(request.form.get("minutes") or 0)
    except ValueError:
        minutes = 0
    try:
        seasons = int(request.form.get("seasons") or (1 if kind == "show" else 0))
    except ValueError:
        seasons = 1 if kind == "show" else 0

    record = {
        "id": uuid.uuid4().hex[:10],
        "title": title,
        "year": year,
        "kind": kind,
        "genre": (request.form.get("genre") or "Drama").strip(),
        "network": (request.form.get("network") or "Streamy Originals").strip(),
        "minutes": minutes,
        "seasons": seasons,
        "actors": [a.strip() for a in (request.form.get("actors") or "").split(",") if a.strip()],
        "filename": stored,
        "poster": poster_name,
        "size": target.stat().st_size,
        "created": datetime.now().isoformat(timespec="seconds"),
        "description": (request.form.get("description") or "").strip(),
    }

    CATALOG.append(record)
    save_catalog()
    rebuild_index()
    return jsonify({"ok": True, "item": public_record(record)}), 201


@app.post("/api/play/<media_id>")
def api_play(media_id):
    """Token gate. The real decision is Title.play_media() in streamy_core.py."""
    record = next((r for r in CATALOG if r["id"] == media_id), None)
    if record is None:
        return jsonify({"ok": False, "error": "Unknown title"}), 404

    payload = request.get_json(silent=True) or {}
    token = (payload.get("token") or "").strip()

    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer):
        granted = TITLES[media_id].play_media(token)

    return jsonify(
        {
            "granted": granted,
            "token": token,
            "logs": [line for line in buffer.getvalue().splitlines() if line.strip()],
            "stream": f"/media/{record['filename']}" if (granted and record.get("filename")) else "",
            "hasVideo": bool(record.get("filename")),
        }
    )


@app.post("/api/purge/<media_id>")
def api_purge(media_id):
    """Composition proof: purge a show, its seasons go, its actors stay."""
    record = next((r for r in CATALOG if r["id"] == media_id), None)
    if record is None or record["kind"] != "show":
        return jsonify({"ok": False, "error": "Not a TV show"}), 400

    show = TITLES[media_id]
    before_actors = len(show.cast_actors)
    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer):
        show.purge_tv_show_data()

    logs = [line for line in buffer.getvalue().splitlines() if line.strip()]
    return jsonify(
        {
            "ok": True,
            "seasonsAfter": len(show.seasons),
            "actorsAfter": len(show.cast_actors),
            "actorsBefore": before_actors,
            "logs": logs,
        }
    )


@app.delete("/api/media/<media_id>")
def api_delete(media_id):
    global CATALOG
    record = next((r for r in CATALOG if r["id"] == media_id), None)
    if record is None:
        return jsonify({"ok": False, "error": "Unknown title"}), 404

    for key in ("filename", "poster"):
        name = record.get(key)
        if name:
            path = UPLOAD_DIR / name
            if path.exists():
                path.unlink()

    CATALOG = [r for r in CATALOG if r["id"] != media_id]
    save_catalog()
    rebuild_index()
    return jsonify({"ok": True})


@app.get("/media/<path:filename>")
def stream_video(filename):
    # conditional=True gives HTTP range support, so the player can seek.
    return send_from_directory(UPLOAD_DIR, filename, conditional=True)


@app.get("/poster/<path:filename>")
def poster_file(filename):
    return send_from_directory(UPLOAD_DIR, filename, conditional=True)


@app.errorhandler(413)
def too_large(_):
    return jsonify({"ok": False, "error": "File is larger than the 4 GB limit."}), 413


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
