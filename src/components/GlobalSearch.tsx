import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CLASS_NAME } from '../data/demo';
import { useI18n, type TKey } from '../i18n';
import { useDataPort } from '../store/PortfolioContext';
import type { StudentSummary } from '../store/selectors';
import { demoRole } from '../roles';
import { Icon, type IconName } from './Icon';
import { Avatar, StatusLabel } from './ui';
import { useRole } from '../roles/RoleContext';

const PAGES: { key: string; label: TKey; to: string; icon: IconName }[] = [
  { key: 'dashboard', label: 'shell.nav.dashboard', to: '/', icon: 'home' },
  { key: 'students', label: 'shell.nav.students', to: '/students', icon: 'users' },
  { key: 'classes', label: 'pages.children.classesTitle', to: '/classes', icon: 'users' },
  { key: 'coverage', label: 'pages.coverage.title', to: '/coverage', icon: 'layers' },
  { key: 'reviews', label: 'pages.reviews.title', to: '/reviews', icon: 'fileText' },
  { key: 'audit', label: 'pages.audit.title', to: '/audit', icon: 'fileText' },
  { key: 'settings', label: 'shell.more.settings', to: '/settings', icon: 'settings' }
];

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/**
 * Top-bar search: a trigger that opens a command palette (also Ctrl/⌘+K) listing matching
 * students and pages. Combobox + listbox; ↑/↓ move, Enter opens, Esc closes and restores focus.
 */
export function GlobalSearch() {
  const { t } = useI18n();
  const role = useRole();
  const navigate = useNavigate();
  const port = useDataPort();
  const [summaries, setSummaries] = useState<StudentSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const shortcut = isMac() ? '⌘K' : 'Ctrl K';

  useEffect(() => {
    void port.getAllSummaries({ role: role.role, name: demoRole(role.role).name }).then(setSummaries);
  }, [port, role.role]);

  // Layout effect: the shortcut must work as soon as the page is visible.
  useLayoutEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      input.current?.focus();
    }
  }, [open]);

  const q = query.trim().toLowerCase();
  const items = useMemo(() => {
    const students = (role.can('students.view') ? summaries : [])
      .filter((s) => !q || s.student.name.toLowerCase().includes(q))
      .map((s) => ({ kind: 'student' as const, key: s.student.id, to: `/students/${s.student.id}`, summary: s }));
    const pages = PAGES.filter((p) => {
      if (p.key === 'dashboard') return role.can('dashboard.view');
      if (p.key === 'students') return role.can('students.view');
      if (p.key === 'classes') return role.can('students.view');
      if (p.key === 'coverage') return role.can('coverage.view');
      if (p.key === 'reviews') return role.can('reviews.view') || role.can('reviews.changes');
      if (p.key === 'audit') return role.can('audit.view');
      return role.can('settings.view');
    })
      .filter((p) => !q || t(p.label).toLowerCase().includes(q))
      .map((p) => ({ kind: 'page' as const, key: p.key, to: p.to, page: p }));
    return [...students, ...pages];
  }, [summaries, q, t, role]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (items.length ? (a + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (items.length ? (a - 1 + items.length) % items.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const it = items[active];
      if (it) go(it.to);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      // Focus stays in the dialog: the input is its only tab stop.
      e.preventDefault();
    }
  };

  useEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, listId]);

  const firstPage = items.findIndex((i) => i.kind === 'page');
  const studentCount = firstPage === -1 ? items.length : firstPage;

  return (
    <>
      <button ref={trigger} className="search-trigger has-tip tip-below" type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" data-tip={`${t('shell.search.label')} · ${shortcut}`} aria-keyshortcuts="Control+K Meta+K">
        <Icon name="search" size={18} />
        <span className="search-trigger-text">{t('shell.search.trigger')}</span>
        <kbd className="search-trigger-kbd" aria-hidden="true">{shortcut}</kbd>
      </button>
      {open && (
        <>
          <div className="cmdk-scrim" aria-hidden="true" onMouseDown={close} />
          <div className="cmdk" role="dialog" aria-modal="true" aria-label={t('shell.search.label')}>
            <div className="cmdk-input">
              <Icon name="search" />
              <input
                ref={input}
                className="grow"
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={items[active] ? `${listId}-${active}` : undefined}
                aria-label={t('shell.search.label')}
                placeholder={t('shell.search.placeholder')}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                onKeyDown={onKeyDown}
              />
              <kbd className="search-trigger-kbd">Esc</kbd>
            </div>
            <div className="cmdk-list" id={listId} role="listbox" aria-label={t('shell.search.label')}>
              {items.length === 0 && <p className="sec muted cmdk-empty" role="status">{t('shell.search.noResults', { query: query.trim() })}</p>}
              {[
                { key: 'students', label: t('shell.search.students'), from: 0, to: studentCount },
                { key: 'pages', label: t('shell.search.pages'), from: studentCount, to: items.length }
              ]
                .filter((g) => g.to > g.from)
                .map((g) => (
                  <div key={g.key} role="group" aria-labelledby={`${listId}-${g.key}`}>
                    <p id={`${listId}-${g.key}`} className="cap muted cmdk-group">{g.label}</p>
                    {items.slice(g.from, g.to).map((it, j) => {
                      const i = g.from + j;
                      return (
                        <div
                          key={`${it.kind}-${it.key}`}
                          id={`${listId}-${i}`}
                          role="option"
                          aria-selected={i === active}
                          className="cmdk-item"
                          onMouseMove={() => setActive(i)}
                          onClick={() => go(it.to)}
                        >
                          {it.kind === 'student' ? (
                            <>
                              <Avatar initials={it.summary.student.initials} size="sm" />
                              <span className="grow stack" style={{ gap: 0 }}>
                                <span className="sec semibold">{it.summary.student.name}</span>
                                <span className="cap muted">{CLASS_NAME} · {t('common.demoStudent')}</span>
                              </span>
                              <StatusLabel status={it.summary.report.status} />
                            </>
                          ) : (
                            <>
                              <Icon name={it.page.icon} size={18} />
                              <span className="grow sec semibold">{t(it.page.label)}</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
            </div>
            <p className="cap muted cmdk-hint">{t('shell.search.hint')}</p>
          </div>
        </>
      )}
    </>
  );
}
