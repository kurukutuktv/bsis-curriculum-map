#!/usr/bin/env python3
"""
OBTL (.docx, City College of Calapan template) -> roadmap JSON.

Usage:
    python3 obtl_to_roadmap.py OBTL-xxx.docx [more.docx ...]  [--out roadmaps]

Writes  <out>/<SLUG>.json  for every OBTL.  Then run  build.py  to regenerate the site.

Everything is read from the document itself (course header, PILO/CILO, the weekly
table with ILO / topics / TLAs / assessment tasks, exam rows, grading, readings).
Nothing is invented; the script warns when a part of the template is missing.
"""
import sys, os, re, json, html, datetime
import docx
from docx.oxml.ns import qn


def W(e, t):
    return e.findall(qn(t))


def clean(s):
    return re.sub(r'\s+', ' ', s).strip()


def ptext(p):
    return clean(''.join(t.text or '' for t in p.iter(qn('w:t'))))


def cell_lines(tc):
    return [x for x in (ptext(p) for p in W(tc, 'w:p')) if x]


def cell_text(tc):
    return clean(' '.join(cell_lines(tc)))


def phtml(p):
    """paragraph -> html string, italic runs become <i>"""
    segs = []
    for r in p.iter(qn('w:r')):
        t = ''.join(x.text or '' for x in r.findall(qn('w:t')))
        if not t:
            continue
        rp = r.find(qn('w:rPr'))
        it = rp is not None and rp.find(qn('w:i')) is not None
        if segs and segs[-1][1] == it:
            segs[-1][0] += t
        else:
            segs.append([t, it])
    out = ''
    for t, it in segs:
        t = html.escape(t, quote=False)
        out += ('<i>%s</i>' % t) if it else t
    return re.sub(r'\s+', ' ', out).strip()


def slugify(code):
    return re.sub(r'[^A-Za-z0-9]', '', code).upper()


def vmerge(tc):
    pr = tc.tcPr
    return pr is not None and pr.find(qn('w:vMerge')) is not None


def week_range(label):
    nums = [int(x) for x in re.findall(r'\d+', label)]
    if not nums:
        return None, None
    return nums[0], nums[-1]


def exam_id(name):
    n = name.lower()
    if 'prelim' in n:
        return 'prelim'
    if 'midterm' in n:
        return 'midterm'
    if 'final' in n:
        return 'final'
    return re.sub(r'[^a-z0-9]+', '-', n).strip('-')


def nice(label):
    return label.title() if label.isupper() else label


def parse(path):
    warnings = []
    d = docx.Document(path)
    header = weekly = info = footer = None
    weekly_tables = []
    for t in d.tables:
        first = cell_text(t.rows[0]._tr.tc_lst[0])
        if first == 'Vision':
            header = t
        elif first == 'Basic Readings':
            info = t
        elif first == 'Course Title' and len(t.rows[0]._tr.tc_lst) >= 6:
            footer = t
        else:
            txt = ' '.join(cell_text(tc) for tr in t.rows[:3] for tc in tr._tr.tc_lst)
            if 'F2F' in txt or 'EXAMINATION' in txt.upper():
                weekly_tables.append(t)
    if not (header and weekly_tables and info):
        raise SystemExit('%s: does not look like the OBTL template' % path)

    # ---------- course header
    code = title = units = prereq = desc = ''
    pilo, cilo = [], []
    for tr in header.rows:
        tcs = tr._tr.tc_lst
        label = cell_text(tcs[0])
        if label == 'Course Title':
            title = cell_text(tcs[1]); code = cell_text(tcs[3])
        elif label == 'Credit Units':
            units = cell_text(tcs[1]); prereq = cell_text(tcs[3])
        elif label == 'Course Description':
            desc = cell_text(tcs[1])
        elif label.startswith('Program Intended'):
            pilo = cell_lines(tcs[1])
        elif label.startswith('Course Intended'):
            cilo = [x for x in cell_lines(tcs[1]) if not x.lower().startswith('at the end')]
    for k, v in (('code', code), ('title', title), ('PILO', pilo), ('CILO', cilo)):
        if not v:
            warnings.append('missing ' + k)

    # ---------- weekly table
    items = []
    for t in weekly_tables:
        rows = [tr._tr for tr in t.rows]
        i = 0
        while i < len(rows):
            tcs = rows[i].tc_lst
            texts = [cell_text(tc) for tc in tcs]
            if len(tcs) <= 2 and 'EXAMINATION' in texts[0].upper():
                name = nice(texts[0])
                items.append(dict(type='exam', id=exam_id(name), name=name,
                                  mode=texts[1] if len(texts) > 1 else ''))
                i += 1
                continue
            if len(tcs) == 7 and texts[3].lower() == 'f2f' and i + 1 < len(rows):
                a, b = tcs, rows[i + 1].tc_lst
                label = texts[0]
                s, e = week_range(label)
                ats = cell_lines(a[6])
                if not vmerge(b[6]):
                    ats += [x for x in cell_lines(b[6]) if x not in ats]
                item = dict(
                    type='week', id='w' + label.replace('–', '-').replace(' ', ''),
                    label=label, start=s, end=e,
                    ilo=cell_text(a[1]),
                    topics=cell_lines(a[2]),
                    tla=dict(f2f=cell_lines(b[3]), async_=cell_lines(b[4]), sync=cell_lines(b[5])),
                    at=[dict(text=x, mco=(int(m.group(1)) if (m := re.match(r'MCO\s*(\d)', x)) else None)) for x in ats])
                if not item['topics']:
                    warnings.append('week %s has no topics' % label)
                items.append(item)
                i += 2
                continue
            i += 1  # header row or spacer

    # ---------- readings, policies
    readings = {'basic': [], 'extended': []}
    grading = dict(components=[], breakdown=[])
    for tr in info.rows:
        tcs = tr._tr.tc_lst
        label = cell_text(tcs[0])
        if label in ('Basic Readings', 'Extended Readings'):
            key = 'basic' if label.startswith('Basic') else 'extended'
            group = None
            for p in W(tcs[1], 'w:p'):
                txt = ptext(p)
                if not txt:
                    continue
                if re.search(r'\(\d{4}|\(n\.d\.', txt):
                    if group is None:
                        group = dict(heading='', items=[]); readings[key].append(group)
                    group['items'].append(phtml(p))
                else:
                    group = dict(heading=txt.rstrip(':'), items=[]); readings[key].append(group)
        elif label == 'Course Policies':
            for line in cell_lines(tcs[1]):
                m = re.search(r'(\d{1,3})\s*%', line)
                if not m or 'total' in line.lower():
                    continue
                lab = clean(re.split(r'\s*[–\-:]?\s*\d{1,3}\s*%', line)[0]).rstrip('–-: ')
                low = lab.lower()
                pct = int(m.group(1))
                if 'class standing' in low:
                    grading['components'].append(dict(key='standing', label='Class Standing', pct=pct))
                elif 'prelim' in low:
                    grading['components'].append(dict(key='prelim', label='Preliminary Examination', pct=pct))
                elif 'midterm' in low:
                    grading['components'].append(dict(key='midterm', label='Midterm Examination', pct=pct))
                elif 'final' in low:
                    grading['components'].append(dict(key='final', label='Final Examination', pct=pct))
                elif re.match(r'(input|process|outcome|output)', low):
                    mm = re.match(r'([A-Za-z]+)\s*(?:\((.*)\))?', lab)
                    grading['breakdown'].append(dict(label=mm.group(1).title(), detail=(mm.group(2) or '').strip(), pct=pct))
    order = {'standing': 0, 'prelim': 1, 'midterm': 2, 'final': 3}
    grading['components'].sort(key=lambda c: order[c['key']])
    tot = sum(c['pct'] for c in grading['components'])
    if grading['components'] and tot != 100:
        warnings.append('grading components add up to %d%%, not 100%%' % tot)

    term = prepared = ''
    if footer:
        r1 = footer.rows[1]._tr.tc_lst
        term = nice(cell_text(r1[1]))
        pl = cell_lines(r1[2])
        prepared = pl[0] if pl else ''

    for it in items:
        if it['type'] == 'week':
            it['tla']['async'] = it['tla'].pop('async_')
    if not items:
        warnings.append('no weekly rows found')
    return dict(
        slug=slugify(code), code=code, title=title, units=units, prereq=prereq, term=term,
        preparedBy=prepared, description=desc, pilo=pilo, cilo=cilo, items=items,
        grading=grading, readings=readings,
        source=dict(file=os.path.basename(path), extracted=datetime.date.today().isoformat())
    ), warnings


def main(argv):
    out = 'roadmaps'
    args = []
    i = 0
    while i < len(argv):
        if argv[i] == '--out':
            out = argv[i + 1]; i += 2
        else:
            args.append(argv[i]); i += 1
    if not args:
        print(__doc__); return 1
    os.makedirs(out, exist_ok=True)
    for path in args:
        data, warns = parse(path)
        fn = os.path.join(out, data['slug'] + '.json')
        with open(fn, 'w', encoding='utf8') as f:
            json.dump(data, f, ensure_ascii=False, indent=1)
        weeks = [x for x in data['items'] if x['type'] == 'week']
        exams = [x for x in data['items'] if x['type'] == 'exam']
        print('%s  %s -> %s  | %d week groups, %d exams, %d topics, %d assessment tasks'
              % (data['code'], data['title'], fn, len(weeks), len(exams),
                 sum(len(w['topics']) for w in weeks), sum(len(w['at']) for w in weeks)))
        for w in warns:
            print('  WARNING:', w)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
