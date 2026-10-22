# Lighthouse performance budgets

CI runs Lighthouse three times in its default mobile emulation for the deployed
dashboard (`#/`), students (`#/students`), Aria's report
(`#/students/aria/report`), and component catalog (`#/catalog`). The
`lighthouse` job runs after the live smoke checks pass. Reports stay in GitHub
Actions and use the filesystem upload target; they are not sent to a public
reporting service.

## Assertions

LHCI enforces these assertions on each route. Resource sizes are measured in
bytes. Error-level assertions use pessimistic aggregation, so the worst result
across collected runs must pass. Warn-level speed assertions use the median of
the three CI runs to report typical performance while the baseline is observed.

The routes are hash-based (`#/`, `#/students`, and so on), so their collected
URLs differ only by the fragment. LHCI groups these as one URL; its default
`optimistic` aggregation can therefore check only the best result and miss a
heavier page. Pessimistic aggregation on every error-level assertion ensures
the heaviest page and worst run are checked despite that grouping.

| Assertion | Threshold | Severity |
|---|---:|---|
| Script resource size | ≤ 159,923 bytes (156.2 KiB) | Error |
| Stylesheet resource size | ≤ 10,978 bytes (10.7 KiB) | Error |
| Total resource size | ≤ 274,597 bytes (268.2 KiB) | Error |
| Accessibility score | ≥ 0.95 | Error |
| Best Practices score | ≥ 0.90 | Error |
| Cumulative Layout Shift | ≤ 0.10 | Error |
| Performance score | ≥ 0.90 | Warn |
| First Contentful Paint | ≤ 2,000 ms | Warn |
| Largest Contentful Paint | ≤ 2,500 ms | Warn |
| Total Blocking Time | ≤ 200 ms | Warn |
| Time to Interactive | ≤ 3,500 ms | Warn |

Error assertions fail the Lighthouse job. Warn assertions report regressions
without failing it during the baseline period. After one week of CI medians,
the speed assertions (performance score and timing metrics) move to error.

## First live measurement (2026-10-22)

The manager ran `@lhci/cli` 0.15.1 against the live site with mobile emulation,
one run, and network traffic through a proxy, so timings are pessimistic. These
are baseline observations, not CI medians:

| Route | Performance | Accessibility | Best Practices | FCP | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|
| `#/` | 0.82 | 1.00 | 1.00 | 3,432 ms | 3,432 ms | 0 ms | 0 |
| `#/students/aria/report` | 0.91 | — | — | 2,679 ms | 2,679 ms | 116 ms | 0 |

The largest improvement lever is the single entry chunk, about 460 KB raw / 140
KB gzip. Route-level code splitting is a follow-up.

## Route-splitting baseline (2026-10-23)

Before splitting, `npm run build` emitted the following JavaScript:

| Chunk | Raw | Gzip |
|---|---:|---:|
| `index-CQ1e-SDb.js` (entry and all eager routes/locales) | 554,710 B | 163,560 B |
| `Classes-sQsQvzN8.js` | 4,210 B | 1,380 B |
| `FamilyEnrolment-CATie8JD.js` | 14,330 B | 3,460 B |
| `CatalogContent-BPPWBrZz.js` | 20,120 B | 6,630 B |

The three locale dictionaries account for 97,424 bytes of TypeScript source
(English 31,792; Chinese 31,606; Malay 34,026), with page copy alone accounting
for 67,145 bytes. Page components total 125,690 bytes of source, before their
shared components. `src/data/demo.ts` is 15,697 bytes. Vite's initial entry is
above its 500 KB warning threshold and close to the Lighthouse script budget.

## Route splitting (2026-10-23)

The build now loads page modules on their route, the active locale before the
first render, and other locales when selected. Pointer hover, keyboard focus,
and touch start preload the matching route. After the app becomes idle, the
Students route is preloaded. The persistent AppShell surrounds both the route
content and its skeleton fallback.

| Chunk | Before raw / gzip | After raw / gzip |
|---|---:|---:|
| Entry | 554,710 / 163,560 B | 19,954 / 5,529 B |
| React and Router vendor | included in entry | 261,449 / 83,134 B |
| Shared AppShell | included in entry | 92,781 / 28,911 B |
| English locale | included in entry | 26,960 / 9,080 B |
| Chinese locale | included in entry | 27,241 / 10,421 B |
| Malay locale | included in entry | 29,636 / 9,555 B |
| useStudentLabels | included in entry | 430 / 215 B |
| AccessDenied | included in entry | 496 / 308 B |
| NotFound | included in entry | 639 / 358 B |
| StudentTabs | included in entry | 646 / 346 B |
| Catalog page | included in entry | 1,536 / 749 B |
| Modal | included in entry | 1,537 / 754 B |
| ReportFlow | included in entry | 1,862 / 864 B |
| EmptyIllustration | included in entry | 1,866 / 833 B |
| FamilyReport page | included in entry | 3,723 / 1,320 B |
| Reviews | included in entry | 3,768 / 1,286 B |
| Classes | 4,210 / 1,380 B | 4,338 / 1,442 B |
| LearningProgress | included in entry | 4,839 / 1,850 B |
| Students | included in entry | 5,529 / 1,986 B |
| AuditLog | included in entry | 5,648 / 1,609 B |
| Coverage | included in entry | 6,946 / 2,110 B |
| StudentProfile | included in entry | 7,716 / 2,541 B |
| AddObservation | included in entry | 9,375 / 3,081 B |
| Settings | included in entry | 11,445 / 3,142 B |
| FamilyEnrolment | 14,330 / 3,460 B | 14,405 / 3,511 B |
| ReportPreview | included in entry | 15,493 / 4,325 B |
| CatalogContent | 20,120 / 6,630 B | 20,278 / 6,700 B |
| PortfolioStudio | included in entry | 26,186 / 7,621 B |

Each current JS chunk is at most 261,449 B raw, so Vite emits no large-chunk
warning. The production preview requested scripts for each route; sizes below
are the sum of each requested JS file's gzip size (equivalent to the compressed
script transfer budget):

| Page | Before scripts | After scripts |
|---|---:|---:|
| `#/` | 149,635 B | 129,996 B |
| `#/students` | 149,635 B | 129,996 B |
| `#/students/aria/studio` | 149,635 B | 138,839 B |
| `#/students/aria/report` | 149,635 B | 136,297 B |
| `#/catalog` | 156,488 B | 139,063 B |
| `#/coverage` | 149,635 B | 132,106 B |

The dashboard total includes the idle Students preload. The largest configured
Lighthouse route is now Catalog at 139,063 B; its script budget is 159,923 B,
15% higher rounded up. The dashboard script transfer is 19,639 B lower than
before, and the heaviest configured page is 17,425 B lower.

## Local route transfer measurement (2026-10-22)

The manager measured per-page transfers with `@lhci/cli` 0.15.1 against a local
`vite preview` of this branch. Hash-route pages share the same URL before the
fragment, which explains why LHCI's default optimistic aggregation missed the
report page's larger total. Pessimistic error assertions now cover this case.

| Measurement | Size |
|---|---:|
| Main stylesheet | 8,217 B |
| Catalog stylesheet | 9,546 B |
| Main script | 149,635 B |
| Catalog script | 156,488 B |
| Largest total (`#/students/aria/report`) | 244,309 B |

The stylesheet budget is 10,978 B, 15% above the catalog's 9,546 B. The total
resource budget remains 274,597 B, 15% above the largest observed route total
(244,309 B, rounded up). The script limit is now 159,923 B based on the
heaviest measured page after route splitting.

The same local mobile Lighthouse run scored `#/` 0.92, `#/students` 0.97,
`#/students/aria/report` 0.96, `#/catalog` 0.94, and `#/coverage` 0.87 for
performance. Performance remains warn-only while the baseline is observed.

## CLS hotfix (2026-10-22)

The first full live LHCI run (three mobile runs per URL, pessimistic
aggregation) failed the `cumulative-layout-shift <= 0.1` assertion. The observed
values in run order were `#/`: 0.047, 0, 0.047; `#/students`: 0.016 in all
three runs; `#/students/aria/report`: 0.114 in all three runs; and `#/catalog`:
0, 0.243, 0.243.

A local three-run reproduction with the default DevTools throttling measured
0.0059 CLS on the report and 0.0022 on the catalog. Lighthouse identified the
report's “Submit for review” button as the moved element and named the late
Inter WOFF2 load as its cause. On the catalog, the “Tokens” heading moved as
the lazy route replaced its single-element fallback. The report photo already
has explicit dimensions and a fixed CSS slot, so it was not the cause.

The fix preloads the hashed Inter WOFF2 from the generated HTML, applies
metric-adjusted Arial/Helvetica fallback metrics while Inter loads, and keeps
the catalog app shell mounted while its content chunk loads with a fallback
that reserves the first section. The workflow now uploads hidden files so the
`.lighthouseci` reports are included in its artifact.

After the fix, the same local three-run Lighthouse collection measured CLS 0
on all six report and catalog runs, with no layout-shift entries in the audit.
The Playwright layout-shift tests also exercise both routes with a 1.6 Mbps,
150 ms CDP network profile and enforce a CLS sum below 0.05.

## First-party assets and font strategy (2026-10-22)

The production design reference makes no third-party requests. Google Fonts
sent each visitor's IP address to Google and its files were not available
offline through our service worker. A Playwright smoke test now checks all four
production routes and fails on requests outside the page origin; LHCI's
`resource-summary:third-party:count` is not used because Lighthouse counts the
GitHub Pages host itself as third party.

Inter Variable is self-hosted as one Latin-only WOFF2 (48,256 bytes); the
service worker precaches the app shell and runtime-caches this font on first
use. Chinese uses the operating system's native CJK font from the platform
stack (`PingFang SC`, `Hiragino Sans GB`, `Microsoft YaHei`, `Noto Sans CJK SC`,
`Noto Sans SC`, `Source Han Sans SC`). This is the standard zh-CN UI pattern:
the large system CJK fonts are already installed, avoiding hundreds of
Unicode-range requests and avoiding a web-font dependency for Chinese glyphs.
There are no third-party font requests.

The manager's previous build emitted 785 WOFF/WOFF2 files (about 21.1 MiB) and
its render-blocking main CSS was 510.16 KB raw / 208.94 KB gzip; `dist` was 24
MB. The Inter-only build emits one WOFF2, a 38.75 KB main CSS file (7.19 KB
gzip), and a 612,091-byte `dist` directory. Current Lighthouse measurements
are 8,217 B for the main stylesheet and 9,546 B for the catalog stylesheet;
see the route measurement table above for the active stylesheet and total
budgets. The script limit is 159,923 bytes, based on the measured post-split
Catalog script transfer plus 15%.

## Reading the CI report

Open the workflow run's **Artifacts** section and download `lighthouse-report`.
The `.lighthouseci` directory contains the individual Lighthouse JSON reports,
the manifest linking each run to its URL, and the local report HTML. Review all
three runs for a route before attributing an assertion result to a code change;
mobile timings can vary between runs. LHCI reports warn-level speed assertions
and fails the error-level assertions.

## Changing a budget

Update the matching assertion in `lighthouserc.json`. Include a specific reason
in the pull request, such as a measured asset addition or a product requirement,
and cite the new local build size or Lighthouse evidence. Keep the limit close
to the measured need and recheck all four routes in CI.
