import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/app.css';
import { loadInitialLanguage } from './i18n';
import { installChunkFailureRecovery } from './routes/chunkRecovery';
import { pageKindForPath, pageLoaders } from './routes/lazyPages';

installChunkFailureRecovery();
const initialHashPath = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '/';
const initialKind = pageKindForPath(initialHashPath.split('?')[0] || '/');
const [{ lang, dict }] = await Promise.all([
  loadInitialLanguage(),
  initialKind ? pageLoaders[initialKind]().then(() => undefined, () => undefined) : Promise.resolve()
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialLang={lang} initialDict={dict} />
  </StrictMode>
);
