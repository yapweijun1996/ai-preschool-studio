// Node-side helpers for vite.config.ts (kept in plain JS so the app's tsconfig
// does not need @types/node). Types live in build-info.d.mts.
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Repo root. Pass a string (not a URL object): under Vitest's jsdom environment the global URL is jsdom's.
const root = dirname(dirname(fileURLToPath(import.meta.url)));

/** package.json version, overridable with env APP_VERSION (used by e2e builds). */
export function resolveVersion() {
  if (process.env.APP_VERSION) return process.env.APP_VERSION;
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  return String(pkg.version);
}

/** env BUILD_ID → first 7 chars of GITHUB_SHA → `git rev-parse --short HEAD` → 'local'. */
export function resolveBuildId() {
  if (process.env.BUILD_ID) return process.env.BUILD_ID;
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    const sha = execSync('git rev-parse --short HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (sha) return sha;
  } catch {
    /* not a git checkout */
  }
  return 'local';
}

/** Every file under dir as a POSIX path relative to dir (empty when dir is missing). */
export function listFiles(dir) {
  if (!dir || !existsSync(dir)) return [];
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(relative(dir, p).split(sep).join('/'));
    }
  };
  walk(dir);
  return out.sort();
}

/** Service worker source template (src/pwa/sw-template.js). */
export function readSwTemplate() {
  return readFileSync(join(root, 'src', 'pwa', 'sw-template.js'), 'utf8');
}
