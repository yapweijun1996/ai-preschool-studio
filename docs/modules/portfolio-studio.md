# Module: Portfolio Studio

- Tier: Core
- Owns: Draft paragraphs, observation source links, teacher reflection and draft readiness
- Reads: Student (Children & Classes; static fictional records), observations (Observations), learning areas/milestones/periods (Learning Framework), report status/comments (Report Review & Release), Mock provider suggestions (AI Provider Gateway)
- Status: done (v0.4.0)

## Purpose

Combines a student's observations, evidence-linked narrative, teacher reflection and a local Mock AI suggestion workflow to prepare a report draft. AI output is a proposal that the user applies or rejects; this module does not provide live AI, frozen report history or released family reports.

## Users and permissions

| Role | Can see | Can do |
|---|---|---|
| Teacher | Evidence, narrative, Mock assistant and report readiness; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today the single demo user can create drafts, remove an uncited claim, link a source, replace a paragraph by applying an AI suggestion, set free-text reflection and submit a ready draft for review. |
| Reviewer / Principal | Portfolio draft in review; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no role-specific permission, though a demo user may view and link evidence during review. |
| School admin | Portfolio screens; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no separate admin permission. |
| Parent | Released narrative in future family experience; planned (role switcher, Phase 0) | Planned role switcher (Phase 0); today no parent account or released family view. |

Access is enforced by Studio Platform; the demo shows it with the role switcher. The role switcher is planned (roadmap Phase 0); today the demo has one user and no real roles.

## Flows

1. Open Studio from a student's profile; inspect evidence and use filters/search to select an observation. Selection only highlights it; linking is done from an uncited claim's buttons, which offer the first two Term 4 observations of the same domain (`src/components/studio/EvidencePanel.tsx:67-80`; `src/components/studio/NarrativePanel.tsx:77-92`).
2. Start a draft from observations when status is not started, or fill missing domains from available evidence; remove an uncited claim, link a source, or replace a paragraph by applying an AI suggestion; reflection is free text.
3. Studio requests a “clearer” suggestion automatically on open; inspect its diff, then Apply, Reject or Regenerate; Undo restores the prior paragraph after applying. For a ready suggestion, Apply/Reject/Regenerate controls are hidden while locked; a rejected suggestion's Regenerate control remains visible (`src/components/studio/AiPanel.tsx:119-146`).
4. Resolve missing domains/reflection and submit a structurally ready draft to review; submission opens the report preview directly.

## Screens and states

- Studio desktop: Evidence, Narrative and AI panels in three columns; focus mode starts the shell panel closed (`src/pages/PortfolioStudio.tsx:232-283`; `src/components/AppShell.tsx:357-358,385-393,472-473`). Evidence has no-observations empty state, text search/filter no-match state, selected and linked evidence states (`src/components/studio/EvidencePanel.tsx:27-32,45-84`).
- Studio reads `state.paragraphs[id]` and `state.reflections[id]` directly (`src/pages/PortfolioStudio.tsx:33,48`).
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

Proposed async interfaces:
- `getStudentSummary(studentId: string): Promise<StudentSummary | undefined>` (proposed; demo implementation: `studentSummary` `src/store/selectors.ts:15-27`)
- `getObservations(studentId: string, term?: 3 | 4): Promise<Observation[]>` (proposed; demo implementation: `observationsFor` `src/store/reducer.ts:243-245`)
- `getReadiness(studentId: string): Promise<Readiness>` (proposed; demo implementation: `readiness` `src/store/reducer.ts:185-209`)
- `getUnverifiedClaims(studentId: string): Promise<UnverifiedClaim[]>` (proposed; demo implementation: `unverifiedClaims` `src/store/reducer.ts:175-183`)
- `getDraft(studentId: string): Promise<{ paragraphs: Paragraph[]; reflection: string }>` (proposed; demo implementation: direct reads of `state.paragraphs[id]` and `state.reflections[id]` `src/pages/PortfolioStudio.tsx:33,48`)
- `getMilestones(studentId: string, term: 3 | 4): Promise<Record<DomainKey, Milestone | null>>` (proposed; demo implementation: `milestonesFor` `src/store/selectors.ts:33-38`)
- `getFramework(version?: string): Promise<Framework>` (proposed; demo implementation: `frameworkFor` `src/framework/index.ts:82-86`)

Writes (proposed async; demo dispatches corresponding action):
- `startDraft(studentId: string): Promise<void>` (demo: dispatch `{type:'startDraft', ...}`)
- `fillMissingDomains(studentId: string): Promise<void>` (demo: dispatch `{type:'fillMissingDomains', ...}`)
- `linkSource(studentId: string, sentenceId: string, obsId: string): Promise<void>` (demo: dispatch `{type:'linkSource', ...}`)
- `removeSentence(studentId: string, sentenceId: string): Promise<void>` (demo: dispatch `{type:'removeSentence', ...}`)
- `applySuggestion(studentId: string, suggestion: Suggestion): Promise<void>` (demo: dispatch `{type:'applySuggestion', ...}`)
- `restoreParagraph(studentId: string, paragraph: Paragraph): Promise<void>` (demo: dispatch `{type:'restoreParagraph', ...}`)
- `setReflection(studentId: string, text: string): Promise<void>` (demo: dispatch `{type:'setReflection', ...}`)
- `submitForReview(studentId: string): Promise<void>` (demo: dispatch `{type:'submitForReview', ...})

## Acceptance criteria

- [ ] Every flow works in en, 中文 and BM, light and dark, desktop and mobile.
- [ ] axe: no serious or critical violations on every screen and state.
- [ ] Keyboard-only and screen-reader walkthrough recorded.
- [ ] Catalog entries and visual regression shots for new components.
- [ ] Unit tests for every rule; e2e for every flow; live smoke updated.
- [ ] Independent review passed (no open P0/P1).
