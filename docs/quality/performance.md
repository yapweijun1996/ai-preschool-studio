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
first render, and other locales when selected. The initial hash route is
preloaded in parallel with the initial locale before React mounts. Pointer
hover, keyboard focus, and touch start preload the matching route. After the app
becomes idle, the Students route is preloaded. One Suspense boundary retains
the current app shell during in-app navigation; a cold-load fallback renders
the target module's shell and skeleton.

| Chunk | Before raw / gzip | After raw / gzip |
|---|---:|---:|
| Entry (includes app shell and recovery UI) | 554,710 / 163,560 B | 116,391 / 34,972 B |
| React and Router vendor | included in entry | 261,449 / 83,134 B |
| English locale | included in entry | 27,138 / 9,136 B |
| Chinese locale | included in entry | 27,405 / 10,480 B |
| Malay locale | included in entry | 29,833 / 9,610 B |
| AccessDenied | included in entry | 493 / 306 B |
| NotFound | included in entry | 591 / 333 B |
| StudentTabs | included in entry | 643 / 342 B |
| Catalog page | included in entry | 1,519 / 734 B |
| Modal | included in entry | 1,537 / 752 B |
| ReportFlow | included in entry | 1,859 / 861 B |
| FamilyReport page | included in entry | 3,675 / 1,299 B |
| Reviews | included in entry | 3,765 / 1,284 B |
| Classes | 4,210 / 1,380 B | 4,290 / 1,420 B |
| LearningProgress | included in entry | 4,801 / 1,827 B |
| Students | included in entry | 5,435 / 1,947 B |
| AuditLog | included in entry | 5,600 / 1,579 B |
| Coverage | included in entry | 6,943 / 2,109 B |
| StudentProfile | included in entry | 7,646 / 2,514 B |
| AddObservation | included in entry | 9,332 / 3,059 B |
| Settings | included in entry | 11,396 / 3,113 B |
| FamilyEnrolment | 14,330 / 3,460 B | 14,402 / 3,506 B |
| ReportPreview | included in entry | 15,445 / 4,302 B |
| CatalogContent | 20,120 / 6,630 B | 20,230 / 6,679 B |
| PortfolioStudio | included in entry | 26,138 / 7,600 B |

Each current JS chunk is at most 261,449 B raw, so Vite emits no large-chunk
warning. The production preview requested scripts for each route; sizes below
are the sum of each requested JS file's gzip size (equivalent to the compressed
script transfer budget):

| Page | Before scripts | After scripts |
|---|---:|---:|
| `#/` | 149,635 B | 129,490 B |
| `#/students` | 149,635 B | 129,490 B |
| `#/students/aria/studio` | 149,635 B | 138,280 B |
| `#/students/aria/report` | 149,635 B | 135,735 B |
| `#/catalog` | 156,488 B | 138,513 B |
| `#/coverage` | 149,635 B | 131,596 B |

The dashboard total includes the idle Students preload. The largest configured
Lighthouse route is now Catalog at 138,513 B; its script budget remains
159,923 B, leaving 21,410 B of headroom. The dashboard script transfer is
20,145 B lower than before, and the heaviest configured page is 17,975 B lower.
No budget increase is needed.

### Route-lazy CSS ownership

CSS imported by a route-lazy module is loaded with that route. Components that
can render outside that route must not rely on those styles. Put shared component
styles in a stylesheet imported by the components that use them (or in the
global stylesheet), and keep route-only styles with the route. Cold-load browser
checks should cover every shared component that uses route-lazy CSS.

## Route and language load recovery (2026-10-23)

If a route chunk fails to preload or import, the app retries once by reloading
the page. A session-storage guard prevents a reload loop. If the route still
cannot load, an accessible alert card inside the app shell explains that the
page could not load and offers a Reload button. A successful route load clears
the guard. Studio drafts and portfolio state are serialized by the store to
`sessionStorage` after state changes, so the recovery reload retains them in
the same tab.

The initial language load retries with English if the saved locale fails. If
English also fails, bootstrap renders a plain-DOM alert and Reload button so
the root is never left blank. A language switch failure keeps the current
language and announces a translated status message. Locale chunk failures do
not trigger the route reload handler.

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
(244,309 B, rounded up). The 159,923 B script limit remains above the current
largest measured page, Catalog at 138,513 B.

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
