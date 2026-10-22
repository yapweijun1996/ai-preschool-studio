import { daysAgo } from '../data/demo';
import { useI18n } from '../i18n';

/** "Last observed 3 days ago" in the current language. */
export function useLastObservedLabel() {
  const { t } = useI18n();
  return (iso: string | undefined): string => {
    if (!iso) return t('pages.shared.notObserved');
    const n = daysAgo(iso);
    if (n <= 0) return t('pages.shared.lastObservedToday');
    return t('pages.shared.lastObservedDays', { count: n });
  };
}

/** "3 days ago" for a column already headed "Last observed". */
export function useAgoLabel() {
  const { t } = useI18n();
  return (iso: string | undefined): string => {
    if (!iso) return t('pages.shared.notObserved');
    const n = daysAgo(iso);
    return n <= 0 ? t('pages.shared.today') : t('pages.shared.daysAgo', { count: n });
  };
}
