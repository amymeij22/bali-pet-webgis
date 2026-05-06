import { render } from '@testing-library/react';
import { describe, test, vi } from 'vitest';

vi.mock('framer-motion', async () => {
  const actual: any = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

import { I18nProvider } from '@/lib/i18n';
import WeatherPopup from '@/components/popup/WeatherPopup';

describe('WeatherPopup reduced motion', () => {
  test('renders with reduceMotion=true path', () => {
    render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test"
          heroImageUrl={null}
          villageName="Village"
          villageId="v1"
          forecast={null}
          currentTime=""
          times={[]}
          standard="temperate"
          onClose={() => {}}
          onTimeChange={() => {}}
        />
      </I18nProvider>
    );
  });
});

