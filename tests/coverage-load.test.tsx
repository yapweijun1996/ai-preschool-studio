import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCoverageRead } from '../src/pages/useCoverageRead';
import type { ClassCoverage } from '../src/coverage';
import type { DataPort } from '../src/data/port';

function result(childrenWithGaps: number): ClassCoverage {
  return { students: [], summary: { childrenWithGaps, areasMissing: 0, areasThin: 0, areasStale: 0 } };
}

function Probe({ port, term }: { port: DataPort; term: 3 | 4 }) {
  const { coverage, loading } = useCoverageRead(port, null, term);
  return <div>{loading ? 'Loading' : `Term ${term}: ${coverage?.summary.childrenWithGaps}`}</div>;
}

describe('coverage request freshness', () => {
  it('ignores a delayed prior-term response and shows loading while switching terms', async () => {
    let resolve4!: (value: ClassCoverage) => void;
    let resolve3!: (value: ClassCoverage) => void;
    const getCoverage = vi.fn((term: 3 | 4) => new Promise<ClassCoverage>((resolve) => {
      if (term === 4) resolve4 = resolve;
      else resolve3 = resolve;
    }));
    const port = { getCoverage, getNeedsAttention: vi.fn(() => Promise.resolve([])) } as unknown as DataPort;
    const view = render(<Probe port={port} term={4} />);
    expect(screen.getByText('Loading')).toBeTruthy();
    view.rerender(<Probe port={port} term={3} />);
    expect(screen.getByText('Loading')).toBeTruthy();
    await act(async () => { resolve3(result(3)); });
    expect(screen.getByText('Term 3: 3')).toBeTruthy();
    await act(async () => { resolve4(result(4)); });
    expect(screen.getByText('Term 3: 3')).toBeTruthy();
  });
});
