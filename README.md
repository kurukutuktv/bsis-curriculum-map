# BSIS Curriculum Map + Course Roadmaps

```
site/                  <- the website. Upload this folder to Vercel (no build step, no database)
  index.html           curriculum map (CMO No. 25, s. 2015)
  roadmap.html         roadmap viewer  (roadmap.html?c=CC106)
  css/  base.css  map.css  roadmap.css
  js/   common.js  map.js  roadmap.js
        data.js                      generated: CMO map data
        roadmaps/manifest.js         generated: list of roadmaps
        roadmaps/<SLUG>.js           generated: one file per OBTL
source/                <- only needed to add or update roadmaps
  obtl/                the OBTL .docx files
  roadmaps/            JSON extracted from each OBTL
  obtl_to_roadmap.py   OBTL .docx -> JSON
  build.py             JSON -> site/js files
  curriculum_data.py   CMO map data (source of truth for data.js)
```

## Add or update a roadmap
1. Put the OBTL (.docx, same template) in `source/obtl/`.
2. `cd source`
3. `pip install python-docx`   (once)
4. `python3 obtl_to_roadmap.py obtl/*.docx --out roadmaps`
5. `python3 build.py`
6. Upload `site/` again.

The script prints a warning if a part of the template is missing or grading does not add up to 100%.
A course whose code matches a course in the CMO map (CC106 -> CC106) gets a Roadmap button in the map;
other courses (e.g. IS Elec_1) appear as "elective" cards.

Progress (done / in progress / skip) is saved in each visitor's own browser (localStorage); it is not shared.
Roadmap ids come from the week labels, so progress survives re-uploading an OBTL unless weeks are renumbered.
