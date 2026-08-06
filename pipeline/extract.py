"""Extract state-wise KPI tables from UDISE+ national report booklets.

Usage: python3 extract.py [year ...]   (from the pipeline/ directory)
Reads  ../pdfs/{yy-yy}.pdf, writes/merges raw_extract.json + extract_report.txt

Note: 19-20.pdf is the udiseplus.gov.in archive booklet (the originally shared
copy had outlined fonts / no text layer; kept as 19-20-flattened-original.pdf).
"""
import json, os, re, sys
import pdfplumber
from common import YEARS_A, YEARS_B, FILE_OF, norm_state, num, state_rows

YEARS = sys.argv[1:] or YEARS_A + YEARS_B

# A family is located by its phrase appearing in a line that starts "Table N.N".
# Variant families (schools/teachers/enrol) repeat 5x with a management subtitle.
MGMT_SUBTITLES = [
    (re.compile(r"all (types|management)", re.I), 0),
    (re.compile(r"government aided", re.I), 2),
    (re.compile(r"private unaided", re.I), 3),
    (re.compile(r"other schools?|others", re.I), 4),
    (re.compile(r"government", re.I), 1),
]

FAMILIES = {
    "schools":    r"Number of schools by management and school category",
    "teachers":   r"Number of teachers by management and school category",
    "enrol":      r"Enrolment of students by (school )?management and level of school education",
    "ptr":        r"Pupil Teacher Ratio \(PTR\) by level",
    "ger":        r"Gross Enrolment Ratio \(GER\) by Gender and Level.*All Social Groups",
    "ner":        r"Net Enrolment Ra(?:te|tio) \(NER\) by Gender and Level.*(All Social Groups|School Education)",
    "gpi":        r"Gender Parity Index \(GPI\) of GER",
    "dropout":    r"Dropout Rate by level",
    "transition": r"Transition Rate by level",
    "retention":  r"Retention Rate by level",
    "social":     r"Proportion of Enrolments? by Social Category",   # Era B only
    "obc_pct":    r"Percentage of OBC enrolment to total enrolment",
    "minority_pct": r"Percentage of all minority groups.{0,3} enrolment to total enrolment",
    "cwsn":       r"Enrolment of Children With Special Needs \(CWSN\) by Gender",
    "in_elec":    r"availability of electricity and functional electricity",
    # 19-20 splits "drinking" across a line break ("functional drinkin water")
    "in_water":   r"availability of drinking water and\s+functional drinkin",
    "in_btoilet": r"availability of boy.?s toilet and functional",
    "in_gtoilet": r"availability of girl.?s toilet and functional",
    "in_library": r"availability of (library|Library/ ?Book Bank)",
    "in_computer":r"availability of computer facility",
    "in_internet":r"availability of internet",
    "in_ramps":   r"availability o?f? ?ramps for Children",
}
VARIANT_FAMILIES = {"schools", "teachers", "enrol"}
TABLE_LINE = re.compile(r"^\s*Table\s+(\d{1,2}\.\d{1,2})\s*[:.]?\s*(.*)", re.I)

def page_lines(page):
    return (page.extract_text() or "").split("\n")

def match_family(lines):
    """Return (family, tno, title) if the page starts a wanted table."""
    for ln in lines[:4]:
        m = TABLE_LINE.match(ln)
        if not m:
            continue
        tno, title = m.group(1), m.group(2)
        # Never anchor on a "(continued)" page: those carry a different column
        # block (e.g. 19-20 infra continuations hold percentages, not counts),
        # so matching one silently yields the wrong columns. Missing the real
        # start page then surfaces as a MISSING warning instead.
        if re.search(r"\(cont", title, re.I):
            return None
        # title may wrap to next line; join a bit of context
        ctx = title + " " + " ".join(lines[1:3])
        for fam, pat in FAMILIES.items():
            if re.search(pat, ctx, re.I):
                return fam, tno, title.strip()
    return None

def mgmt_of(lines, fam):
    """Which management variant is this schools/teachers/enrol table?"""
    ctx = " ".join(lines[:6])
    for pat, mi in MGMT_SUBTITLES:
        if pat.search(ctx):
            return mi
    return None

def collect_rows(pdf, start_idx):
    """State rows from start page + continuation pages (pages that don't
    start a new 'Table N.N')."""
    rows, pages = {}, []
    i = start_idx
    while i < len(pdf.pages):
        lines = page_lines(pdf.pages[i])
        if i != start_idx and any(TABLE_LINE.match(l) for l in lines[:4]):
            break
        got = False
        for tbl in pdf.pages[i].extract_tables() or []:
            for st, rest in state_rows(tbl):
                if st not in rows:
                    vals = [num(c) for c in rest if c not in (None, "")]
                    if any(v is not None for v in vals):
                        rows[st] = vals
                        got = True
        if got:
            pages.append(i + 1)
        if i != start_idx and not got:
            break
        i += 1
    return rows, pages

def extract_year(year, report):
    out = {}
    with pdfplumber.open(f"../pdfs/{FILE_OF[year]}.pdf") as pdf:
        i = 0
        while i < len(pdf.pages):
            lines = page_lines(pdf.pages[i])
            hit = match_family(lines)
            if not hit:
                i += 1
                continue
            fam, tno, title = hit
            key = fam
            if fam in VARIANT_FAMILIES:
                mi = mgmt_of(lines, fam)
                if mi is None:
                    report.append(f"{year} {fam} {tno} p{i+1}: variant not identified — skipped")
                    i += 1
                    continue
                key = f"{fam}.m{mi}"
            if key in out:            # keep the first (section) occurrence
                i += 1
                continue
            rows, pages = collect_rows(pdf, i)
            if not rows:          # Contents-page ghost match — keep looking
                i += 1
                continue
            # From 2020-21 the two UTs are merged; a wrapped name cell can fall
            # back to a defunct single-UT name — remap onto the merged row.
            if year not in ("2018-19", "2019-20"):
                for old in ("Daman & Diu", "Dadra & Nagar Haveli"):
                    if old in rows:
                        merged = "Dadra & Nagar Haveli and Daman & Diu"
                        if merged not in rows:
                            rows[merged] = rows.pop(old)
                        else:
                            del rows[old]
            ncols = {len(v) for v in rows.values()}
            out[key] = {"tno": tno, "pages": pages, "title": title,
                        "ncols": sorted(ncols), "rows": rows}
            report.append(f"{year} {key:14s} T{tno:6s} p{pages} states={len(rows)} ncols={sorted(ncols)}")
            i = max(i + 1, (pages[-1] if pages else i + 1))
    return out

def main():
    report = []
    data = {}
    if os.path.exists("raw_extract.json"):
        data = json.load(open("raw_extract.json"))
    for y in YEARS:
        print(f"extracting {y} ...", flush=True)
        data[y] = extract_year(y, report)
        missing = [f for f in FAMILIES if f not in VARIANT_FAMILIES
                   and f not in data[y] and not (f == "social" and y in YEARS_A)
                   and not (f == "ner" and y == "2018-19")]
        for f in missing:
            report.append(f"{y} MISSING family: {f}")
        for fam in VARIANT_FAMILIES:
            have = [k for k in data[y] if k.startswith(fam + ".")]
            if len(have) < 5:
                report.append(f"{y} INCOMPLETE {fam}: have {sorted(have)}")
    json.dump(data, open("raw_extract.json", "w"))
    open("extract_report.txt", "w").write("\n".join(report))
    print("\n".join(report))
    print("wrote raw_extract.json")

if __name__ == "__main__":
    main()
