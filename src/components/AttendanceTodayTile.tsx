import { Link } from 'react-router-dom';
import { isLate, type AttendanceRecord } from '../attendance/domain';
import { TODAY } from '../data/demo';
import { useI18n } from '../i18n';
import '../styles/attendance-summary.css';

type ChildStatus = { status: string };

export function AttendanceTodayTile({
  records,
  children,
}: {
  records: AttendanceRecord[];
  children: Record<string, ChildStatus>;
}) {
  const { t } = useI18n();
  const today = records.filter(
    (record) => record.date === TODAY && record.classId === 'k2-sunflower-2026',
  );
  const present = today.filter((record) => record.status === 'present');
  const late = present.filter((record) => isLate(record.arrivedAt)).length;
  const activeCount = Object.values(children).filter((child) => child.status === 'active').length;
  const counts = {
    present: present.length,
    late,
    absent: today.filter((record) => record.status === 'absent').length,
    notMarked: Math.max(0, activeCount - today.length),
  };
  const countLabels = ['present', 'late', 'absent', 'notMarked'] as const;

  return (
    <section className="card attendance-dashboard-tile">
      <div className="card-head">
        <h2 className="h2 grow">{t('pages.attendance.dashboardTile')}</h2>
        <Link className="btn btn-ghost" to="/attendance">
          {t('pages.attendance.viewRegister')}
        </Link>
      </div>
      <div className="attendance-tile-counts">
        {countLabels.map((key) => (
          <div className={key === 'late' ? 'attendance-tile-late' : undefined} key={key}>
            <span className="cap muted">{t(`pages.attendance.${key}`)}</span>
            <strong className="h2 num">{counts[key]}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
