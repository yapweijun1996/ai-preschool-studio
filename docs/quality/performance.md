# Lighthouse performance budgets

CI runs Lighthouse three times in its default mobile emulation for the deployed
dashboard (`#/`), students (`#/students`), Aria's report
(`#/students/aria/report`), and component catalog (`#/catalog`). The
`lighthouse` job runs after the live smoke checks pass. Reports stay in GitHub
Actions and use the filesystem upload target; they are not sent to a public
reporting service.

## Assertions

LHCI enforces these assertions on each route. Resource sizes are measured in
bytes; score and timing assertions use the median of the three CI runs.

| Assertion | Threshold | Severity |
|---|---:|---|
| Script resource size | ≤ 174,080 bytes (170 KB) | Error |
| Stylesheet resource size | ≤ 240,640 bytes (235 KB) | Error |
| Total resource size | ≤ 595,456 bytes (581.5 KB) | Error |
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

## First-party assets and font strategy (2026-10-22)

The production design reference makes no third-party requests. Google Fonts
sent each visitor's IP address to Google and its files were not available
offline through our service worker. A Playwright smoke test now checks all four
production routes and fails on requests outside the page origin; LHCI's
`resource-summary:third-party:count` is not used because Lighthouse counts the
GitHub Pages host itself as third party.

Inter Variable and Noto Sans SC are bundled from Fontsource. Inter uses its
Latin variable face; Noto Sans SC includes 400, 500, 600 and 700 with Unicode
ranges, so the browser fetches only glyph slices used by each page. The service
worker precaches the app shell and caches same-origin assets, including fonts,
on first use. The build emits 785 font files (22,137,340 bytes total, about
21.1 MiB); a local dashboard load fetched five font files totaling 164,604
transfer bytes. Its measured total resource transfer was 517,604 bytes.

The stylesheet and total limits are 15% above those measured dashboard values
(rounded up). The existing script limit remains 174,080 bytes.

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
