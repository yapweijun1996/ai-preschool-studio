import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { AppShell } from '../components/AppShell';
import { useI18n } from '../i18n';
import { isChunkLoadError, reloadForChunkFailure } from './chunkRecovery';

type Props = { children: ReactNode; resetKey: string };
type State = { failed: boolean };

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State { return { failed: true }; }

  componentDidUpdate(previousProps: Props): void {
    if (this.state.failed && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  componentDidCatch(error: Error, _info: ErrorInfo): void {
    if (isChunkLoadError(error)) reloadForChunkFailure();
  }

  render() {
    return this.state.failed ? <RouteLoadRecovery /> : this.props.children;
  }
}

function RouteLoadRecovery() {
  const { t } = useI18n();
  useEffect(() => { window.dispatchEvent(new Event('route-content-ready')); }, []);
  return <AppShell module="students" mobileTitle={t('shell.routeLoad.title')}>
    {() => <section className="page" role="alert">
      <div className="card card-pad stack">
        <h1 className="h1">{t('shell.routeLoad.title')}</h1>
        <div><button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>{t('shell.routeLoad.reload')}</button></div>
      </div>
    </section>}
  </AppShell>;
}
