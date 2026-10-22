# Roadmap: production design reference

Goal: every module in ADR 0001 designed and built to the production quality bar in
[ADR 0002](adr/0002-production-design-reference.md), so Studio Platform can copy or port it.

Status values: **done**, **in progress**, **planned**.

## Phase 0: Foundation

| Item | Status |
|---|---|
| Learning Framework (single owner of areas, scale, periods; versioned) | done (v0.4.0) |
| Quality gates: axe WCAG 2.2 AA scan on every route, Firefox and WebKit runs | done (v0.5.0) |
| Component catalog route with every component state, plus visual regression | in progress (catalog done v0.5.0; visual regression planned) |
| Data port interface (demo adapter now; platform adapter later) | planned |
| Demo role switcher (Teacher, Reviewer/Principal, School admin, Parent) | planned |
| Module spec template and specs for existing modules | done |
| Lighthouse budget in CI | planned |

## Phase 1: Core portfolio loop (complete it)

| Module | Status |
|---|---|
| Evidence Coverage & Review Queue | planned |
| Report Release & History (frozen version, decision history, family export) + Audit Log | planned |
| Children & Classes (enrolment, guardians, authorised collectors) | planned |
| AI Provider: Demo Gateway adapter with Mock fallback and provider labelling | planned (needs gateway URL) |

## Phase 2: Daily operations

| Module | Status |
|---|---|
| Attendance (staff tick / PIN / QR; optional face-match placeholder; amendments with reason) | planned |
| Daily Health Check (configurable fever threshold, symptoms, return clearance) | planned |
| Pick-up & Release (authorised collector, identity check, wrong-release incident) | planned |

## Phase 3: Family

| Module | Status |
|---|---|
| Notices (acknowledgement; statutory notices from Incidents) | planned |
| Family Portal (released reports, notices, consents, morning declaration) | planned |

## Phase 4: Administration and compliance

| Module | Status |
|---|---|
| Schools & Accounts | planned |
| Privacy Centre (consents, data requests, breach log, AI transfer register) | planned |
| Records Retention | planned |
| Incidents & Notifiable Events | planned |
| Principal Reports | planned |

## Phase 5: Handoff

- Porting guide for Studio Platform (layer by layer, see the ADR 0002 portability contract).
- Real-device sign-off (iOS, Android) and native-speaker review (中文, BM).
