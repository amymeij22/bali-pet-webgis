import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { I18nProvider } from '@/lib/i18n';
import LanguageSelector from '@/components/controls/LanguageSelector';

describe('LanguageSelector', () => {
  test('changes language and persists to localStorage', async () => {
    localStorage.clear();
    const user = userEvent.setup();

    render(
      <I18nProvider>
        <LanguageSelector />
      </I18nProvider>
    );

    // open select
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: /English/i }));

    expect(localStorage.getItem('webgis_lang')).toBe('en');
  });
});

