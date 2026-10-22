import { createElement, useEffect, type ComponentType, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AppShell, type Module } from '../components/AppShell';
import { useI18n } from '../i18n';
import { clearChunkReloadAttempt } from './chunkRecovery';

const rawPageLoaders = {
  students: () => import('../pages/Students').then((m) => ({ default: m.Students })),
  classes: () => import('../pages/Classes').then((m) => ({ default: m.Classes })),
  profile: () => import('../pages/StudentProfile').then((m) => ({ default: m.StudentProfile })),
  progress: () => import('../pages/LearningProgress').then((m) => ({ default: m.LearningProgress })),
  observe: () => import('../pages/AddObservation').then((m) => ({ default: m.AddObservation })),
  studio: () => import('../pages/PortfolioStudio').then((m) => ({ default: m.PortfolioStudio })),
  report: () => import('../pages/ReportPreview').then((m) => ({ default: m.ReportPreview })),
  family: () => import('../pages/FamilyReport').then((m) => ({ default: m.FamilyReport })),
  coverage: () => import('../pages/Coverage').then((m) => ({ default: m.Coverage })),
  reviews: () => import('../pages/Reviews').then((m) => ({ default: m.Reviews })),
  audit: () => import('../pages/AuditLog').then((m) => ({ default: m.AuditLog })),
  settings: () => import('../pages/Settings').then((m) => ({ default: m.Settings })),
  catalog: () => import('../pages/Catalog').then((m) => ({ default: m.Catalog })),
  notFound: () => import('../pages/NotFound').then((m) => ({ default: m.NotFound }))
};

export type PageKind = keyof typeof rawPageLoaders;

type PageModule = { default: ComponentType<any> };
type PageLoader = () => Promise<PageModule>;
const loadedPages = new Map<PageKind, ComponentType<any>>();
const pendingPages = new Map<PageKind, Promise<PageModule>>();

export const pageLoaders = Object.fromEntries(
  (Object.entries(rawPageLoaders) as [PageKind, PageLoader][]).map(([kind, load]) => [kind, () => {
    const loaded = loadedPages.get(kind);
    if (loaded) return Promise.resolve({ default: loaded });
    const pending = pendingPages.get(kind);
    if (pending) return pending;
    const request = load().then((module) => {
      loadedPages.set(kind, module.default);
      return module;
    });
    pendingPages.set(kind, request);
    return request;
  }])
) as Record<PageKind, PageLoader>;

function routePage(kind: PageKind): ComponentType<any> {
  return function PreloadedRoutePage(props) {
    const Page = loadedPages.get(kind);
    if (!Page) throw pageLoaders[kind]();
    return createElement(Page, props);
  };
}

export const Students = routePage('students');
export const Classes = routePage('classes');
export const StudentProfile = routePage('profile');
export const LearningProgress = routePage('progress');
export const AddObservation = routePage('observe');
export const PortfolioStudio = routePage('studio');
export const ReportPreview = routePage('report');
export const FamilyReport = routePage('family');
export const Coverage = routePage('coverage');
export const Reviews = routePage('reviews');
export const AuditLog = routePage('audit');
export const Settings = routePage('settings');
export const Catalog = routePage('catalog');
export const NotFound = routePage('notFound');

export function pageKindForPath(pathname: string): PageKind | undefined {
  const path = pathname.split('?')[0];
  return path === '/students' ? 'students'
    : path === '/classes' ? 'classes'
    : path === '/coverage' ? 'coverage'
    : path === '/reviews' ? 'reviews'
    : path === '/audit' ? 'audit'
    : path === '/settings' || path.startsWith('/settings/') ? 'settings'
    : path === '/catalog' ? 'catalog'
    : /^\/students\/[^/]+\/observe$/.test(path) ? 'observe'
    : /^\/students\/[^/]+\/progress$/.test(path) ? 'progress'
    : /^\/students\/[^/]+\/studio$/.test(path) ? 'studio'
    : /^\/students\/[^/]+\/report\/family$/.test(path) ? 'family'
    : /^\/students\/[^/]+\/report$/.test(path) ? 'report'
    : /^\/students\/[^/]+$/.test(path) ? 'profile'
    : path === '/' ? undefined : 'notFound';
}

export function RouteChunkSuccess({ children }: { children: ReactNode }) {
  const location = useLocation();
  useEffect(() => {
    clearChunkReloadAttempt();
    window.dispatchEvent(new Event('route-content-ready'));
  }, [location.pathname, location.search, location.key]);
  return children;
}

const fallbackInfo: Record<PageKind, { frame: 'list' | 'detail' | 'editor' | 'report' | 'summary' }> = {
  students: { frame: 'list' },
  classes: { frame: 'list' },
  profile: { frame: 'summary' },
  progress: { frame: 'summary' },
  observe: { frame: 'editor' },
  studio: { frame: 'editor' },
  report: { frame: 'report' },
  family: { frame: 'report' },
  coverage: { frame: 'summary' },
  reviews: { frame: 'list' },
  audit: { frame: 'list' },
  settings: { frame: 'summary' },
  catalog: { frame: 'summary' },
  notFound: { frame: 'summary' }
};

export function RouteFallback({ kind }: { kind: PageKind }) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const info = fallbackInfo[kind];
  const id = /^\/students\/([^/]+)/.exec(pathname)?.[1];
  const shells: Record<PageKind, { module: Module; title: string; focus?: boolean }> = {
    students: { module: 'students', title: t('pages.students.title') },
    classes: { module: 'students', title: t('pages.children.classesTitle') },
    profile: { module: 'students', title: t('pages.tabs.overview') },
    progress: { module: 'students', title: t('pages.progress.title') },
    observe: { module: 'observations', title: t('pages.observation.title') },
    studio: { module: 'students', title: t('pages.studio.title'), focus: true },
    report: { module: 'reports', title: t('pages.report.title') },
    family: { module: 'reports', title: t('pages.children.familyTitle') },
    coverage: { module: 'students', title: t('pages.coverage.title') },
    reviews: { module: 'reports', title: t('pages.reviews.title') },
    audit: { module: 'settings', title: t('pages.audit.title') },
    settings: { module: 'settings', title: t('shell.settings.title') },
    catalog: { module: 'settings', title: t('shell.panel.designReference') },
    notFound: { module: 'students', title: t('shell.notFound.title') }
  };
  const shell = shells[kind];
  const skeleton = (
        <div className={`page route-loading route-loading-${info.frame}`} aria-busy="true" aria-label={t('pages.children.loading')}>
          <div className="page-title-row"><div className="grow stack"><span className="skel" style={{ width: 220, height: 34 }} /><span className="skel" style={{ width: 300, height: 20 }} /></div><span className="skel" style={{ width: 150, height: 40 }} /></div>
          {kind === 'classes' ? <>
            <section className="card card-pad row class-summary" aria-hidden="true"><div className="grow stack"><span className="skel" style={{ width: 160, height: 24 }} /><span className="skel" style={{ width: 110, height: 20 }} /></div><span className="skel" style={{ width: 130, height: 42 }} /><span className="skel" style={{ width: 70, height: 42 }} /></section>
            <div className="row class-filters" aria-hidden="true"><span className="skel" style={{ width: 112, height: 36 }} /><span className="skel" style={{ width: 126, height: 36 }} /></div>
          </> : null}
          <section className="card" aria-hidden="true" style={{ minHeight: info.frame === 'report' ? 700 : info.frame === 'editor' ? 560 : 460, ...(kind === 'classes' ? {} : { padding: 16 }) }}>
            {info.frame === 'summary' && <div className="row" style={{ gap: 16, marginBottom: 20 }}><span className="skel" style={{ width: 80, height: 80, borderRadius: 999 }} /><span className="grow stack"><span className="skel" style={{ width: 190, height: 24 }} /><span className="skel" style={{ width: 260, height: 16 }} /></span></div>}
            {kind === 'classes' ? Array.from({ length: 6 }, (_, index) => <div className="row-link" key={index}><span className="skel" style={{ width: 40, height: 40, borderRadius: 999 }} /><span className="grow skel" style={{ height: 16, maxWidth: 220 }} /><span className="skel" style={{ width: 88, height: 24 }} /></div>) : null}
            {kind !== 'classes' && Array.from({ length: info.frame === 'report' ? 7 : info.frame === 'editor' ? 5 : 6 }, (_, index) => (
              <div className="row-link" key={index}><span className="skel" style={{ width: 40, height: 40, borderRadius: info.frame === 'list' ? 999 : 8 }} /><span className="grow stack"><span className="skel" style={{ height: 16, maxWidth: index % 2 ? 220 : 300 }} /><span className="skel" style={{ height: 12, maxWidth: 180 }} /></span><span className="skel" style={{ width: 88, height: 24 }} /></div>
            ))}
          </section>
        </div>
  );
  return <AppShell module={shell.module} mobileTitle={shell.title} currentStudentId={id} focus={shell.focus}>{() => skeleton}</AppShell>;
}

export function RoutePreloadHints() {
  useEffect(() => {
    const preload = (raw: string) => {
      const path = raw.startsWith('#') ? raw.slice(1) : raw;
      const kind = pageKindForPath(path);
      if (kind) void pageLoaders[kind]();
    };
    const onIntent = (event: Event) => {
      const target = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (target) preload(target.getAttribute('href') ?? '');
    };
    document.addEventListener('pointerover', onIntent, { passive: true });
    document.addEventListener('focusin', onIntent);
    document.addEventListener('touchstart', onIntent, { passive: true });
    const idle = window as Window & { requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number };
    const id = idle.requestIdleCallback ? idle.requestIdleCallback(() => { void pageLoaders.students(); }, { timeout: 1500 }) : window.setTimeout(() => { void pageLoaders.students(); }, 1500);
    return () => {
      document.removeEventListener('pointerover', onIntent);
      document.removeEventListener('focusin', onIntent);
      document.removeEventListener('touchstart', onIntent);
      if (idle.cancelIdleCallback && typeof id === 'number') idle.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, []);
  return null;
}
