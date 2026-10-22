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
| Script resource size | ≤ 174,080 bytes (170 KB) | Error |
| Stylesheet resource size | ≤ 9,237 bytes (9.0 KiB) | Error |
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

## Local route transfer measurement (2026-10-22)

The manager measured per-page transfers with `@lhci/cli` 0.15.1 against a local
`vite preview` of this branch. Hash-route pages share the same URL before the
fragment, which explains why LHCI's default optimistic aggregation missed the
report page's larger total. Pessimistic error assertions now cover this case.

| Route | Transfer total |
|---|---:|
| `#/` | 208,238 B |
| `#/students` | 208,238 B |
| `#/students/aria/report` | 238,780 B |
| `#/catalog` | 167,845 B |

The total resource budget is 274,597 B, 15% above the heaviest observed page
(238,780 B, rounded up). The current build still fits the existing script and
stylesheet budgets.

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
gzip), and a 612,091-byte `dist` directory. Both CSS bundles together are
8,032 gzip bytes. For the budget baseline, emitted HTML/CSS/JS are counted at
gzip size and WOFF2 at its file size: 205,922 bytes across app assets. The
stylesheet (8,032 bytes) and total limits are 15% above these build figures,
rounded up. The existing script limit remains 174,080 bytes.

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
