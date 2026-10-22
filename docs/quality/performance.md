# Lighthouse performance budgets

CI runs Lighthouse three times in its default mobile emulation for the deployed
dashboard (`#/`), students (`#/students`), Aria's report
(`#/students/aria/report`), and component catalog (`#/catalog`). The
`lighthouse` job runs after the live smoke checks pass. Reports stay in GitHub
Actions and use the filesystem upload target; they are not sent to a public
reporting service.

## Budgets

| Measure | Limit | Basis |
|---|---:|---|
| Script transfer | 170 KB | `npm run build` reports 143.46 KB gzip for the main bundle and 6.00 KB for the catalog chunk. Their 149.46 KB total is about 13.7% below the budget. |
| Stylesheet transfer | 15 KB | Build output reports 6.96 KB and 0.84 KB gzip (7.80 KB combined); the limit leaves room for normal styling growth. |
| Total transfer | 400 KB | Leaves room above the current roughly 158 KB compressed build output for HTML, route-specific assets, and future small assets while keeping the initial mobile page bounded. |
| Third-party resources | 0 | The app is self-contained; CI should catch external scripts, styles, fonts, and other third-party requests. |
| First Contentful Paint | 2,000 ms | Keeps initial visible content within two seconds on Lighthouse's default mobile profile. |
| Time to Interactive | 3,500 ms | Allows the heavier React routes to hydrate while keeping interaction readiness bounded. |
| Largest Contentful Paint | 2,500 ms | Matches the two-and-a-half-second target for the main page content. |
| Cumulative Layout Shift | 0.10 | Limits unexpected movement during loading. |
| Performance score | 0.85 minimum; warning below 0.90 | The minimum is a CI error threshold; scores from 0.85 to 0.89 produce a warning. |
| Accessibility score | 0.95 minimum | Keeps the existing accessibility quality bar in place for every route. |
| Best Practices score | 0.90 minimum | Requires a strong baseline for browser and web platform practices. |

Transfer sizes are Lighthouse's measured network sizes, which use compression
when available. Build gzip numbers provide a reproducible local baseline; the
browser's reported transfer can also include HTML and runtime-loaded resources.

## Reading the CI report

Open the workflow run's **Artifacts** section and download `lighthouse-report`.
The `.lighthouseci` directory contains the individual Lighthouse JSON reports,
the manifest linking each run to its URL, and the local report HTML. Review all
three runs for a route before attributing a budget failure to a code change;
mobile timings can vary between runs. The job log also warns when a performance
score falls below 0.90, while scores below 0.85 fail the Lighthouse assertion.

## Changing a budget

Update the matching entry in `budget.json` or `lighthouserc.json`. Include a
specific reason in the pull request, such as a measured asset addition or a
product requirement, and cite the new local build size or Lighthouse evidence.
Keep the limit close to the measured need and recheck all four routes in CI.
