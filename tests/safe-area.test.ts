import { beforeAll, describe, expect, it } from 'vitest';

// Headless Chromium cannot emulate a notch, so check the rules themselves: every full-bleed bar
// (and the rail / shell body) must clear safe-area-inset-left and -right in landscape.
// Read the source from disk (Vitest stubs CSS imports); the app tsconfig has no @types/node.
let css = '';
beforeAll(async () => {
  const fsModule = 'node:fs';
  const { readFileSync } = (await import(/* @vite-ignore */ fsModule)) as { readFileSync(path: string, enc: 'utf8'): string };
  css = readFileSync('src/styles/app.css', 'utf8');
});

const rule = (selector: string) => {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = css.match(new RegExp(`(?:^|\\n)${esc} \\{([^}]*)\\}`));
  return m ? m[1] : '';
};

describe('safe areas (notched phones in landscape)', () => {
  it('reads the stylesheet', () => {
    expect(rule('.topbar')).not.toBe('');
  });

  it.each(['.topbar', '.m-header', '.is-mobile .demo-strip', '.action-bar', '.tabbar', '.update-banner'])('%s pads both sides', (sel) => {
    const body = rule(sel);
    expect(body).toContain('env(safe-area-inset-left)');
    expect(body).toContain('env(safe-area-inset-right)');
  });

  it('the rail clears the left inset and the shell body the right one', () => {
    expect(rule('.rail')).toContain('env(safe-area-inset-left)');
    expect(rule('.shell-body')).toContain('env(safe-area-inset-right)');
  });
});
