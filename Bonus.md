# Bonus Feature Document for Film‑Platform
## Project Brief
Streamy‑Video‑Streaming‑Backend (Film‑Platform): object‑oriented video streaming backend implemented in Python for GEIAL314‑B2a lab work.

## Base Lab Requirements Completed
1. Lab10: All eight domain classes implemented, UML‑to‑Python skeleton mapping, inheritance, composition/aggregation list containers, compile‑safe skeleton, git feature‑branch workflow and pull‑request.
2. Lab11: Authorization playback logic, composition cascade‑delete, aggregation lifecycle isolation, integration test simulation, final delivery pull‑request.

## Bonus Extra Implemented Features
1. Fixed original lab PDF code indentation & syntax errors: original lab material contained broken line‑wrapped code, repaired to fully runnable source `streamy_core.py`.
2. Complete formal English lab report (`Report.md`) documenting objective, theory, steps, test‑results and conclusion.
3. Repository documentation: README for project build‑and‑run instructions.
4. Runtime output clearly labelled log sections for easier manual verification of composition/aggregation behaviour.

## How To Run
Environment: Python 3.8 or higher
```bash
# syntax compile check
python3 -m py_compile streamy_core.py

# execute full integration simulation
python3 streamy_core.py
