# Film-Platform (Streamy Video Streaming Backend)

Lab assignment for **GEIAL314-B2a Software Technology Practical Lab**, University of Miskolc.

- **Student:** XUHAOJIE
- **Neptun code:** DTR5N0
- **Labs:** Lab 10 (UML to Python skeleton) + Lab 11 (logic integration, architectural verification, system delivery)

This repository implements the object-oriented backend of a video streaming platform, converted from the UML domain model to Python skeleton code and then to full functional logic.

## Files

| File | Purpose |
|---|---|
| `streamy_core.py` | Main source: 8 domain classes, production logic, integration test simulation |
| `app.py` | Flask entry point for the bonus web UI (3 routes) |
| `templates/index.html` | Bonus web page |
| `Report.md` | Lab 10 & Lab 11 English lab report |
| `Report_Lab10_Lab11_XUHAOJIE_DTR5N0.docx` | Same report as a Word document |
| `Bonus.md` | Bonus feature document for the instructor |
| `.gitignore` | Excludes `__pycache__` and local IDE files |

## Run locally

```bash
# 1. Syntax check (Lab 10 evidence)
python -m py_compile streamy_core.py

# 2. Core integration test (Lab 11 evidence)
python streamy_core.py

# 3. Optional bonus web UI
pip install flask
python app.py
```

`python streamy_core.py` runs the architectural verification simulation and prints runtime logs for the authorization flow, the composition cascade delete, and the aggregation check.

`python app.py` starts a local web server at `http://127.0.0.1:5000`, where the same `play_media()` logic can be tested with a valid and an expired token.

## Architecture

- **Generalization:** `Film(Title)`, `TVShow(Title)`
- **Composition (\*--):** `TVShow → Season → Episode`, `Title → Review`
- **Aggregation (o--):** `Title → Actor` (actors survive parent purge)
- **Association:** `Genre ↔ Title`

See Appendix C of `Report.md` for the full Mermaid class diagram.
