import type { DomainKey } from '../framework';
import { useI18n } from '../i18n';
import { useLabels } from '../i18n/labels';
import aiReady from '../assets/illustrations/ai-ready.webp';
import noObservations from '../assets/illustrations/no-observations.webp';
import noResults from '../assets/illustrations/no-results.webp';
import notFound from '../assets/illustrations/not-found.webp';
import offlineAi from '../assets/illustrations/offline-ai.webp';
import plannedFamily from '../assets/illustrations/planned-family.webp';
import plannedSchool from '../assets/illustrations/planned-school.webp';
import reportNotStarted from '../assets/illustrations/report-not-started.webp';
import art from '../assets/placeholders/art.webp';
import domainEn from '../assets/placeholders/domain-en.webp';
import domainMa from '../assets/placeholders/domain-ma.webp';
import domainSe from '../assets/placeholders/domain-se.webp';
import domainZh from '../assets/placeholders/domain-zh.webp';
import outdoor from '../assets/placeholders/outdoor.webp';

export type EmptyIllustrationName =
  | 'ai-ready'
  | 'no-observations'
  | 'no-results'
  | 'not-found'
  | 'offline-ai'
  | 'planned-family'
  | 'planned-school'
  | 'report-not-started';

const EMPTY_IMAGES: Record<EmptyIllustrationName, string> = {
  'ai-ready': aiReady,
  'no-observations': noObservations,
  'no-results': noResults,
  'not-found': notFound,
  'offline-ai': offlineAi,
  'planned-family': plannedFamily,
  'planned-school': plannedSchool,
  'report-not-started': reportNotStarted
};

const DOMAIN_IMAGES: Record<DomainKey, string> = {
  en: domainEn,
  zh: domainZh,
  ma: domainMa,
  se: domainSe
};

export function EmptyIllustration({ name }: { name: EmptyIllustrationName }) {
  return (
    <img
      className="empty-illustration"
      src={EMPTY_IMAGES[name]}
      width={480}
      height={480}
      loading="lazy"
      decoding="async"
      alt=""
      aria-hidden="true"
    />
  );
}

export function PhotoIllustration({
  domain,
  id = '',
  report = false
}: {
  domain?: DomainKey;
  id?: string;
  report?: boolean;
}) {
  const { t } = useI18n();
  const { domainShort } = useLabels();
  const fallback = Number.parseInt(id.replace(/\D/g, '').slice(-1) || '0', 10) % 2 ? outdoor : art;
  const src = domain ? DOMAIN_IMAGES[domain] : fallback;
  const label = domain ? domainShort(domain) : t('pages.shared.photoPlaceholder');

  return (
    <span className={`photo-illustration${report ? ' photo-illustration-report' : ''}`}>
      <img
        src={src}
        width={report ? 88 : 640}
        height={report ? 66 : 480}
        loading="lazy"
        decoding="async"
        alt={`${label} — ${t('pages.shared.sampleIllustration')}`}
      />
      <span className="photo-illustration-caption">{t('pages.shared.sampleIllustration')}</span>
    </span>
  );
}
