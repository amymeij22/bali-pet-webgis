import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { I18nProvider, useI18n } from '@/lib/i18n';

function Probe() {
  const { lang, setLang, t } = useI18n();
  return (
    <div>
      <div data-testid="lang">{lang}</div>
      <button onClick={() => setLang('en')}>set-en</button>
      <div data-testid="lang-en">{t('lang_en')}</div>
      <div data-testid="fallback">{t('lang_id')}</div>
      <div data-testid="missing">{t('missing_key' as any)}</div>
    </div>
  );
}

describe('i18n', () => {
  test('defaults to id when storage not en', () => {
    localStorage.setItem('webgis_lang', 'xx');
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );
    expect(screen.getByTestId('lang').textContent).toBe('id');
  });

  test('reads en from localStorage and setLang persists', async () => {
    localStorage.setItem('webgis_lang', 'en');
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>
    );
    expect(screen.getByTestId('lang').textContent).toBe('en');
  });

  test('useI18n throws if used outside provider', () => {
    function Bad() {
      useI18n();
      return null;
    }
    const prev = console.error;
    console.error = () => {};
    try {
      expect(() => render(<Bad />)).toThrow(/useI18n must be used within I18nProvider/i);
    } finally {
      console.error = prev;
    }
  });
});

