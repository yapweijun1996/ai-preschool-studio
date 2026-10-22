import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { Menu } from '../components/Menu';
import { ReadinessList, ReportFlow } from '../components/ReportFlow';
import designTokens from '../../design/tokens.json';
import {
  Avatar,
  MilestoneDots,
  MockProviderLabel,
  Notice,
  SaveIndicator,
  ScrollRow,
  SourceChip,
  StatusLabel,
  VerifyLabel,
} from '../components/ui';
import type { ReportStatus } from '../data/demo';
import { DOMAINS, type Milestone } from '../framework';
import type { Readiness } from '../store/reducer';
import { MarkupExample } from './MarkupExample';

const sections = [
  'Tokens',
  'Buttons',
  'Status labels',
  'SourceChip',
  'MilestoneDots',
  'Avatar',
  'SaveIndicator',
  'Notice',
  'Chips',
  'Tabs',
  'Form fields',
  'ReportFlow',
  'ReadinessList',
  'Menu',
  'ScrollRow',
  'Cards',
  'Empty state',
  'Skeleton',
];
const names = designTokens.color.tokens.map(({ name }) => `--${name}`);
const tokenValue = (value: string | Record<string, string>, theme: string) => typeof value === 'string' ? value : value[theme] ?? value.light;
const statuses: ReportStatus[] = ['notStarted', 'draft', 'review', 'changes', 'approved'];
const readinessExamples: { title: string; readiness: Readiness }[] = [
  {
    title: 'Complete',
    readiness: {
      domainsWritten: DOMAINS.length,
      domainsTotal: DOMAINS.length,
      sentences: 5,
      unverified: 0,
      hasReflection: true,
      canSubmit: true,
      canApprove: true,
    },
  },
  {
    title: 'Incomplete',
    readiness: {
      domainsWritten: 1,
      domainsTotal: DOMAINS.length,
      sentences: 2,
      unverified: 1,
      hasReflection: false,
      canSubmit: false,
      canApprove: false,
    },
  },
  {
    title: 'No sentences',
    readiness: {
      domainsWritten: 0,
      domainsTotal: DOMAINS.length,
      sentences: 0,
      unverified: 0,
      hasReflection: true,
      canSubmit: false,
      canApprove: false,
    },
  },
];
const saveStatuses = [
  { kind: 'idle' },
  { kind: 'saved', at: '10:42 AM' },
  { kind: 'unsaved' },
  { kind: 'saving' },
  { kind: 'failed' },
] as const;

function sectionId(name: string) {
  return name.toLowerCase().replaceAll(' ', '-');
}

function Tokens({ theme }: { theme: string }) {
  const tokenNames = [
    ...designTokens.spacing.tokens.filter(({ name }) => name.startsWith('space-')).map(({ name }) => `--${name}`),
    ...designTokens.radius.tokens.map(({ name }) => `--${name}`),
    ...designTokens.shadow.tokens.map(({ name }) => `--${name}`),
  ];
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    setValues(Object.fromEntries([...names, ...tokenNames].map((name) => [name, style.getPropertyValue(name).trim()])));
  }, [theme]);

  return (
    <div className="catalog-token-grid">
      {names.map((name) => (
        <div className="catalog-token" key={name}>
          <span className="catalog-swatch" style={{ background: `var(${name})` }} />
          <strong>{name}</strong>
          <span>Current: {values[name] || '—'}</span>
        </div>
      ))}
      <div className="catalog-token">
        <strong>Type scale</strong>
        {designTokens.type.groups.flatMap(({ name: group, styles }) => styles.map((style) => (
          <span key={style.name} style={{ fontSize: style.fontSize, lineHeight: style.lineHeight, fontWeight: style.fontWeight }}>
            {group} · {style.name}: {style.fontSize} / {style.lineHeight}
          </span>
        )))}
      </div>
      <div className="catalog-token">
        <strong>Spacing</strong>
        {designTokens.spacing.tokens.filter(({ name }) => name.startsWith('space-')).map(({ name, value }) => (
          <span key={name}>--{name}: {value} (computed: {values[`--${name}`] || '—'})</span>
        ))}
      </div>
      <div className="catalog-token">
        <strong>Radii</strong>
        {designTokens.radius.tokens.map(({ name, value }) => (
          <span key={name}>--{name}: {value} (computed: {values[`--${name}`] || '—'})</span>
        ))}
      </div>
      <div className="catalog-token">
        <strong>Shadows</strong>
        {designTokens.shadow.tokens.map(({ name, value }) => (
          <span key={name} style={{ boxShadow: `var(--${name})`, padding: 'var(--space-3)' }}>
            --{name}: {tokenValue(value, theme)} (computed: {values[`--${name}`] || '—'})
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionExamples({ name, theme }: { name: string; theme: string }) {
  switch (name) {
    case 'Tokens':
      return <Tokens theme={theme} />;
    case 'Buttons':
      return (
        <MarkupExample title="Button variants and states">
          <div className="row catalog-wrap">
            <button className="btn btn-primary">Primary</button>
            <button className="btn btn-secondary">Secondary</button>
            <button className="btn btn-ghost">Ghost</button>
            <button className="icon-btn" aria-label="Search"><Icon name="search" /></button>
            <button className="icon-btn icon-btn-outline" aria-label="Settings"><Icon name="settings" /></button>
            <button className="btn btn-primary" aria-disabled="true">Unavailable</button>
            <button className="btn btn-primary catalog-focus">Focus visible</button>
          </div>
          <p className="muted">Hover each enabled button; focus-visible example is keyboard reachable.</p>
        </MarkupExample>
      );
    case 'Status labels':
      return (
        <MarkupExample title="Statuses and labels">
          <div className="row catalog-wrap">
            {statuses.map((status) => <StatusLabel key={status} status={status} />)}
            <VerifyLabel />
            <MockProviderLabel />
          </div>
        </MarkupExample>
      );
    case 'SourceChip':
      return <MarkupExample title="SourceChip"><SourceChip id="OBS-0151" /></MarkupExample>;
    case 'MilestoneDots':
      return (
        <MarkupExample title="All levels and no observation">
          <div className="stack">
            {(['emerging', 'developing', 'consistent', null] as (Milestone | null)[]).map((milestone) => (
              <MilestoneDots key={milestone ?? 'none'} milestone={milestone} />
            ))}
          </div>
        </MarkupExample>
      );
    case 'Avatar':
      return (
        <MarkupExample title="Avatar sizes">
          <div className="row catalog-wrap">
            {(['sm', undefined, 'md', 'lg'] as const).map((size, index) => (
              <Avatar key={index} initials="AT" size={size} label="Aria Tan" />
            ))}
          </div>
        </MarkupExample>
      );
    case 'SaveIndicator':
      return (
        <MarkupExample title="Save states">
          <div className="stack">
            {saveStatuses.map((status, index) => (
              <div key={index} className="row">
                <span className="muted">{status.kind}</span>
                <SaveIndicator status={status} onRetry={() => {}} />
              </div>
            ))}
          </div>
        </MarkupExample>
      );
    case 'Notice':
      return (
        <MarkupExample title="Notice tones">
          <div className="stack">
            {(['info', 'success', 'warning', 'danger'] as const).map((tone) => (
              <Notice
                key={tone}
                tone={tone}
                icon={
                  tone === 'info' ? 'info' : tone === 'success' ? 'check' : tone === 'warning' ? 'alert' : 'alertCircle'
                }
              >
                <p className="body-text">{tone[0].toUpperCase() + tone.slice(1)} notice message.</p>
              </Notice>
            ))}
          </div>
        </MarkupExample>
      );
    case 'Chips':
      return (
        <MarkupExample title="Pressed and unpressed chips">
          <div className="chip-row">
            <button className="chip" aria-pressed="false">Emerging</button>
            <button className="chip" aria-pressed="true">Developing</button>
          </div>
        </MarkupExample>
      );
    case 'Tabs':
      return (
        <MarkupExample title="Tabs">
          <div className="tabs">
            <a
              className="tab"
              href="#/catalog"
              onClick={(event) => event.preventDefault()}
              aria-current="page"
            >
              Overview
            </a>
            <a className="tab" href="#/catalog" onClick={(event) => event.preventDefault()}>Evidence</a>
            <a className="tab" href="#/catalog" onClick={(event) => event.preventDefault()}>Reports</a>
          </div>
        </MarkupExample>
      );
    case 'Form fields':
      return (
        <MarkupExample title="Text, textarea and date fields">
          <div className="stack">
            <label className="field">
              <span className="field-label">Learner</span>
              <input className="input" defaultValue="Aria Tan" />
            </label>
            <div className="field">
              <label className="field-label" htmlFor="catalog-observation">Teacher observation</label>
              <textarea
                id="catalog-observation"
                className="input"
                aria-invalid="true"
                aria-describedby="catalog-error"
                defaultValue="Took turns at the block corner and handed a peer the last arch block without being asked."
              />
              <p id="catalog-error" className="sec catalog-field-error">
                Please add an observation date.
              </p>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="catalog-date">Observation date</label>
              <div className="input date-field">
                <span className="num grow" aria-hidden="true">20 Oct 2026</span>
                <Icon name="calendar" size={18} />
                <input
                  id="catalog-date"
                  className="date-native"
                  type="date"
                  defaultValue="2026-10-20"
                  aria-label="Observation date"
                />
              </div>
            </div>
          </div>
        </MarkupExample>
      );
    case 'ReportFlow':
      return (
        <>
          {statuses.map((status) => (
            <MarkupExample key={status} title={`${status}: compact and full`}>
              <div className="catalog-flow">
                <ReportFlow status={status} hadChanges />
                <ReportFlow status={status} hadChanges compact />
              </div>
            </MarkupExample>
          ))}
        </>
      );
    case 'ReadinessList':
      return (
        <>
          {readinessExamples.map(({ title, readiness }) => (
            <MarkupExample key={title} title={title}>
              <ReadinessList r={readiness} />
            </MarkupExample>
          ))}
        </>
      );
    case 'Menu':
      return (
        <MarkupExample title="Open the trigger to inspect the menu">
          <Menu
            label="Example actions"
            trigger={({ onClick, expanded, ref }) => (
              <button
                ref={ref}
                className="btn btn-secondary"
                onClick={onClick}
                aria-expanded={expanded}
              >
                Actions
              </button>
            )}
          >
            {(close) => (
              <>
                <button className="menu-item" role="menuitem" onClick={close}>Edit item</button>
                <button className="menu-item" role="menuitem" onClick={close}>Duplicate item</button>
              </>
            )}
          </Menu>
        </MarkupExample>
      );
    case 'ScrollRow':
      return (
        <MarkupExample title="Horizontally overflowing row">
          <ScrollRow className="chip-row scroll catalog-scroll">
            {['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5'].map((item) => (
              <span className="chip" key={item}>{item}</span>
            ))}
          </ScrollRow>
        </MarkupExample>
      );
    case 'Cards':
      return (
        <MarkupExample title="Card, padded card and stretched link">
          <div className="catalog-card-grid">
            <div className="card"><p>Plain card</p></div>
            <div className="card card-pad">
              <strong>Padded card</strong>
              <p className="muted">Content spacing uses shared tokens.</p>
            </div>
            <div className="card card-pad card-link">
              <a href="#/catalog" onClick={(event) => event.preventDefault()} className="stretched">Open portfolio</a>
              <p>Card link with a stretched link.</p>
            </div>
          </div>
        </MarkupExample>
      );
    case 'Empty state':
      return (
        <MarkupExample title="Empty state">
          <div className="empty">
            <span className="state-icon"><Icon name="search" /></span>
            <strong>No observations yet</strong>
            <p className="muted">Add an observation to see it here.</p>
          </div>
        </MarkupExample>
      );
    case 'Skeleton':
      return (
        <MarkupExample title="Skeleton placeholder">
          <div className="stack">
            <div className="skel" style={{ height: 20, width: '55%' }} />
            <div className="skel" style={{ height: 14, width: '90%' }} />
            <div className="skel" style={{ height: 14, width: '72%' }} />
          </div>
        </MarkupExample>
      );
    default:
      return null;
  }
}

export function CatalogContent({ theme, showHeading }: { theme: string; showHeading: boolean }) {
  return (
    <div className="page catalog-page">
      {showHeading && (
        <header className="catalog-title">
          <p className="cap muted">Design reference</p>
          <h1>Component catalog</h1>
          <p>Rendered shared UI examples and copyable markup. Theme and language follow the app.</p>
        </header>
      )}
      <nav className="catalog-toc" aria-label="Catalog sections">
        <strong>On this page</strong>
        {sections.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              const heading = document.getElementById(sectionId(name))?.querySelector('h2');
              heading?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              heading?.focus({ preventScroll: true });
            }}
          >
            {name}
          </button>
        ))}
      </nav>
      {sections.map((name) => (
        <section id={sectionId(name)} className="catalog-section" key={name}>
          <h2 tabIndex={-1}>{name}</h2>
          <SectionExamples name={name} theme={theme} />
        </section>
      ))}
    </div>
  );
}
