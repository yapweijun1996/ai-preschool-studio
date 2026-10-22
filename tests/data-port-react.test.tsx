import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PortfolioProvider, useDataPort } from '../src/store/PortfolioContext';
import { initialState } from '../src/store/reducer';

function PortActions({ onComplete }: { onComplete: (observations: number, submitted: boolean) => void }) {
  const port = useDataPort();
  return (
    <button type="button" onClick={async () => {
      const added = await port.addObservation({
        studentId: 'aria', date: '2026-10-22', domain: 'en', text: 'A fresh observation.',
        milestone: 'developing', hasPhoto: false
      });
      const observations = await port.getObservations('aria');
      const reflection = await port.setReflection('aria', 'A new reflection for review.');
      const submitted = await port.submitForReview('aria');
      onComplete(observations.length, added.ok && reflection.ok && submitted.ok);
    }}>Run port actions</button>
  );
}

describe('DataPort provider state', () => {
  it('reads writes made earlier in the same async handler', async () => {
    let completed: [number, boolean] | undefined;
    const initial = initialState();
    const before = initial.observations.filter((observation) => observation.studentId === 'aria' && observation.term === 4).length;
    render(
      <PortfolioProvider initial={initial}>
        <PortActions onComplete={(count, submitted) => { completed = [count, submitted]; }} />
      </PortfolioProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Run port actions' }));
    await waitFor(() => expect(completed).toEqual([before + 1, true]));
  });
});
