# Lab 10 & Lab 11 Report
Course: GEIAL314‑B2a Software Technology Practical Lab
Student: 2923565578
Project: Streamy Video Streaming Backend Platform

## 1. Objective
Lab 10 objective: Translate UML class architectural diagrams into Python code skeletons. Map UML classes, attributes, methods, inheritance, composition and aggregation into syntactically valid Python skeleton code with `pass` placeholder stubs. Perform compilation verification and manage source code via Git workflow including branch, commit and pull‑request procedures.

Lab 11 objective: Fill method stubs with production logic, enforce composition and aggregation lifecycle constraints, implement playback authorization flow, write integration runtime simulation, validate system architecture behaviour, finish software delivery sprint and complete agile Kanban workflow.

## 2. Theoretical Background
UML class diagrams provide structural blueprints for object‑oriented implementation:
1. UML Class → Python `class` definition.
2. Attributes → instance variables inside `__init__` constructor.
3. Methods → Python class functions.
4. **Visibility**: Python uses naming convention: double underscore for name‑mangling private members.
5. **Generalization (Inheritance)**: `class Child(Parent):`
6. **Composition (`*--`)**: Child object lifecycle fully controlled by parent; parent deletion must clear nested children.
7. **Aggregation (`o--`)**: Independent referenced objects; parent removal does NOT destroy aggregated entities.
8. Compile‑safe skeleton: use `pass` for empty bodies to validate syntax before implementing business logic.

Git branching workflow isolates feature development from main branch, pull requests perform code merge with task tracking by `Closes #issue‑number`.

## 3. Implementation Steps
### Lab10 Steps
1. Created git feature branch `feature/streamy‑codebase`.
2. Created source file `streamy_core.py`.
3. Implemented 8 domain classes: `Title`, `Film`, `TVShow`, `Season`, `Episode`, `Review`, `Actor`, `Genre`.
4. Implemented inheritance: `Film(Title)`, `TVShow(Title)`.
5. Initialized list containers for composition relationships inside constructors.
6. Used `pass` as method placeholder stubs.
7. Verified compilation: `python3 -m py_compile streamy_core.py`, zero syntax errors.
8. Git add, commit, push branch, created Pull Request, merged to main and deleted remote/local feature branch.

### Lab11 Steps
1. Created delivery branch `feature/system‑delivery`.
2. Replaced stub `pass` statements with functional logic:
   - `play_media()`: token‑based playback authorization flow.
   - `add_review()`: create and attach Review instance (composition).
   - `link_actor()`: attach Actor (aggregation).
   - `add_season()` / `add_episode()`: build composition hierarchy TVShow‑Season‑Episode.
   - `purge_tv_show_data()`: cascade clear seasons, episodes and reviews (enforce composition lifecycle, keep actor objects for aggregation).
   - `register_title()` and `display_catalog()` inside `Genre` class.
3. Wrote integration simulation block under `if __name__ == "__main__":`.
   - Instantiate actors, genre, TVShow, seasons and episodes.
   - Test two playback scenarios: expired token (expected False), valid token (expected True).
   - Print genre catalog, execute cascade deletion for composition validation.
4. Execute runtime: `python3 streamy_core.py`, observe console log output for authorization steps and memory‑management trace.
5. Git commit and push `feature/system‑delivery`, create final delivery Pull Request, merge into main branch.
6. Agile board: related sprint issue marked Done.

## 4. Test Results
Compilation test: `py_compile` finished without any syntax error.

Runtime integration test output observations:
1. Play‑media sequence logs print step‑1 to step‑5 authorization workflow matching sequence‑diagram design.
2. Expired token scenario returns `False`. Valid token scenario returns `True`.
3. `purge_tv_show_data()` clears seasons and episodes (composition constraint satisfied).
4. Actor objects remain in cast list after parent TVShow purged (aggregation constraint satisfied).
5. Genre catalog prints registered media titles correctly.

All structural constraints from UML model are enforced in executable Python code.

## 5. Conclusion
This lab completes full software engineering cycle: from UML modelling, skeleton code generation, towards functional implementation and integration verification. Composition and aggregation object‑lifetime rules are programmatically enforced. Git feature‑branch workflow and pull‑request merge simulate real‑world software delivery. The Streamy backend domain model is fully translated into runnable Python implementation.
