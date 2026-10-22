import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/app.css';
import { loadDict, loadInitialLanguage } from './i18n';
import { installChunkFailureRecovery } from './routes/chunkRecovery';
import { pageKindForPath, pageLoaders } from './routes/lazyPages';

installChunkFailureRecovery();

function showStaticRecovery() {
  const root = document.getElementById('root');
  if (!root) return;
  const alert = document.createElement('main');
  alert.setAttribute('role', 'alert');
  const heading = document.createElement('h1');
  heading.textContent = 'The app could not load. Reload to try again.';
  const reload = document.createElement('button');
  reload.type = 'button';
  reload.textContent = 'Reload';
  reload.addEventListener('click', () => window.location.reload());
  alert.append(heading, reload);
  root.replaceChildren(alert);
}

async function startApp() {
  const initialHashPath = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '/';
  const initialKind = pageKindForPath(initialHashPath.split('?')[0] || '/');
  const initialLanguage = loadInitialLanguage().then(
    ({ lang, dict }) => ({ lang, dict, languageLoadError: false }),
    async () => ({ lang: 'en' as const, dict: await loadDict('en'), languageLoadError: true })
  );
  try {
    const [{ lang, dict, languageLoadError }] = await Promise.all([
      initialLanguage,
      initialKind ? pageLoaders[initialKind]().then(() => undefined, () => undefined) : Promise.resolve()
    ]);
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App initialLang={lang} initialDict={dict} initialLanguageLoadError={languageLoadError} />
      </StrictMode>
    );
  } catch {
    showStaticRecovery();
  }
}

void startApp();
