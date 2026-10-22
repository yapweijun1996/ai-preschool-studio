# Module: Demo roles

- Tier: Platform
- Owns: Demo role names, capabilities and role-to-capability mapping
- Reads: Fictional account names from `src/data/demo.ts`; labels from the shell locale dictionaries
- Status: done (v0.6.0)

## Purpose

Let a person preview the existing demo as a teacher, reviewer/principal, school admin or parent. The
switcher demonstrates role-specific screens and UI capabilities; it is not authentication or an
access-control boundary. Studio Platform enforces real access.

## Users and permissions

| Role | Can see | Can do |
|---|---|---|
| Teacher | Dashboard, portfolio screens, student list, observations, reports and personal Settings | Add observations, edit and submit drafts, view reports, and use demo controls; review actions are explained and can be reached by switching role. |
| Reviewer / Principal | Dashboard, students, reports, read-only Studio and personal Settings | Request changes, approve unblocked reports and link evidence while a report is in review. |
| School admin | Dashboard, read-only Students, coverage and review queue metadata (child, submission date, waiting days, readiness and claim count), Settings and an admin planned page | Use demo controls; planned administration modules are listed with roadmap phases. Cannot view report narratives or open reports. |
| Parent | Dashboard, personal Settings and parent planned page; student navigation is hidden | See planned Family Portal and Notices modules with roadmap phases; switch back to Teacher. |

Capabilities are assigned in the complete matrix below. Every role can view personal Settings (`settings.view`) and the dashboard (`dashboard.view`). Demo simulation controls, including the Demo data Settings section and Demo menu items, require `demo.controls` (Teacher and School admin only).

| Capability | Teacher | Reviewer | School admin | Parent |
|---|---:|---:|---:|---:|
| `dashboard.view` | ✓ | ✓ | ✓ | ✓ |
| `students.view` | ✓ | ✓ | ✓ | — |
| `observation.add` | ✓ | — | — | — |
| `draft.edit` | ✓ | — | — | — |
| `report.submit` | ✓ | — | — | — |
| `report.review` | — | ✓ | — | — |
| `report.view` | ✓ | ✓ | — | — |
| `settings.view` | ✓ | ✓ | ✓ | ✓ |
| `demo.controls` | ✓ | — | ✓ | — |
| `catalog.view` | ✓ | ✓ | ✓ | — |
| `coverage.view` | ✓ | ✓ | ✓ | — |
| `reviews.view` | — | ✓ | ✓ | — |
| `reviews.changes` | ✓ | — | — | — |

The capability union and complete role matrix have one owner in [`src/roles/index.ts`](../../src/roles/index.ts).
The React provider in `src/roles/RoleContext.tsx` stores the selected role in tab-scoped
`sessionStorage` under `aps-demo-role`, defaults to Teacher and ignores invalid values. Role state is
not part of portfolio state or the data port.

## Flows

1. Open Account on desktop or More on mobile/tablet and choose a role from the accessible radio items.
2. The account name, avatar initials, navigation and role-specific screens update; the role chip stays
   visible in the demo banner and announces changes through a polite live region.
3. Switch back to Teacher from a planned admin or parent landing page.

## Screens and states

The switcher is available in desktop Account and mobile/tablet More. Parent and admin landing pages
show their purpose and planned modules with phase numbers. Read-only Studio and blocked draft actions
explain the restriction and offer a switch to the teacher where appropriate.
Teacher review actions are replaced by a reason and a switch-to-reviewer action. All UI restrictions
are demo affordances, not security controls.

## Rules

- `can(role, capability)` reads the single `ROLE_CAPABILITIES` table.
- `isRole` accepts only the four closed role values; invalid saved values use Teacher.
- Portfolio state and data-port contracts do not store the active role.

## Compliance hooks

The demo role label explicitly says it is not access control. Studio Platform must enforce roles,
authentication and authorization. Fictional data is used in this repository.

## Data port

None. Role state is local UI state and is intentionally outside PortfolioContext and the data port.

## Acceptance criteria

- [x] All four roles can be switched in en, 中文 and BM; desktop and mobile menus are keyboard accessible.
- [x] Role capability matrix has unit coverage and role-specific flows have browser coverage.
- [x] Parent/admin planned pages are included in axe route coverage.
- [ ] Production identity and authorization are enforced by Studio Platform.
