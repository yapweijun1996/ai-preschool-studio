import { useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell, ThemeContext, useShellPanel } from '../components/AppShell';
import { Icon, type IconName } from '../components/Icon';
import { SETTINGS_SECTIONS, type SettingsSection } from '../components/ModulePanel';
import { MilestoneDots, MockProviderLabel, Notice } from '../components/ui';
import { CURRENT_FRAMEWORK } from '../framework';
import { useLabels } from '../i18n/labels';
import type { Breakpoint } from '../hooks/useBreakpoint';
import type { ThemePref } from '../hooks/useTheme';
import { LANGS, useI18n, type TKey } from '../i18n';
import { APP_VERSION, BUILD_ID, usePwa, type PwaApi, type UnsupportedReason, type UpdateStatus } from '../pwa';
import { usePortfolio } from '../store/PortfolioContext';
import { useRole } from '../roles/RoleContext';
import { demoRole } from '../roles';
import { NotFound } from './NotFound';
import { now } from '../utils/clock';

const isSection = (s: string | undefined): s is SettingsSection => SETTINGS_SECTIONS.some((x) => x.key === s);

/** Radio row: the transparent native input covers the whole 44px+ row, so it is the hit area. */
function Choice({ name, checked, onChange, icon, lang, children }: { name: string; checked: boolean; onChange: () => void; icon?: IconName; lang?: string; children: ReactNode }) {
  return (
    <label className="choice">
      <input className="cover-input" type="radio" name={name} checked={checked} onChange={onChange} />
      <span className="radio-mark" aria-hidden="true" />
      {icon && <Icon name={icon} size={18} />}
      <span className="grow" lang={lang}>{children}</span>
    </label>
  );
}

function ToggleRow({ checked, onChange, label, hint, variant }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; variant: 'switch' | 'checkbox' }) {
  const id = useId();
  return (
    <label className="toggle-row">
      <input
        className="cover-input"
        type="checkbox"
        role={variant === 'switch' ? 'switch' : undefined}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-labelledby={`${id}-l`}
        aria-describedby={hint ? `${id}-h` : undefined}
      />
      <span className={variant === 'switch' ? 'switch' : 'check-mark'} aria-hidden="true">
        {variant === 'checkbox' && <Icon name="check" size={16} />}
      </span>
      <span className="grow toggle-text">
        <span id={`${id}-l`} className="toggle-label">{label}</span>
        {hint && <span id={`${id}-h`} className="sec muted">{hint}</span>}
      </span>
    </label>
  );
}

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  const id = useId();
  return (
    <section className="card card-pad stack settings-card" aria-labelledby={id}>
      <div className="row">
        <h2 id={id} className="h2 grow">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

const THEMES: { key: ThemePref; icon: IconName }[] = [
  { key: 'light', icon: 'sun' },
  { key: 'dark', icon: 'moon' },
  { key: 'system', icon: 'monitor' }
];

function Appearance() {
  const { t } = useI18n();
  const { pref, setPref } = useContext(ThemeContext);
  const { panelOpen, setPanelOpen } = useShellPanel();
  const hint = useId();
  return (
    <>
      <Section title={t('shell.settings.appearance.themeLegend')}>
        <fieldset className="stack" aria-describedby={hint}>
          <legend className="sr-only">{t('shell.settings.appearance.themeLegend')}</legend>
          <p id={hint} className="sec muted">{t('shell.settings.appearance.themeHint')}</p>
          <div className="choice-list">
            {THEMES.map((o) => (
              <Choice key={o.key} name="theme" icon={o.icon} checked={pref === o.key} onChange={() => setPref(o.key)}>
                {t(`shell.settings.appearance.${o.key}`)}
              </Choice>
            ))}
          </div>
        </fieldset>
      </Section>
      <Section title={t('shell.settings.appearance.layoutHeading')}>
        <ToggleRow variant="checkbox" checked={panelOpen} onChange={setPanelOpen} label={t('shell.settings.appearance.panel')} hint={t('shell.settings.appearance.panelHint')} />
      </Section>
    </>
  );
}

function Language() {
  const { t, lang, setLang } = useI18n();
  const hint = useId();
  return (
    <Section title={t('shell.settings.language.legend')}>
      <fieldset className="stack" aria-describedby={hint}>
        <legend className="sr-only">{t('shell.settings.language.legend')}</legend>
        <p id={hint} className="sec muted">{t('shell.settings.language.hint')}</p>
        <div className="choice-list">
          {LANGS.map((l) => (
            <Choice key={l.key} name="lang" lang={l.htmlLang} checked={lang === l.key} onChange={() => setLang(l.key)}>
              {l.label}
            </Choice>
          ))}
        </div>
      </fieldset>
      <Notice tone="info" icon="info">
        <p className="body-text">{t('shell.settings.language.note')}</p>
      </Notice>
    </Section>
  );
}

const STATUS_LINE: Record<UpdateStatus, { icon: IconName; cls?: string; key: TKey }> = {
  unsupported: { icon: 'info', key: 'shell.settings.about.statusUnsupported' },
  checking: { icon: 'loader', cls: 'spin', key: 'shell.settings.about.statusChecking' },
  current: { icon: 'check', cls: 'ic-primary', key: 'shell.settings.about.statusCurrent' },
  available: { icon: 'download', cls: 'ic-primary', key: 'shell.settings.about.statusAvailable' },
  applying: { icon: 'loader', cls: 'spin', key: 'shell.settings.about.statusApplying' },
  offline: { icon: 'cloudOff', cls: 'ic-warning', key: 'shell.settings.about.statusOffline' },
  error: { icon: 'alertCircle', cls: 'ic-danger', key: 'shell.settings.about.statusError' }
};

// Unsupported copy says why: dev build (by design), the browser, http, or storage blocked.
const UNSUPPORTED: Record<UnsupportedReason, { status: TKey; reason: TKey }> = {
  dev: { status: 'shell.settings.about.statusUnsupported', reason: 'shell.settings.about.checkUnsupported' },
  browser: { status: 'shell.settings.about.statusUnsupportedBrowser', reason: 'shell.settings.about.checkUnsupportedBrowser' },
  insecure: { status: 'shell.settings.about.statusUnsupportedInsecure', reason: 'shell.settings.about.checkUnsupportedInsecure' },
  blocked: { status: 'shell.settings.about.statusUnsupportedBlocked', reason: 'shell.settings.about.checkUnsupportedBlocked' }
};

/** Status line text: never "v" without a version, and install failures are not check failures. */
function statusKey(pwa: PwaApi): TKey {
  if (pwa.status === 'unsupported') return UNSUPPORTED[pwa.unsupportedReason ?? 'dev'].status;
  if (pwa.status === 'error' && pwa.errorKind === 'apply') return 'shell.update.applyErrorText';
  if (!pwa.availableVersion && pwa.status === 'available') return 'shell.settings.about.statusAvailableGeneric';
  if (!pwa.availableVersion && pwa.status === 'applying') return 'shell.settings.about.statusApplyingGeneric';
  return STATUS_LINE[pwa.status].key;
}

function About() {
  const { t, fmtDate, fmtTime } = useI18n();
  const pwa = usePwa();
  const reasonId = useId();
  const [waitNotice, setWaitNotice] = useState(false);
  const line = STATUS_LINE[pwa.status];
  const reason: TKey | undefined =
    pwa.status === 'unsupported' ? UNSUPPORTED[pwa.unsupportedReason ?? 'dev'].reason : pwa.status === 'offline' ? 'shell.settings.about.checkOffline' : undefined;
  const busy = pwa.status === 'checking' || pwa.status === 'applying';
  const blocked = !!reason || busy;
  const version = pwa.availableVersion ?? '';
  return (
    <>
      <Section title={t('shell.settings.about.heading')}>
        <dl className="kv">
          <div><dt>{t('shell.settings.about.appName')}</dt><dd>{t('shell.appName')}</dd></div>
          <div><dt>{t('shell.settings.about.version')}</dt><dd className="num" data-testid="app-version">v{APP_VERSION}</dd></div>
          <div><dt>{t('shell.settings.about.build')}</dt><dd className="num">{BUILD_ID}</dd></div>
          <div>
            <dt>{t('shell.settings.about.status')}</dt>
            <dd>
              <span className="status-line" role="status">
                <Icon name={line.icon} size={18} className={line.cls} />
                {t(statusKey(pwa), { version })}
              </span>
            </dd>
          </div>
          <div>
            <dt>{t('shell.settings.about.lastChecked')}</dt>
            <dd className="num">{pwa.lastChecked ? t('shell.settings.about.lastCheckedAt', { date: fmtDate(pwa.lastChecked.toISOString()), time: fmtTime(pwa.lastChecked) }) : t('shell.settings.about.neverChecked')}</dd>
          </div>
        </dl>
        <div className="row">
          {pwa.updateOffered && (
            <button className="btn btn-primary" type="button" onClick={() => (pwa.hasDirtyWork ? setWaitNotice(true) : pwa.applyUpdate())}>
              <Icon name="download" size={18} />
              {t('shell.settings.about.updateNow')}
            </button>
          )}
          <button
            className="btn btn-secondary"
            type="button"
            aria-disabled={blocked || undefined}
            aria-describedby={reason ? reasonId : undefined}
            onClick={() => {
              if (!blocked) void pwa.checkNow();
            }}
          >
            <Icon name={pwa.status === 'checking' ? 'loader' : 'refresh'} size={18} className={pwa.status === 'checking' ? 'spin' : undefined} />
            {t('shell.settings.about.check')}
          </button>
        </div>
        {reason && <p id={reasonId} className="sec muted">{t(reason)}</p>}
        {waitNotice && pwa.updateOffered && (
          <Notice tone="warning" icon="info" role="status">
            <p className="body-text">{t('shell.update.waitNotice')}</p>
          </Notice>
        )}
      </Section>
      <Section title={t('shell.settings.about.offlineHeading')}>
        <p className="sec">{t('shell.settings.about.offline')}</p>
      </Section>
    </>
  );
}

/** Read-only view of the Learning Framework every module reads (ADR 0001). */
function FrameworkSection() {
  const { t, lang, fmtDate } = useI18n();
  const fw = CURRENT_FRAMEWORK;
  const { domainNel } = useLabels();
  return (
    <>
      <Section title={fw.name[lang]} aside={<span className="status st-draft">{t('shell.settings.framework.version', { version: fw.version })}</span>}>
        <p className="sec">{t('shell.settings.framework.basis')}</p>
        <Notice tone="info" icon="info"><p className="body-text">{t('shell.settings.framework.readOnly')}</p></Notice>
      </Section>
      <Section title={t('shell.settings.framework.areas')}>
        <ul className="stack framework-list" style={{ gap: 0 }}>
          {fw.areas.map((a) => (
            <li key={a.key} className="framework-row">
              <span className="strong">{a.full[lang]}</span>
              <span className="sec muted">{t('pages.progress.nelLine', { area: domainNel(a.key) })}</span>
            </li>
          ))}
        </ul>
        <p className="cap muted">{t('shell.settings.framework.mappingNote')}</p>
      </Section>
      <Section title={t('shell.settings.framework.scale')}>
        <ul className="stack" style={{ gap: 8 }}>
          {fw.scale.map((m) => <li key={m.key}><MilestoneDots milestone={m.key} /></li>)}
        </ul>
        <p className="cap muted">{t('shell.settings.framework.scaleNote')}</p>
      </Section>
      <Section title={t('shell.settings.framework.periods')}>
        <ul className="stack framework-list" style={{ gap: 0 }}>
          {fw.periods.map((p) => (
            <li key={p.term} className="framework-row">
              <span className="strong">{p.label[lang]}</span>
              <span className="sec muted num">{fmtDate(p.start)} – {fmtDate(p.end)}</span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

function DemoData() {
  const { t } = useI18n();
  const { state, dispatch } = usePortfolio();
  const { role } = useRole();
  const account = demoRole(role);
  const [done, setDone] = useState(false);
  return (
    <>
      <Section title={t('shell.settings.demo.heading')}>
        <p className="sec muted">{t('shell.settings.demo.intro')}</p>
        <div className="toggle-list">
          <ToggleRow variant="switch" checked={state.sim.aiDown} onChange={(v) => dispatch({ type: 'setSim', key: 'aiDown', value: v })} label={t('shell.settings.demo.aiDown')} hint={t('shell.settings.demo.aiDownHint')} />
          <ToggleRow variant="switch" checked={state.sim.saveFail} onChange={(v) => dispatch({ type: 'setSim', key: 'saveFail', value: v })} label={t('shell.settings.demo.saveFail')} hint={t('shell.settings.demo.saveFailHint')} />
        </div>
      </Section>
      <Section title={t('shell.settings.demo.resetHeading')}>
        <p className="sec muted">{t('shell.settings.demo.resetHint')}</p>
        <div className="row">
          <button className="btn btn-secondary" type="button" onClick={() => { dispatch({ type: 'reset', actor: { role, name: account.name }, at: now() }); setDone(true); }}>
            <Icon name="undo" size={18} />
            {t('shell.settings.demo.reset')}
          </button>
          <span className="save-state" role="status">
            {done && (
              <>
                <Icon name="check" size={16} className="ic-primary" />
                {t('shell.settings.demo.resetDone')}
              </>
            )}
          </span>
        </div>
      </Section>
      <Section title={t('shell.settings.demo.providerHeading')} aside={<MockProviderLabel />}>
        <p className="sec">{t('shell.settings.demo.providerNote', { provider: t('common.mockProvider') })}</p>
      </Section>
    </>
  );
}

function SettingsBody({ section, bp }: { section: SettingsSection; bp: Breakpoint }) {
  const { t } = useI18n();
  const role = useRole();
  const title = t(`shell.settings.sections.${section}`);
  const tabs = useRef<HTMLElement>(null);
  // Keep the current section's tab in view when the row scrolls on narrow screens.
  useEffect(() => {
    tabs.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [section]);
  return (
    <div className="page settings-page">
      {bp !== 'desktop' && (
        <nav ref={tabs} className="tabs" aria-label={t('shell.settings.title')}>
          {SETTINGS_SECTIONS.filter((s) => s.key !== 'demo' || role.can('demo.controls')).map((s) => (
            <Link key={s.key} className="tab" to={`/settings/${s.key}`} aria-current={s.key === section ? 'page' : undefined}>
              {t(`shell.settings.sections.${s.key}`)}
            </Link>
          ))}
        </nav>
      )}
      {bp !== 'mobile' && (
        <header className="settings-head">
          <p className="sec muted">{t('shell.settings.title')}</p>
          <h1 className="h1">{title}</h1>
        </header>
      )}
      {section === 'demo' && !role.can('demo.controls') ? (
        <Notice tone="info" icon="lock" role="status">
          <p className="body-text">{t('shell.settings.demo.restricted')}</p>
          <Link className="btn btn-secondary" to="/settings/appearance">{t('shell.settings.demo.goAppearance')}</Link>
        </Notice>
      ) : section === 'appearance' ? <Appearance />
      : section === 'language' ? <Language />
      : section === 'framework' ? <FrameworkSection />
      : section === 'about' ? <About />
      : section === 'demo' ? <DemoData /> : null}
    </div>
  );
}

export function Settings() {
  const { section } = useParams();
  const { t } = useI18n();
  if (!isSection(section)) return <NotFound />;
  return (
    <AppShell module="settings" mobileTitle={t('shell.settings.title')} mobileSubtitle={t(`shell.settings.sections.${section}`)}>
      {(bp) => <SettingsBody section={section} bp={bp} />}
    </AppShell>
  );
}
