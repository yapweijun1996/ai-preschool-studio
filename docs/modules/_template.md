# Module: <name>

- Tier: Core | Operations | Family | Administration | Platform
- Owns: <entities this module is the single owner of>
- Reads: <entities owned elsewhere, and their owner>
- Status: planned | in progress | done (version)

## Purpose

One paragraph: the job this module does for its users, and what it deliberately does not do.

## Users and permissions

| Role | Can see | Can do |
|---|---|---|
| Teacher | | |
| Reviewer / Principal | | |
| School admin | | |
| Parent | | |

Access is enforced by Studio Platform; the demo shows it with the role switcher.

## Flows

Numbered steps for each main flow, naming the screen and the primary action on each step.

## Screens and states

For every screen: default, empty, loading, error (save failed, provider unavailable), blocked
(with the reason shown), and locked/read-only. Note the desktop, tablet (≤1024 bottom tabs) and
mobile (390) layouts.

## Rules

The domain rules as testable statements (for example: "submit requires all four areas written and
a reflection"). Each rule names the pure function that implements it.

## Compliance hooks

PDPA / ECDA points this module touches (consent purpose, retention category, audit events,
notification duties). Wording: "supports the licensee's obligations under …", never "compliant".

## Data port

The operations this module needs from the data port (reads and writes), with their shapes.

## Acceptance criteria

- [ ] Every flow works in en, 中文 and BM, light and dark, desktop and mobile.
- [ ] axe: no serious or critical violations on every screen and state.
- [ ] Keyboard-only and screen-reader walkthrough recorded.
- [ ] Catalog entries and visual regression shots for new components.
- [ ] Unit tests for every rule; e2e for every flow; live smoke updated.
- [ ] Independent review passed (no open P0/P1).
