# CLAUDE.md

Static BSIS curriculum map (CMO No. 25, s. 2015) with per-course roadmaps generated from OBTL .docx files.
GitHub Pages serves the repo root from `main`. The build tooling is in `source/` (see `source/README.md`).

## Rules
- `js/data.js` is generated from `source/curriculum_data.py` and must not change unless the user asks for it.
- Roadmaps contain only what the OBTL says. Never invent topics, PILO codes or references.
- Courses that are not in the CMO map (e.g. IS Elec_1) stay as "elective" cards. Do not add them to the map.
- `js/data.js` and `js/roadmaps/*.js` are generated. Never edit them by hand: edit the sources
  (`source/curriculum_data.py`, `source/obtl/*.docx` -> `source/roadmaps/*.json` via `source/obtl_to_roadmap.py`)
  and run `python3 source/build.py`.
- Keep HTML, CSS and JS in separate files (`*.html`, `css/`, `js/`). No inline `<script>` or `<style>` blocks.
- Progress is per-browser `localStorage`. There is no backend; do not add one.

## Test
```
python3 -m http.server 8765        # from the repo root
node source/tests/test_site.js     # needs the playwright package; writes screenshots to ./shots/ (must exist, do not commit)
```
