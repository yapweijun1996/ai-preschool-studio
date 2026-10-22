import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClassCoverage, CoverageStudent } from '../coverage';
import type { DataPort } from '../data/port';

export function useCoverageRead(dataPort: Pick<DataPort, 'getCoverage' | 'getNeedsAttention'>, refreshKey: unknown, term: 3 | 4) {
  const [coverage, setCoverage] = useState<ClassCoverage>();
  const [needsAttention, setNeedsAttention] = useState<CoverageStudent[]>();
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const load = useCallback(() => {
    const request = ++requestId.current;
    setCoverage(undefined);
    setNeedsAttention(undefined);
    setFailed(false);
    setLoading(true);
    void Promise.all([dataPort.getCoverage(term), dataPort.getNeedsAttention(term)]).then(([next, attention]) => {
      if (request === requestId.current) {
        setCoverage(next);
        setNeedsAttention(attention);
      }
    }).catch(() => {
      if (request === requestId.current) setFailed(true);
    }).finally(() => {
      if (request === requestId.current) setLoading(false);
    });
  }, [dataPort, term]);

  useEffect(() => {
    load();
    return () => { requestId.current += 1; };
  }, [load, refreshKey]);

  return { coverage, needsAttention, failed, loading, load };
}
