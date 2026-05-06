import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/components/ui/select', () => {
  return {
    Select: ({ onValueChange, children }: any) => (
      <div>
        <button onClick={() => onValueChange('xx')}>invalid</button>
        <button onClick={() => onValueChange('en')}>valid</button>
        {children}
      </div>
    ),
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children }: any) => <div>{children}</div>,
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: () => <span>value</span>,
  };
});

import { I18nProvider } from '@/lib/i18n';
import LanguageSelector from '@/components/controls/LanguageSelector';

describe('LanguageSelector onValueChange guard', () => {
  test('ignores unknown values and accepts en', () => {
    localStorage.clear();
    const { getByText } = render(
      <I18nProvider>
        <LanguageSelector />
      </I18nProvider>
    );

    fireEvent.click(getByText('invalid'));
    expect(localStorage.getItem('webgis_lang')).toBe(null);

    fireEvent.click(getByText('valid'));
    expect(localStorage.getItem('webgis_lang')).toBe('en');
  });
});

