import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRegister } from '../src/pages/attendance/shared';
import type { AttendanceRegister } from '../src/data/port';

const { usePortfolio, useDataPort, useRole } = vi.hoisted(() => ({
  usePortfolio: vi.fn(),
  useDataPort: vi.fn(),
  useRole: vi.fn(),
}));

vi.mock('../src/store/PortfolioContext', () => ({ usePortfolio, useDataPort }));
vi.mock('../src/roles/RoleContext', () => ({ useRole }));

function Probe() {
  const { loading, loadFailed, retry } = useRegister();
  if (loading) return <p role="status">Loading</p>;
  if (loadFailed) {
    return (
      <div role="alert">
        Unable to load attendance
        <button onClick={retry}>Retry</button>
      </div>
    );
  }
  return <p>Register loaded</p>;
}

describe('attendance register load recovery', () => {
  beforeEach(() => {
    usePortfolio.mockReturnValue({ state: {} });
    useRole.mockReturnValue({ role: 'teacher', can: () => true });
  });

  it('shows a distinct error after a failed load and retries successfully', async () => {
    const getAttendanceRegister = vi
      .fn<() => Promise<AttendanceRegister>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ date: '2026-10-23', rows: [] });
    useDataPort.mockReturnValue({ getAttendanceRegister });

    render(<Probe />);
    expect(screen.getByRole('status').textContent).toBe('Loading');
    await act(async () => {});
    expect(screen.getByRole('alert').textContent).toContain('Unable to load attendance');

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.getByRole('status').textContent).toBe('Loading');
    await act(async () => {});
    expect(screen.getByText('Register loaded')).toBeTruthy();
    expect(getAttendanceRegister).toHaveBeenCalledTimes(2);
  });
});
