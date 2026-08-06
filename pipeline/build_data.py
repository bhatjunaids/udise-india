"""Shape raw_extract.json into data.json for the site, with validation.

Column maps confirmed against the PDFs (see extract_report.txt for citations):
  schools/teachers .mX : 11 cols, [0]=Total
  enrol .mX            : A 7 [Tot,PreP,Pri,UP,Elem,Sec,HSec] ; B 5 [Tot,Fdn,Prep,Mid,Sec]
  ptr                  : 4 levels (era-specific)
  ger/ner              : A 15 (5 groups x B/G/T) ; B 12 (4 stages x B/G/T)
  gpi                  : A 5 ; B 4
  dropout/transition   : 9 (3 groups x B/G/T)
  retention            : 9 (18-19) or 12 (4 groups x B/G/T)
  social (B only)      : 5 [General, SC, ST, OBC, Muslim]
  obc_pct/minority_pct : A 18 (last triple = Primary..Hr Sec overall) ; B 12 (no overall)
  cwsn                 : A 9 [Pri,UP,Elem x B/G/T] -> overall = idx 8 (Elementary total)
                         B 9 [Total,Fdn,Prep x B/G/T] -> overall = idx 2 (Total)
  infra (all)          : 15 = total x5 mgmt, with-facility x5, third block x5
                         third block = functional counts (elec/water/toilets)
                         or published % (library/computer/internet/ramps)
"""
import json
from common import YEARS_A, YEARS_B

raw = json.load(open("raw_extract.json"))
INFRA = {"in_elec":"el","in_water":"wa","in_btoilet":"bt","in_gtoilet":"gt",
         "in_library":"li","in_computer":"co","in_internet":"ne","in_ramps":"ra"}
FUNC_BLOCK = {"el","wa","bt","gt"}          # third block is functional counts
problems = []

def pad(vals, n):
    if vals is None: return None
    v = list(vals)
    if len(v) < n and all(x in (0, 0.0, None) for x in v):
        v = v + [0.0]*(n-len(v))            # zero-row wrapped into fewer cells
    if len(v) != n:
        return None
    return v

def r1(x): return None if x is None else round(x*10)/10

d, cite = {}, {}
for y, fams in raw.items():
    eraA = y in YEARS_A
    cite[y] = {k: [v["tno"], v["pages"]] for k, v in fams.items()}
    states = set()
    for f in fams.values(): states.update(f["rows"])
    for st in states: d.setdefault(st, {}).setdefault(y, {})

    def rows(key): return fams.get(key, {}).get("rows", {})

    for fam, out in (("schools","s"), ("teachers","t"), ("enrol","e")):
        n = 11 if fam != "enrol" else (7 if eraA else 5)
        for st in states:
            tot5 = []
            for mi in range(5):
                v = pad(rows(f"{fam}.m{mi}").get(st), n)
                tot5.append(v[0] if v else None)
            if any(x is not None for x in tot5):
                d[st][y][out] = tot5
            if fam == "enrol":
                v = pad(rows("enrol.m0").get(st), n)
                if v: d[st][y]["elvl"] = v[1:]

    SIMPLE = {"ptr":("ptr",4), "ger":("ger",15 if eraA else 12), "ner":("ner",15 if eraA else 12),
              "gpi":("gpi",5 if eraA else 4), "dropout":("dr",9), "transition":("tr",9),
              "social":("soc",5)}
    for fam,(out,n) in SIMPLE.items():
        for st, v in rows(fam).items():
            v2 = pad(v, n)
            if v2: d[st][y][out] = v2
            elif v: problems.append(f"{y} {fam} {st}: ncols {len(v)} != {n}")
    for st, v in rows("retention").items():
        if len(v) in (9, 12): d[st][y]["rr"] = v
    for st, v in rows("obc_pct").items():
        v2 = pad(v, 18 if eraA else 12)
        if v2:
            d[st][y]["obcT"] = v2[17] if eraA else None
            if not eraA and "soc" in d[st][y]: d[st][y]["obcT"] = d[st][y]["soc"][3]
    for st, v in rows("minority_pct").items():
        v2 = pad(v, 18 if eraA else 12)
        if v2 and eraA: d[st][y]["minT"] = v2[17]
    for st, v in rows("cwsn").items():
        v2 = pad(v, 9)
        if v2: d[st][y]["cwsnT"] = v2[8] if eraA else v2[2]
    for fam, k in INFRA.items():
        for st, v in rows(fam).items():
            v2 = pad(v, 15)
            if not v2:
                if v: problems.append(f"{y} {fam} {st}: ncols {len(v)} != 15")
                continue
            tot, avail, third = v2[0], v2[5], v2[10]
            if not tot: continue
            inf = d[st][y].setdefault("inf", {})
            if k in FUNC_BLOCK:
                inf[k] = [r1(avail/tot*100), r1(third/tot*100)]
            else:
                inf[k] = [r1(third) if third is not None and third <= 100 else r1(avail/tot*100)]

# ---- validation spot checks (values read manually from the PDFs) ----
CHECKS = [
    ("2018-19","India","s",0,1551000), ("2018-19","India","e",0,260294216),
    ("2018-19","India","ptr",0,27),    ("2018-19","India","dr",2,4.5),
    ("2023-24","India","ptr",0,10),    ("2023-24","India","soc",1,18.0),
    ("2023-24","India","ger",11,66.5), ("2023-24","India","dr",2,3.7),
]
ok = True
for y, st, k, i, want in CHECKS:
    got = d.get(st,{}).get(y,{}).get(k)
    got = got[i] if isinstance(got, list) and i < len(got) else got
    if got != want:
        ok = False; problems.append(f"SPOT-CHECK FAIL {y} {st} {k}[{i}]: got {got}, want {want}")
infra_chk = d.get("India",{}).get("2018-19",{}).get("inf",{}).get("li")
if not infra_chk or abs(infra_chk[0]-80.6) > 0.2:
    ok = False; problems.append(f"SPOT-CHECK FAIL 18-19 library %: {infra_chk} want ~80.6")

# The functional-% we derive from counts must equal the same report's own
# published percentages (2023-24 Tables 8.6 / 8.9 / 8.8) — an independent check
# on the whole infra column map, not just on parsing.
for k, tbl, want in (("el","8.6",89.7), ("bt","8.9",91.4), ("gt","8.8",93.6)):
    got = d.get("India",{}).get("2023-24",{}).get("inf",{}).get(k)
    if not got or len(got) < 2 or abs(got[1]-want) > 0.1:
        ok = False
        problems.append(f"SPOT-CHECK FAIL 23-24 functional {k}: got {got}, "
                        f"want {want} (report Table {tbl})")

states_now = sorted(s for s in d if s != "India" and all(yy not in d[s] or yy in ("2018-19","2019-20") or d[s].get(yy) for yy in []))
payload = {
    "yearsA": YEARS_A, "yearsB": YEARS_B,
    "states": ["India"] + sorted(s for s in d if s not in ("India","Dadra & Nagar Haveli","Daman & Diu")),
    "extraOld": ["Dadra & Nagar Haveli","Daman & Diu"],
    "lvlA": ["Primary (I–V)","Upper Primary (VI–VIII)","Secondary (IX–X)","Higher Secondary (XI–XII)"],
    "lvlB": ["Foundational (≤II)","Preparatory (III–V)","Middle (VI–VIII)","Secondary (IX–XII)"],
    "d": d, "cite": cite,
}
json.dump(payload, open("data.json","w"), separators=(",",":"))
print(f"states={len(d)} years-per-India={len(d.get('India',{}))}")
print("problems:", len(problems))
for p in problems[:40]: print(" ", p)
print("SPOT CHECKS:", "ALL PASS" if ok else "FAILURES — see above")
