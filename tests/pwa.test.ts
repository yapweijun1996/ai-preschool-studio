import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  APP_VERSION,
  BUILD_ID,
  PwaProvider,
  THEME_COLOR,
  UPDATE_TIMED_OUT,
  canApply,
  initialPwaState,
  pwaReducer,
  shouldAutoApply,
  useDirtyGuard,
  usePwa,
  type PwaAction,
  type PwaState
} from '../src/pwa';
import { resolveBuildId, resolveVersion } from '../scripts/build-info.mjs';

const at = new Date('2026-10-22T08:00:00Z');
const run = (s: PwaState, ...actions: PwaAction[]) => actions.reduce(pwaReducer, s);
const available = (): PwaState =>
  run(initialPwaState(true), { type: 'check-start' }, { type: 'check-done', waiting: true, at }, { type: 'version', version: '0.3.1' });

describe('pwa update state machine', () => {
  it('starts checking when supported, unsupported otherwise (and stays unsupported)', () => {
    expect(initialPwaState(true).status).toBe('checking');
    const u = initialPwaState(false);
    expect(u.status).toBe('unsupported');
    expect(run(u, { type: 'check-done', waiting: true, at }, { type: 'apply', dirty: false })).toBe(u);
  });

  it('check → current or available, recording lastChecked and availableVersion', () => {
    const cur = run(initialPwaState(true), { type: 'check-start' }, { type: 'check-done', waiting: false, at });
    expect(cur).toEqual({ status: 'current', lastChecked: at });
    const s = available();
    expect(s.status).toBe('available');
    expect(s.availableVersion).toBe('0.3.1');
    expect(s.lastChecked).toBe(at);
  });

  it('a later check does not hide a waiting release', () => {
    const s = available();
    expect(pwaReducer(s, { type: 'check-start' })).toBe(s);
    expect(pwaReducer(s, { type: 'offline' }).status).toBe('available');
    expect(pwaReducer(s, { type: 'check-failed', message: 'x', at }).status).toBe('available');
  });

  it('refuses to apply while there is dirty work; status stays available', () => {
    const s = available();
    expect(canApply(s, true)).toBe(false);
    expect(pwaReducer(s, { type: 'apply', dirty: true })).toBe(s);
    expect(pwaReducer(s, { type: 'apply', dirty: false }).status).toBe('applying');
  });

  it('apply is a no-op unless available, and duplicate apply is ignored', () => {
    const cur = run(initialPwaState(true), { type: 'check-done', waiting: false, at });
    expect(pwaReducer(cur, { type: 'apply', dirty: false })).toBe(cur);
    const applying = pwaReducer(available(), { type: 'apply', dirty: false });
    expect(pwaReducer(applying, { type: 'apply', dirty: false })).toBe(applying);
    // Checks and detections arriving mid-apply do not interrupt it.
    expect(pwaReducer(applying, { type: 'check-done', waiting: false, at })).toBe(applying);
    expect(pwaReducer(applying, { type: 'update-found' })).toBe(applying);
  });

  it('apply timeout → error "Update timed out", and a re-check makes it retryable', () => {
    const applying = pwaReducer(available(), { type: 'apply', dirty: false });
    const err = pwaReducer(applying, { type: 'apply-timeout' });
    expect(err.status).toBe('error');
    expect(err.error).toBe(UPDATE_TIMED_OUT);
    expect(err.availableVersion).toBe('0.3.1');
    expect(pwaReducer(err, { type: 'apply', dirty: false })).toBe(err);
    const again = run(err, { type: 'check-start' }, { type: 'check-done', waiting: true, at });
    expect(again.status).toBe('available');
    expect(again.error).toBeUndefined();
    expect(pwaReducer(again, { type: 'apply', dirty: false }).status).toBe('applying');
    // A timeout that fires after the apply already moved on is ignored.
    expect(pwaReducer(again, { type: 'apply-timeout' })).toBe(again);
  });

  it('offline and check failures', () => {
    const off = run(initialPwaState(true), { type: 'offline', at });
    expect(off.status).toBe('offline');
    expect(run(off, { type: 'check-start' }).status).toBe('checking');
    const err = run(initialPwaState(true), { type: 'check-start' }, { type: 'check-failed', message: 'boom', at });
    expect(err).toMatchObject({ status: 'error', error: 'boom', lastChecked: at });
    expect(run(err, { type: 'check-start' }, { type: 'check-done', waiting: false, at })).toEqual({ status: 'current', lastChecked: at });
  });

  it('update found outside a check (other tab) makes the update available', () => {
    const cur = run(initialPwaState(true), { type: 'check-done', waiting: false, at });
    expect(pwaReducer(cur, { type: 'update-found' }).status).toBe('available');
  });

  it('safe-idle policy: auto apply only when hidden and clean', () => {
    const s = available();
    expect(shouldAutoApply(s, false, 'hidden')).toBe(true);
    expect(shouldAutoApply(s, false, 'visible')).toBe(false);
    expect(shouldAutoApply(s, true, 'hidden')).toBe(false);
    expect(shouldAutoApply(pwaReducer(s, { type: 'apply', dirty: false }), false, 'hidden')).toBe(false);
  });
});

describe('PwaProvider (no service worker in tests)', () => {
  const wrapper = ({ children }: { children: ReactNode }) => createElement(PwaProvider, null, children);

  afterEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it('reports unsupported with the build identity, and apply is a no-op', async () => {
    const { result } = renderHook(() => usePwa(), { wrapper });
    expect(result.current.status).toBe('unsupported');
    expect(result.current.currentVersion).toBe(APP_VERSION);
    expect(result.current.currentBuild).toBe(BUILD_ID);
    act(() => result.current.applyUpdate());
    await act(() => result.current.checkNow());
    expect(result.current.status).toBe('unsupported');
    expect(window.__apsPwa?.snapshot()).toEqual({
      status: 'unsupported',
      currentVersion: APP_VERSION,
      currentBuild: BUILD_ID,
      availableVersion: undefined,
      hasDirtyWork: false
    });
  });

  it('useDirtyGuard ref-counts dirty screens and warns before unload only while dirty', () => {
    const { result, rerender } = renderHook(
      ({ a, b }: { a: boolean; b: boolean }) => {
        useDirtyGuard(a);
        useDirtyGuard(b);
        return usePwa();
      },
      { wrapper, initialProps: { a: false, b: false } }
    );
    const unloadBlocked = () => {
      const e = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(e);
      return e.defaultPrevented;
    };
    expect(result.current.hasDirtyWork).toBe(false);
    expect(unloadBlocked()).toBe(false);
    rerender({ a: true, b: true });
    expect(result.current.hasDirtyWork).toBe(true);
    expect(unloadBlocked()).toBe(true);
    rerender({ a: false, b: true });
    expect(result.current.hasDirtyWork).toBe(true);
    rerender({ a: false, b: false });
    expect(result.current.hasDirtyWork).toBe(false);
    expect(window.__apsPwa?.snapshot().hasDirtyWork).toBe(false);
    expect(unloadBlocked()).toBe(false);
  });

  it('keeps a single theme-color meta in sync with <html data-theme>', async () => {
    renderHook(() => usePwa(), { wrapper });
    const metas = () => document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    expect(metas()).toHaveLength(1);
    expect(metas()[0].content).toBe(THEME_COLOR.light);
    await act(async () => {
      document.documentElement.dataset.theme = 'dark';
      await Promise.resolve();
    });
    expect(metas()).toHaveLength(1);
    expect(metas()[0].content).toBe('#111A2B');
    await act(async () => {
      document.documentElement.dataset.theme = 'light';
      await Promise.resolve();
    });
    expect(metas()[0].content).toBe('#FFFFFF');
  });
});

describe('build identity', () => {
  // The app tsconfig has no @types/node; reach Node's process through globalThis.
  const env = (globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env;
  const saved = { ...env };
  afterEach(() => {
    for (const k of ['APP_VERSION', 'BUILD_ID', 'GITHUB_SHA']) {
      if (saved[k] === undefined) delete env[k];
      else env[k] = saved[k];
    }
  });

  it('env APP_VERSION / BUILD_ID override; GITHUB_SHA is shortened to 7 chars', () => {
    env.APP_VERSION = '9.9.9-test';
    env.BUILD_ID = 'abc1234';
    expect(resolveVersion()).toBe('9.9.9-test');
    expect(resolveBuildId()).toBe('abc1234');
    delete env.APP_VERSION;
    delete env.BUILD_ID;
    env.GITHUB_SHA = '0123456789abcdef';
    expect(resolveVersion()).toBe('0.3.0');
    expect(resolveBuildId()).toBe('0123456');
  });
});
