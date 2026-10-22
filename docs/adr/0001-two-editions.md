# ADR 0001: Two editions — Studio Demo and Studio Platform

- Status: **Proposed** (owner sign-off pending)
- Date: 2026-10-22
- Deciders: product owner
- Applies to: this repository (Studio Demo) and the separate production product (Studio Platform)

## Context

The name "AI Preschool Studio" is used for two things with contradicting scopes:

- **This repository** is a clickable, teacher-first prototype. Its brief says: fictional data only,
  a clearly labelled Mock provider (no live AI), and **no parent portal, no face recognition, no
  admin-heavy screens**.
- **A separate production product** is being built for real schools. It adds multi-school tenancy,
  accounts, a parent portal, arrival check-in (with an optional face-match adapter), daily health
  checks, pick-up release and other school operations.

Because both are called the same thing, it was unclear whether a module is *missing* or *out of
scope*, and a module map review (SCMC: Simple, Clear, Modular, Consistent) failed on **Clear** for
this reason alone.

## Decision

Name two editions and give every module one status per edition.

| Edition | Purpose | Users | Data | AI |
|---|---|---|---|---|
| **Studio Demo** (this repo) | Show the teacher portfolio loop end to end: evidence → progress → narrative → review → release | Teacher, reviewer (simulated) | Fictional only, in the browser | Mock provider only |
| **Studio Platform** (separate) | Run a school: portfolio loop plus operations, communication and administration | Teacher, reviewer/principal, school admin, parent | Real school data under PDPA/ECDA controls | Configurable providers with a transfer register |

Rules:

1. Studio Demo keeps its brief. Operations, Communication and Administration modules are
   **out of scope by brief** here, not "missing". Adding one is a scope change that needs a new ADR.
2. Shared concepts keep one definition in both editions: learning areas and milestone scale
   (Learning Framework), the report lifecycle (Draft → In review → Changes requested → Approved,
   "blocked with a reason"), role names, and the rule that every narrative claim cites an
   observation of that child.
3. Studio Demo never claims compliance. Copy says "supports the licensee's obligations under …",
   never "compliant" or "certified".
4. Each repository's README states its edition in one line.

## Module status by edition

Status: **exists**, **partial**, **missing**, **out of scope** (by brief), **planned**.

| Tier | Module | Owns | Studio Demo | Studio Platform |
|---|---|---|---|---|
| Core | Children & Classes | Child, Class, Enrolment, Guardian | partial (fictional class of 20) | in progress |
| Core | Observations (Evidence) | Observation, media reference | exists | in progress |
| Core | **Learning Framework** | Learning areas, milestone scale, reporting periods | **next** (hard-coded today) | to align |
| Core | Learning Progress | derived view | exists | in progress |
| Core | Portfolio Studio | Draft, paragraph, sentence, source link, reflection | exists | in progress |
| Core | Report Review & Release | Report version, review decision, comment | partial (no frozen version or history) | in progress |
| Core | Evidence Coverage & Review Queue | derived view | partial | to decide |
| Operations | Attendance (+ optional face-match adapter) | Attendance record, amendment | out of scope | planned |
| Operations | Daily Health Check | Health check, return clearance | out of scope | planned |
| Operations | Pick-up & Release | Release record | out of scope | planned |
| Communication | Notices | Notice, acknowledgement | out of scope | planned |
| Communication | Family Portal | Guardian account | out of scope | in progress |
| Communication | Two-way messaging | — | out of scope | not planned (no requirement) |
| Administration | Schools & Accounts | School, user, role, invitation | out of scope | in progress |
| Administration | Privacy Centre, Retention, Incidents | Consent, data request, breach, retention rule, incident | out of scope | planned |
| Administration | Principal Reports | derived view | out of scope | planned |
| Platform | Audit Log | Audit event | missing (needed by Report Release) | in progress |
| Platform | AI Provider Gateway | Provider config, prompt policy | exists (Mock only) | in progress |
| Platform | i18n, App Shell & PWA, Print & Export, Settings | — | exists | in progress |

Single-owner rules (both editions): arrival/departure time is owned by Attendance only; learning
vocabulary by Learning Framework only; retention periods by Retention only; consent by the Privacy
Centre only. Other modules reference, never redefine.

## Consequences

- Studio Demo's next modules stay inside its brief: **Learning Framework**, **Evidence Coverage &
  Review Queue**, **Report Release & History** (with a minimal audit trail).
- Learning areas get stable keys mapped to the Nurturing Early Learners (NEL) framework, so both
  editions can align later without renaming stored data.
- Reviews and coding agents can tell "out of scope" from "missing" by reading this table.

## Open questions for the owner

1. Accept the two edition names?
2. Learning areas: keep the demo's four areas as a configured subset mapped to NEL, or adopt all
   NEL learning areas in the demo?
3. Reporting cadence: per term or per semester?
4. Role names: are "principal" and "manager" the same capability as "reviewer"?
