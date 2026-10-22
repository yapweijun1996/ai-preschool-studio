import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider, useI18n } from '../src/i18n';
import { en } from '../src/i18n/locales/en';

function LanguageProbe() {
  const { lang, setLang } = useI18n();
  return <div>
    <span data-testid="lang">{lang}</span>
    <button onClick={() => setLang('zh')}>Chinese</button>
    <button onClick={() => setLang('en')}>English</button>
  </div>;
}

describe('language request cancellation', () => {
  it('cancels zh when English is selected again before the dictionary finishes loading', async () => {
    render(<I18nProvider initial="en" initialDict={en}><LanguageProbe /></I18nProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Chinese' }));
    await new Promise((resolve) => window.setTimeout(resolve, 60));
    fireEvent.click(screen.getByRole('button', { name: 'English' }));

    await waitFor(() => expect(screen.getByTestId('lang').textContent).toBe('en'));
    await new Promise((resolve) => window.setTimeout(resolve, 200));
    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });
});
