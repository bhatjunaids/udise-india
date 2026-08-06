# UDISE+ India Dashboard — KPI Specification

Public state-comparison dashboard over the UDISE+ national reports, 2018-19 → 2025-26,
all States/UTs + India. Built fresh (not derived from any earlier dashboard).

## The two eras — never mixed in one trend

|  | Era A — pre-NEP | Era B — NEP |
|---|---|---|
| Years | 2018-19, 2019-20, 2020-21, 2021-22 | 2022-23, 2023-24, 2024-25, 2025-26 |
| Levels | Primary (I–V), Upper Primary (VI–VIII), Secondary (IX–X), Higher Secondary (XI–XII) | Foundational (≤II), Preparatory (III–V), Middle (VI–VIII), Secondary (IX–XII) |
| Counting | School-wise consolidated data | Individual student records (deduplicated) |

The Ministry states data from 2022-23 onward is **not strictly comparable** with earlier
reports for GER, NER, dropout and related indicators.

Dashboard consequences:

- **Outcomes appear in two tabs** — "Outcomes 2018-22" and "Outcomes 2022-26" — each using its
  own era's level names, shown with class ranges so the difference is visible on screen.
- **Counts** (schools / enrolment / teachers) span all eight years on one axis but carry a
  dashed divider at the break, and the line is broken across it. Era deltas are computed
  within an era only.
- **Infrastructure percentages** are school-level facts and run through all eight years.
- Where a year publishes fewer levels than its era's label list (2018-19 retention has three,
  not four), the missing level renders "–" rather than borrowing a neighbouring value.

## KPI set

1. **Core counts & workforce** — schools, enrolment, teachers by management
   (Government / Aided / Private Unaided Recognized / Others); PTR by level.
2. **Infrastructure & facilities** — % of schools with functional electricity, drinking water,
   functional boys' toilet, functional girls' toilet, library, computer, internet, CWSN ramps.
3. **Equity & inclusion** — SC / ST / OBC / Muslim / all-minority enrolment shares,
   Gender Parity Index of GER, CWSN enrolment.
4. **Outcomes & student flow** (two-era tabs) — GER, NER, dropout, transition, retention,
   by level and gender, per that era's level structure.

## Source tables (pinned, verified per year)

Table numbers as printed in each year's report. Page numbers are recorded alongside in
`pipeline/extract_report.txt` and surfaced in the dashboard's own citations.

| Indicator | 18-19 | 19-20 | 20-21 | 21-22 | 22-23 | 23-24 | 24-25 | 25-26 |
|---|---|---|---|---|---|---|---|---|
| Schools by management | 1.2 | 1.2 | 1.2 | 3.2 | 3.2 | 3.2 | 3.2 | 3.2 |
| Teachers by management | 2.1 | 2.1 | 2.1 | 4.1 | 4.2 | 4.2 | 4.2 | 4.2 |
| Enrolment by management | 3.1 | 3.1 | 3.1 | 5.1 | 5.1 | 5.1 | 5.1 | 5.1 |
| PTR | 2.11 | 2.11 | 2.11 | 4.11 | 4.12 | 4.12 | 4.12 | 4.12 |
| GER | 5.1 | 5.1 | 5.1 | 6.1 | 6.1 | 6.1 | 6.1 | 6.1 |
| NER | 5.4 | 5.4 | 5.4 | 6.4 | 6.4 | 6.4 | 6.4 | 6.4 |
| GPI of GER | 5.7 | 5.7 | 5.7 | 6.7 | 6.7 | 6.7 | 6.7 | 6.7 |
| Dropout rate | 5.13 | 5.13 | 5.13 | 6.13 | 6.11 | 6.11 | 6.11 | 6.11 |
| Transition rate | 5.14 | 5.14 | 5.14 | 6.14 | 6.12 | 6.12 | 6.12 | 6.12 |
| Retention rate | 5.15 | 5.15 | 5.15 | 6.15 | 6.13 | 6.13 | 6.13 | 6.13 |
| Social category shares | — | — | — | — | 2.4 | 2.4 | 2.4 | 2.4 |
| OBC % | 5.8 | 5.8 | 5.8 | 6.8 | 6.8 | 6.8 | 6.8 | 6.8 |
| All-minority % | 5.10 | 5.10 | 5.10 | 6.10 | 6.10 | 6.10 | 6.10 | 6.10 |
| CWSN enrolment | 3.11 | 3.11 | 3.11 | 5.11 | 5.11 | 5.11 | 5.11 | 5.11 |
| Electricity | 6.1 | 6.1 | 6.1 | 7.1 | 7.1 | 7.1 | 7.1 | 7.1 |
| Drinking water | 6.2 | 6.2 | 6.2 | 7.2 | 7.2 | 7.2 | 7.2 | 7.2 |
| Boys' toilet | 6.3 | 6.3 | 6.3 | 7.3 | 7.3 | 7.3 | 7.3 | 7.3 |
| Girls' toilet | 6.4 | 6.4 | 6.4 | 7.4 | 7.4 | 7.4 | 7.4 | 7.4 |
| Library | 6.7 | 6.7 | 6.7 | 7.7 | 7.7 | 7.7 | 7.7 | 7.7 |
| Computer | 6.9 | 6.9 | 6.9 | 7.9 | 7.9 | 7.9 | 7.9 | 7.9 |
| Internet | 6.11 | 6.11 | 6.11 | 7.11 | 7.11 | 7.11 | 7.11 | 7.11 |
| CWSN ramps | 6.13 | 6.13 | 6.13 | 7.13 | 7.13 | 7.13 | 7.13 | 7.13 |

Social-category shares (SC/ST/OBC/Muslim in one table) only exist from 2022-23; Era A
publishes OBC and all-minority shares separately, which is what the Equity tab shows there.

For the management-split families, each management has its own table
(e.g. schools 3.2–3.6 = All / Government / Aided / Private Unaided / Others in Era B);
the dashboard uses each table's Total column.

## Data caveats

- In the management tables, **IAF** and **Navy Education Society** columns sit under the
  *Private Unaided Recognized* group header, not Aided.
- Unrecognized private schools are inside **Others** — no separate management column exists.
- Dropout is not published for the first stage of either era. GER can exceed 100%.
- 2018-19 and 2019-20 list **Dadra & Nagar Haveli** and **Daman & Diu** separately (merged UT
  from 2020-21). **Ladakh** appears from 2019-20.
- The 2019-20 report as circulated has outlined fonts with no text layer; the pipeline uses the
  text-extractable equivalent from the UDISE+ archive.

## Verification

`pipeline/build_data.py` fails loudly on any unexpected column count and re-checks eight values
read by hand from the PDFs, including India 2018-19 schools = 1,551,000, India 2018-19
enrolment = 260,294,216, India 2023-24 GER Secondary = 66.5, and India 2023-24 SC share = 18.0.

Sources on the era break: [Education for All in India](https://educationforallinindia.com/analysis-of-udiseplus-reports-2022-23-2023-24-per-the-nep-structure/),
[Drishti IAS](https://www.drishtiias.com/daily-updates/daily-news-analysis/udise-report-2023-24),
[Careers360](https://news.careers360.com/udise-plus-latest-report-37-lakh-drop-school-enrolment-till-class-12-sc-st-obc-minority-nep-gross-enrolment-ratio-udiseplus).
