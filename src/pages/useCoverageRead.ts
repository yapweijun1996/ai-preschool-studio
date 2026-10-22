import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClassCoverage } from '../coverage';
import type { DataPort } from '../data/port';

export function useCoverageRead(dataPort: Pick<DataPort, 'getCoverage'>, refreshKey: unknown, term: 3 | 4) {
  const [coverage, setCoverage] = useState<ClassCoverage>();
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const load = useCallback(() => {
    const request = ++requestId.current;
    setCoverage(undefined);
    setFailed(false);
    setLoading(true);
    void dataPort.getCoverage(term).then((next) => {
      if (request === requestId.current) setCoverage(next);
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

  return { coverage, failed, loading, load };
}
