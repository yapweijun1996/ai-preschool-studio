import '../styles/attendance-summary.css';

export type AttendanceDay = {
  date: string;
  label: string;
  status: 'present' | 'late' | 'absent' | 'notMarked';
  statusLabel: string;
};

export function AttendanceDayStrip({ days }: { days: AttendanceDay[] }) {
  return (
    <div className="attendance-day-strip">
      {days.map(({ date, label, status, statusLabel }) => (
        <div className={`attendance-day attendance-day-${status}`} key={date}>
          <span className="cap muted">{label}</span>
          <span className="attendance-day-mark" aria-hidden="true" />
          <span className="cap">{statusLabel}</span>
        </div>
      ))}
    </div>
  );
}
