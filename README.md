# UDISE+ India Dashboard (2018-19 → 2025-26)

A static, self-contained dashboard over the official **UDISE+ national reports**
(Department of School Education & Literacy, Ministry of Education, Government of India),
covering all States/UTs + India across eight years, with a built-in smart search box.

**Live site:** https://bhatjunaids.github.io/udise-india/

## Why outcomes are split into two eras

From **2022-23**, UDISE+ changed two things at once: it restructured levels into NEP stages
(Foundational / Preparatory / Middle / Secondary, replacing Primary / Upper Primary /
Secondary / Higher Secondary), and it moved from school-aggregated counts to **individual
student records**. The Ministry states that figures from 2022-23 onward are *not strictly
comparable* with earlier reports.

This dashboard therefore never draws an outcome trend across that break:

- **Outcomes 2018-22** and **Outcomes 2022-26** are separate tabs, each using its own era's
  level definitions (shown with class ranges, e.g. "Secondary (IX–X)" vs "Secondary (IX–XII)").
- Count series (schools / enrolment / teachers) that span all eight years carry a **dashed
  divider** at the 2022-23 break, and the line is deliberately broken across it.
- Infrastructure percentages are school-level facts and run through all eight years.

## What's covered

| Area | Indicators |
|---|---|
| Core counts & workforce | Schools, enrolment, teachers by management (Govt / Aided / Private Unaided / Others); PTR by level |
| Infrastructure | % schools with functional electricity, drinking water, functional boys'/girls' toilets, library, computer, internet, CWSN ramps |
| Equity & inclusion | SC / ST / OBC / Muslim / all-minority enrolment shares, Gender Parity Index, CWSN enrolment |
| Outcomes & student flow | GER, NER, dropout, transition, retention — by level and gender, per era |

Every indicator on screen cites its source table number and page in that year's report.

## Smart search

The search box runs entirely client-side (no API key, no backend). It understands questions like:

- `GER in Bihar 2023-24`
- `Compare girls toilets in UP vs Kerala`
- `Top 5 states by PTR` / `Which state has the lowest dropout rate?`
- `Dropout rate for girls in Rajasthan` (returns both eras side by side, clearly separated)
- `private schools in Maharashtra`

It recognises state abbreviations (UP, MP, TN, J&K…), levels, genders, managements and years.

## Repository layout

```
index.html          the built dashboard (what GitHub Pages serves)
site/
  template.html     page shell + styles
  app.js            dashboard logic, charts, smart search
pipeline/
  common.py         state-name normalization, number parsing
  extract.py        locates & extracts state-wise tables from each report
  build_data.py     shapes raw rows into data.json (+ validation spot-checks)
  build_site.py     injects data.json + app.js into the template
  raw_extract.json  intermediate extraction, with table numbers and pages
  data.json         the shaped dataset the site embeds
  extract_report.txt  per-table log: table number, pages, states, column count
pdfs/               source reports (not committed — large)
```

## Reproducing

```bash
# 1. put the reports in pdfs/ as 18-19.pdf … 25-26.pdf
pip3 install pdfplumber
cd pipeline
python3 extract.py        # or: python3 extract.py 2019-20   (re-does one year)
python3 build_data.py     # runs spot-checks against hand-read PDF values
python3 build_site.py
```

## Publishing

Pushing to `main` has not reliably triggered the Pages workflow on this repo, so
after pushing, start the deploy explicitly and confirm what is actually served:

```bash
gh workflow run pages.yml --ref main
curl -s https://bhatjunaids.github.io/udise-india/ | md5   # compare with: md5 -q index.html
```

`build_data.py` fails loudly if any table's column count is unexpected, and verifies
eight known values (e.g. India 2018-19 schools = 1,551,000; India 2023-24 GER Secondary
= 66.5) read by hand from the PDFs.

## Data notes

- The 2019-20 report as circulated has **outlined fonts and no text layer**; this pipeline uses
  the equivalent booklet from the UDISE+ archive, which is text-extractable and identical in
  content.
- 2018-19 and 2019-20 report **Dadra & Nagar Haveli** and **Daman & Diu** separately; they are a
  single UT from 2020-21. **Ladakh** appears from 2019-20.
- Retention in 2018-19 is published for three levels only; the fourth shows "–" rather than
  borrowing a neighbouring level's value.
- "Private" means *Private Unaided (Recognized)*. Unrecognized private schools sit inside
  "Others" — UDISE+ does not report them separately.
- GER can exceed 100% (over- and under-age enrolment). Dropout is not published for the first
  stage of either era.
