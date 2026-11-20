#!/usr/bin/env python3
"""Remove personal names from UN INFO exports and from index.html (public version).

Usage:  python3 scripts/anonimizar.py <repo_dir> [--check]

- Sub-output exports: the "Focal users" column is emptied.
- Indicator exports and any other text: the names listed in "Focal users" (all
  snapshots) and the names written in "AGÊNCIA RESPONSÁVEL" lines of the indicator
  descriptions are replaced by "[ponto focal]"; the agency acronyms are kept.
- index.html: the same replacements inside the embedded data.
The list of names is built from the data itself, so this script holds no names.
With --check, nothing is written and the script exits 1 if any name is found.
"""
import csv, io, re, sys, pathlib

ROOT = pathlib.Path(sys.argv[1]); CHECK = '--check' in sys.argv
MASK = '[ponto focal]'
NAME = r"[A-ZÀ-ÖØ-Ý][a-zà-öø-ÿ'’\-]+"
FULL = re.compile(rf"{NAME}(?:\s+(?:de|da|do|dos|das|e)?\s*{NAME})+")
AG_LINE = re.compile(r"(AG[ÊE]NCIA RESPONS[ÁA]VEL\s*:)(.*?)(?=(?:\\n|\n|FONTE|$))", re.S)
STOP = {'Cabo Verde','Santo Antão','São Vicente','São Nicolau','Xavier','Recenceamento Geral Agrícola'}  # never masked alone

def read(p):
    t = p.read_text(encoding='utf-8-sig')
    return list(csv.reader(io.StringIO(t)))

def collect(files):
    names = set()
    for p in files:
        rows = read(p)
        if not rows: continue
        h = rows[0]
        if 'Focal users' in h:
            i = h.index('Focal users')
            for r in rows[1:]:
                if i < len(r):
                    names |= {re.sub(r'\s+',' ',n).strip() for n in r[i].split(';') if n.strip() not in ('','-')}
        for r in rows[1:]:
            for cell in r:
                for m in AG_LINE.finditer(cell):
                    # person names in the "responsible agency" line; skip phrases with
                    # connector words (report or survey titles typed in the wrong field)
                    names |= {n for n in FULL.findall(m.group(2)) if not re.search(r'\s(de|da|do|dos|das|e)\s', n)}
    names = {n for n in names if len(n) > 4 and n not in STOP}
    return sorted(names, key=len, reverse=True)

def mask_text(s, pats):
    for p in pats: s = p.sub(MASK, s)
    return s

def main():
    csvs = sorted(ROOT.glob('*.csv')) + sorted(ROOT.glob('historico/*/*.csv'))
    names = collect(csvs)
    pats = [re.compile(r'\s+'.join(map(re.escape, n.split()))) for n in names]
    found = 0
    for p in csvs:
        rows = read(p)
        if not rows: continue
        h = rows[0]; fi = h.index('Focal users') if 'Focal users' in h else None
        out = [h]
        for r in rows[1:]:
            r = [mask_text(c, pats) for c in r]
            if fi is not None and fi < len(r): r[fi] = ''
            out.append(r)
        if out != rows:
            found += 1
            if not CHECK:
                buf = io.StringIO(); csv.writer(buf, quoting=csv.QUOTE_ALL, lineterminator='\n').writerows(out)
                p.write_text(buf.getvalue(), encoding='utf-8')
    for html in ['index.html', 'evolucao.html', 'indicadores.html']:
        p = ROOT / html
        if not p.exists(): continue
        t = p.read_text(encoding='utf-8')
        t2 = re.sub(r'("Focal users"\s*:\s*)"[^"]*"', r'\1""', t)
        t2 = mask_text(t2, pats)
        if t2 != t:
            found += 1
            if not CHECK: p.write_text(t2, encoding='utf-8')
    print(f'{len(names)} names detected · {found} files {"with names" if CHECK else "anonymised"}')
    if CHECK and found: sys.exit(1)

if __name__ == '__main__':
    main()
