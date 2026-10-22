# Module: Portfolio Studio

- Tier: Core
- Owns: Draft paragraphs, sentences, observation source links, teacher reflection and draft readiness
- Reads: Student (Children & Classes; static fictional records), observations (Observations), learning areas/milestones/periods (Learning Framework), report status/comments (Report Review & Release), Mock provider suggestions (AI Provider Gateway)
- Status: exists

## Purpose

Combines a student's observations, evidence-linked narrative, teacher reflection and a local Mock AI suggestion workflow to prepare a report draft. AI output is a proposal that the user applies or rejects; this module does not provide live AI, frozen report history or released family reports.

## Users and permissions

| Role | Can see | Can do |
|---|---|---|
| Teacher | Evidence, narrative, Mock assistant and report readiness; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today the single demo user can create drafts, edit/link narrative, set reflection, apply/reject/regenerate proposals and submit a ready draft for review. |
| Reviewer / Principal | Portfolio draft in review; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no role-specific permission, though a demo user may view and link evidence during review. |
| School admin | Portfolio screens; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no separate admin permission. |
| Parent | Released narrative in future family experience; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no parent account or released family view. |

Access is enforced by Studio Platform; the demo shows it with the role switcher. The role switcher is planned (roadmap Phase 0); today the demo has one user and no real roles.

## Flows

1. Open Studio from a student's profile; inspect evidence and use filters/search to select an observation.
2. Start a draft from observations when status is not started, or fill missing domains from available evidence; edit sentences, link sources and write reflection.
3. Request a Mock suggestion, inspect its diff, then Apply, Reject or Regenerate; Undo restores the prior paragraph after applying.
4. Resolve missing domains/reflection and submit a structurally ready draft to review; preview the report separately.

## Screens and states

- Studio desktop: Evidence, Narrative and AI panels in three columns; focus mode starts the shell panel closed (`src/pages/PortfolioStudio.tsx:232-283`; `src/components/AppShell.tsx:357-358,385-393,472-473`). Evidence has no-observations empty state, text search/filter no-match state, selected and linked evidence states (`src/components/studio/EvidencePanel.tsx:27-32,45-84`).
- Narrative: no-observation, not-started-with-observations (Start draft), and empty narrative states (`src/pages/PortfolioStudio.tsx:155-179`); existing paragraph, missing-domain, unverified-claim, linked-source and reflection states (`src/components/studio/NarrativePanel.tsx:10-30,32-120`).
- AI assistant states are idle, loading, ready, applied, rejected, no suggestion, and unavailable (`src/components/studio/AiPanel.tsx:10-17`). Mock provider label is shown; `aiDown` simulates provider unavailable (`src/pages/PortfolioStudio.tsx:54-70,200-214`).
- Reflection autosave shows save status and retry; simulated save failure is configurable in demo settings (`src/pages/PortfolioStudio.tsx:48-52,259-263,317-320`; `src/pages/Settings.tsx:258-290`). No server save exists.
- Draft blocked/not-ready notice includes readiness list; status notices cover approved locked, review locked and reviewer-requested changes (`src/pages/PortfolioStudio.tsx:135-149,216-230`). Approved content is locked; wording is locked while in review, but evidence linking stays open in review (`src/store/reducer.ts:71-75,114-121`; `src/pages/PortfolioStudio.tsx:105-107,188-190`).
- Tablet has a docked narrative view and optional Evidence/AI drawer; mobile uses Evidence/Write/AI tabs and action bar (`src/pages/PortfolioStudio.tsx:286-330`). Shared shell handles bottom tabs at widths up to 1024 (`src/components/AppShell.tsx:368-470`).

## Rules

- `reducer` `startDraft` permits only known `notStarted` students with no existing paragraphs and creates a draft only when observations yield paragraphs (`src/store/reducer.ts:106-113`).
- `draftFromObservations` builds deterministic, cited template sentences from observations; this is not AI (`src/data/demo.ts:213-226`).
- `reducer` `fillMissingDomains` works only in draft/changes status, preserves written domains, fills only absent domains from observations and uses framework order (`src/store/reducer.ts:92-105`).
- `unverifiedClaims` marks each sentence with no source IDs (`src/store/reducer.ts:175-183`). `readiness` requires every framework domain to contain a sentence and a nonblank reflection to submit; all claims must also be cited to approve (`src/store/reducer.ts:185-209`).
- `ownsObservation` and `reducer` `linkSource` require evidence to belong to the same student and do not duplicate source IDs; approved reports reject linking (`src/store/reducer.ts:71-73,114-118`).
- `reducer` content actions reject edits to approved reports; sentence deletion, suggestion application, paragraph restore and reflection edits are also rejected during review (`src/store/reducer.ts:72-75,119-142`). Suggestions must target an existing paragraph and every cited source must belong to that student (`src/store/reducer.ts:122-133`).
- `applySuggestion` only dispatches the proposed suggestion; reducer validates and replaces that paragraph, while Undo dispatches the saved previous paragraph (`src/pages/PortfolioStudio.tsx:124-133`; `src/store/reducer.ts:122-139`).
- `requestSuggestion` uses the local Mock provider; no live AI or child data transfer occurs (`src/pages/PortfolioStudio.tsx:54-70`; `README.md:13-15`).

## Compliance hooks

Source links and teacher review support the licensee's obligations under PDPA (Singapore) and ECDA by tying narrative claims to fictional child evidence. Real role enforcement, consent, retention, deletion, audit events and live AI transfer controls are not implemented. Not in Studio Demo yet — planned (roadmap Phase 0 role switcher/data port; Phase 4 Privacy Centre and Records Retention; Phase 1 audit events and AI Gateway work).

## Data port

Reads:
- `getStudentSummary(state: State, id: string): StudentSummary | undefined` (`src/store/selectors.ts:15-27`)
- `getObservations(state: State, studentId: string, term?: 3 | 4): Observation[]` (`src/store/reducer.ts:243-245`)
- `getReadiness(state: State, studentId: string): Readiness` (`src/store/reducer.ts:185-209`)
- `getUnverifiedClaims(state: State, studentId: string): UnverifiedClaim[]` (`src/store/reducer.ts:175-183`)

Writes (dispatch actions):
- `startDraft({ studentId: string }): void`
- `fillMissingDomains({ studentId: string }): void`
- `linkSource({ studentId: string; sentenceId: string; obsId: string }): void`
- `removeSentence({ studentId: string; sentenceId: string }): void`
- `applySuggestion({ studentId: string; suggestion: Suggestion }): void`
- `restoreParagraph({ studentId: string; paragraph: Paragraph }): void`
- `setReflection({ studentId: string; text: string }): void`
- `submitForReview({ studentId: string }): void`

These action payloads are declared in `src/store/reducer.ts:26-39`; `Paragraph` and `Sentence` are in `src/data/demo.ts:33-43`.

## Acceptance criteria

- [ ] Every flow works in en, 中文 and BM, light and dark, desktop and mobile.
- [ ] axe: no serious or critical violations on every screen and state.
- [ ] Keyboard-only and screen-reader walkthrough recorded.
- [ ] Catalog entries and visual regression shots for new components.
- [ ] Unit tests for every rule; e2e for every flow; live smoke updated.
- [ ] Independent review passed (no open P0/P1).
