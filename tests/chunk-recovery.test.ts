import { describe, expect, it } from 'vitest';
import { isChunkLoadError } from '../src/routes/chunkRecovery';

describe('chunk load error classifier', () => {
  it.each([
    'Failed to fetch dynamically imported module: /assets/Coverage-abc123.js',
    'Importing a module script failed',
    'error loading dynamically imported module'
  ])('recognizes %s', (message) => {
    expect(isChunkLoadError(new TypeError(message))).toBe(true);
  });

  it('does not classify generic network fetch failures or other render errors', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch'))).toBe(false);
    expect(isChunkLoadError(new Error('Something went wrong'))).toBe(false);
    expect(isChunkLoadError('Failed to fetch dynamically imported module')).toBe(false);
  });
});
