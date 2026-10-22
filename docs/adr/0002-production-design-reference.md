# ADR 0002: Studio Demo becomes the production design reference

- Status: **Accepted** (owner decision, 2026-10-22)
- Supersedes: the "out of scope by brief" rows of [ADR 0001](0001-two-editions.md)
- Applies to: this repository (Studio Demo) and its consumer, Studio Platform (aipreschool.xyz)

## Context

The owner wants this design to be **production level**, so that Studio Platform can either copy
the design or port the implementation directly. The original brief excluded a parent portal, face
recognition and admin-heavy screens; the owner has now lifted those exclusions for design work.

## Decision

1. **Purpose.** Studio Demo is the production design reference for every module in ADR 0001.
   It is not a second production backend. Data stays fictional.
2. **Scope.** All ADR 0001 modules are designed and built as working, fictional-data screens,
   including Family Portal, School administration and Attendance with an optional face-match
   method. Two-way messaging and classroom audio stay out (no written requirement).
3. **Real AI.** The AI assistant can call the production **Demo Gateway** (short-lived,
   origin-bound session, quota-limited). When the gateway is not configured or not reachable, the
   app falls back to the **Mock provider**. The UI always names which one answered. Only fictional
   data is ever sent; national IDs never appear in prompts.
4. **Face check-in.** Optional method only, always beside a non-biometric alternative (staff tick,
   PIN or QR). The demo uses placeholders; it never captures, stores or matches a real face.
5. **Roles.** A clearly labelled demo role switcher (Teacher, Reviewer/Principal, School admin,
   Parent) shows each role's screens. It is not security; Studio Platform enforces access.
6. **Compliance copy.** Screens may say a feature "supports the licensee's obligations under …",
   never "compliant" or "certified".

## Portability contract

Studio Platform can adopt any layer independently, from the most portable to the least:

| Layer | Where | How to adopt |
|---|---|---|
| Design tokens | `design/tokens.json`, `src/styles/tokens.css` | Copy as is (framework-agnostic CSS variables) |
| Component CSS + HTML structure | `src/styles/`, component catalog | Copy classes and markup; every component's states are shown in the catalog |
| Domain rules | `src/framework`, `src/store/reducer.ts` rules (readiness, approval blocks, milestones from evidence) | Pure TypeScript, no React: port as is or re-implement against the documented rules |
| React components | `src/components` | Port directly if the platform uses React |
| Data access | a data port interface with a demo adapter | Implement the same interface over the platform API |
| Module specs | `docs/modules/*.md` | Acceptance criteria for the platform's own implementation |

## Production quality bar (definition of done for every module)

- WCAG 2.2 AA: automated axe scan with no serious/critical violations, plus a keyboard and
  screen-reader walkthrough.
- Component catalog entry for each new component, with every state, and visual regression shots.
- Performance budget (Lighthouse) and browser coverage: Chrome, Safari (WebKit), Firefox, plus
  iOS and Android on real devices before sign-off.
- A module spec in `docs/modules/` (users, flows, every state, permissions, compliance hooks,
  acceptance criteria) and en / 中文 / BM strings.
- Independent review (P0/P1 cleared) before merge; live smoke after deploy.

## Consequences

- ADR 0001's "out of scope" statuses for Studio Demo become "planned".
- Work is delivered in phases (see `docs/roadmap.md`); code is written by Codex/omp and verified
  by the manager before merge.
- Open items: the Demo Gateway URL and allowing the GitHub Pages origin on it; NEL mapping
  confirmation; native-speaker review of 中文 and BM; real-device testing.
