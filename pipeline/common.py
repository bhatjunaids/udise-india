"""Shared helpers for UDISE+ booklet extraction (both eras)."""
import re

YEARS_A = ["2018-19", "2019-20", "2020-21", "2021-22"]   # pre-NEP levels, school-aggregated
YEARS_B = ["2022-23", "2023-24", "2024-25", "2025-26"]   # NEP stages, student-level records
FILE_OF = {y: y[2:4] + "-" + y[5:7] for y in YEARS_A + YEARS_B}

# Canonical state list (as of 2020-21 onward: 36 States/UTs + India).
# 2018-19 and 2019-20 additionally have separate "Dadra & Nagar Haveli" and
# "Daman & Diu" rows (merged UT from 2020-21) — kept as published, plus a
# combined pseudo-row is NOT synthesized (no cross-era arithmetic).
CANON = [
    "India", "Andaman & Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh",
    "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
    "Dadra & Nagar Haveli and Daman & Diu", "Dadra & Nagar Haveli", "Daman & Diu",
    "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir",
    "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
    "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
]

def _key(name):
    n = re.sub(r"\s+", " ", str(name)).strip().lower()
    n = n.replace("&", "and")
    toks = [t for t in re.split(r"[^a-z]+", n) if t and t != "and"]
    return "".join(toks)

_ALIASES = {
    "jammukashmir": "Jammu & Kashmir",
    "uttaranchal": "Uttarakhand",
    "orissa": "Odisha",
    "pondicherry": "Puducherry",
    "andamannicobarislands": "Andaman & Nicobar Islands",
    "andamannicobar": "Andaman & Nicobar Islands",
    "delhinct": "Delhi", "nctofdelhi": "Delhi",
    "dadranagarhavelidamandiu": "Dadra & Nagar Haveli and Daman & Diu",
    "thedadranagarhavelidamandiu": "Dadra & Nagar Haveli and Daman & Diu",
    "damandiudadranagarhaveli": "Dadra & Nagar Haveli and Daman & Diu",
    "dadranagarhaveli": "Dadra & Nagar Haveli",
    "damandiu": "Daman & Diu",
}
_CANON_BY_KEY = {_key(c): c for c in CANON}

def norm_state(name):
    """Canonical state name, or None if the cell is not a state row."""
    k = _key(name)
    if not k:
        return None
    if k in _CANON_BY_KEY:
        return _CANON_BY_KEY[k]
    if k in _ALIASES:
        return _ALIASES[k]
    return None

def num(cell):
    """Parse a table cell to float, else None. Handles commas, NA, dashes, footnote stars."""
    if cell is None:
        return None
    s = str(cell).replace(",", "").replace("*", "").replace("%", "").strip()
    if s in ("", "-", "–", "—", "NA", "N/A", "NR", "@", ".."):
        return None
    try:
        return float(s)
    except ValueError:
        return None

def state_rows(table):
    """Yield (state, [cells...]) for rows whose first cell is a state.
    Some layouts (Era A enrolment) leave the first cell empty and put the
    state name in the second cell — shift in that case."""
    for row in table or []:
        if not row:
            continue
        st = norm_state(row[0])
        if st:
            yield st, row[1:]
        elif row[0] in (None, "") and len(row) > 2:
            st = norm_state(row[1])
            if st:
                yield st, row[2:]
