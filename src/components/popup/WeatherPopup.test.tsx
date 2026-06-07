import { fireEvent, render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { I18nProvider } from '@/lib/i18n';
import WeatherPopup from '@/components/popup/WeatherPopup';
import type { WeatherForecast } from '@/data/supabaseQueries';

describe('WeatherPopup hero image', () => {
  test('normalizes signed supabase storage URL to public URL without query', () => {
    const signed =
      'https://xyz.supabase.co/storage/v1/object/sign/destinations/a.webp?token=abc&expires=123';

    render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test"
          heroImageUrl={signed}
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

    const img = document.querySelector('img');
    expect(img).toBeTruthy();
    expect(img).toHaveAttribute(
      'src',
      'https://xyz.supabase.co/storage/v1/object/public/destinations/a.webp'
    );
  });

  test('falls back to default hero image on load error', () => {
    render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test"
          heroImageUrl="https://example.com/broken.webp"
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

    const img = document.querySelector('img');
    expect(img).toBeTruthy();
    fireEvent.error(img);
    expect(img.getAttribute('src') ?? '').toBe('/image-fallback.webp');
  });

  test('does not change hero when already using fallback', () => {
    render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test"
          heroImageUrl=""
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
    const img = document.querySelector('img')!;
    const before = img.getAttribute('src');
    fireEvent.error(img);
    expect(img.getAttribute('src')).toBe(before);
  });
});

describe('WeatherPopup interactions', () => {
  function makeForecast(overrides?: Partial<WeatherForecast>): WeatherForecast {
    return {
      id: 'f1',
      destination_id: 'd1',
      batch_id: 'b1',
      forecast_time: '2026-01-01T15:00:00.000Z',
      temperature: 26,
      humidity: 70,
      wind_speed: 10,
      wind_direction: '90',
      weather_condition: 'Clear',
      visibility: '10',
      pet_value: 26,
      temperate_thermal_category: null,
      sub_tropic_thermal_category: null,
      ...overrides,
    };
  }

  test('prev/next time buttons call onTimeChange', () => {
    const calls: string[] = [];
    const times = [
      '2026-01-01T12:00:00.000Z',
      '2026-01-01T15:00:00.000Z',
      '2026-01-01T18:00:00.000Z',
    ];
    render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test"
          heroImageUrl={null}
          villageName="Village"
          villageId="v1"
          forecast={makeForecast({ forecast_time: times[1] })}
          currentTime={times[1]}
          times={times}
          standard="temperate"
          onClose={() => {}}
          onTimeChange={(t) => calls.push(t)}
        />
      </I18nProvider>
    );

    // query by aria-label text from i18n (en/id both exist); use attribute search for stability
    const btnPrev = document.querySelector('button[aria-label="Previous time"],button[aria-label="Waktu sebelumnya"]') as HTMLButtonElement;
    const btnNext = document.querySelector('button[aria-label="Next time"],button[aria-label="Waktu berikutnya"]') as HTMLButtonElement;
    expect(btnPrev).toBeTruthy();
    expect(btnNext).toBeTruthy();

    fireEvent.click(btnPrev);
    fireEvent.click(btnNext);
    expect(calls).toEqual([times[0], times[2]]);
  });

  test('handlePrev/handleNext no-op at edges', () => {
    const times = ['2026-01-01T12:00:00.000Z', '2026-01-01T15:00:00.000Z'];

    // at first index: prev is edge
    const callsPrev: string[] = [];
    render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test"
          heroImageUrl={null}
          villageName="Village"
          villageId="v1"
          forecast={makeForecast({ forecast_time: times[0] })}
          currentTime={times[0]}
          times={times}
          standard="temperate"
          onClose={() => {}}
          onTimeChange={(t) => callsPrev.push(t)}
        />
      </I18nProvider>
    );

    const btnPrev = document.querySelector('button[aria-label="Previous time"],button[aria-label="Waktu sebelumnya"]') as HTMLButtonElement;

    // Force click to call handler even though disabled (we only want to exercise the guard)
    btnPrev.disabled = false;
    btnPrev.removeAttribute('disabled');
    btnPrev.style.pointerEvents = 'auto';
    btnPrev.click();
    expect(callsPrev).toEqual([]);

    // at last index: next is edge
    const callsNext: string[] = [];
    render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test"
          heroImageUrl={null}
          villageName="Village"
          villageId="v1"
          forecast={makeForecast({ forecast_time: times[1] })}
          currentTime={times[1]}
          times={times}
          standard="temperate"
          onClose={() => {}}
          onTimeChange={(t) => callsNext.push(t)}
        />
      </I18nProvider>
    );

    const btnNext = document.querySelector('button[aria-label="Next time"],button[aria-label="Waktu berikutnya"]') as HTMLButtonElement;
    btnNext.disabled = false;
    btnNext.removeAttribute('disabled');
    btnNext.style.pointerEvents = 'auto';
    btnNext.click();
    expect(callsNext).toEqual([]);
  });

  test('handlePrev/handleNext no-op when times is empty (currentIndex=-1)', () => {
    const calls: string[] = [];
    render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test"
          heroImageUrl={null}
          villageName="Village"
          villageId="v1"
          forecast={makeForecast()}
          currentTime="2026-01-01T15:00:00.000Z"
          times={[]}
          standard="temperate"
          onClose={() => {}}
          onTimeChange={(t) => calls.push(t)}
        />
      </I18nProvider>
    );

    const btnPrev = document.querySelector('button[aria-label="Previous time"],button[aria-label="Waktu sebelumnya"]') as HTMLButtonElement;
    const btnNext = document.querySelector('button[aria-label="Next time"],button[aria-label="Waktu berikutnya"]') as HTMLButtonElement;
    btnPrev.disabled = false;
    btnPrev.removeAttribute('disabled');
    btnPrev.style.pointerEvents = 'auto';
    btnNext.disabled = false;
    btnNext.removeAttribute('disabled');
    btnNext.style.pointerEvents = 'auto';

    btnPrev.click();
    btnNext.click();
    expect(calls).toEqual([]);
  });

  test('multi-destination select triggers onDestinationChange', () => {
    const calls: string[] = [];
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
          destinations={[
            { id: 'a', name: 'A' },
            { id: 'b', name: 'B' },
          ]}
          selectedDestinationId="a"
          onDestinationChange={(id) => calls.push(id)}
        />
      </I18nProvider>
    );

    const sel = document.querySelector('select') as HTMLSelectElement;
    expect(sel).toBeTruthy();
    fireEvent.change(sel, { target: { value: 'b' } });
    expect(calls).toEqual(['b']);
  });

  test('multi-destination select defaults to first destination when selectedDestinationId is missing', () => {
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
          destinations={[
            { id: 'a', name: 'A' },
            { id: 'b', name: 'B' },
          ]}
        />
      </I18nProvider>
    );

    const sel = document.querySelector('select') as HTMLSelectElement;
    expect(sel.value).toBe('a');
  });

  test('wind direction numeric becomes cardinal+degrees and visibility numeric adds km', () => {
    render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test"
          heroImageUrl={null}
          villageName="Village"
          villageId="v1"
          forecast={makeForecast({ wind_direction: '90', visibility: '12' })}
          currentTime="2026-01-01T15:00:00.000Z"
          times={['2026-01-01T15:00:00.000Z']}
          standard="temperate"
          onClose={() => {}}
          onTimeChange={() => {}}
        />
      </I18nProvider>
    );

    expect(document.body.textContent).toContain('E (90°)');
    expect(document.body.textContent).toContain('12 km');
  });

  test('wind direction textual is shown as-is; visibility with units is kept', () => {
    render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test"
          heroImageUrl={null}
          villageName="Village"
          villageId="v1"
          forecast={makeForecast({ wind_direction: 'Barat', visibility: '8 km' })}
          currentTime="2026-01-01T15:00:00.000Z"
          times={['2026-01-01T15:00:00.000Z']}
          standard="temperate"
          onClose={() => {}}
          onTimeChange={() => {}}
        />
      </I18nProvider>
    );
    expect(document.body.textContent).toContain('Barat');
    expect(document.body.textContent).toContain('8 km');
  });

  test('wind direction negative degrees wraps correctly; visibility non-numeric stays raw', () => {
    render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test"
          heroImageUrl={null}
          villageName="Village"
          villageId="v1"
          forecast={makeForecast({ wind_direction: '-90', visibility: 'unknown' })}
          currentTime="2026-01-01T15:00:00.000Z"
          times={['2026-01-01T15:00:00.000Z']}
          standard="temperate"
          onClose={() => {}}
          onTimeChange={() => {}}
        />
      </I18nProvider>
    );
    expect(document.body.textContent).toContain('W (270°)');
    expect(document.body.textContent).toContain('unknown');
  });

  test('visibility non-finite numeric returns raw', () => {
    render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test"
          heroImageUrl={null}
          villageName="Village"
          villageId="v1"
          // '++' is not numeric, and does not include letters => hits Number.isFinite branch.
          forecast={makeForecast({ visibility: '++' })}
          currentTime="2026-01-01T15:00:00.000Z"
          times={['2026-01-01T15:00:00.000Z']}
          standard="temperate"
          onClose={() => {}}
          onTimeChange={() => {}}
        />
      </I18nProvider>
    );
    expect(document.body.textContent).toContain('++');
  });

  test('English UI uses label (not labelId) + km/h', () => {
    localStorage.setItem('webgis_lang', 'en');

    render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test"
          heroImageUrl={null}
          villageName="Village"
          villageId="v1"
          forecast={makeForecast({ pet_value: 20 })}
          currentTime="2026-01-01T15:00:00.000Z"
          times={['2026-01-01T15:00:00.000Z']}
          standard="temperate"
          onClose={() => {}}
          onTimeChange={() => {}}
        />
      </I18nProvider>
    );

    expect(document.body.textContent).toContain('Neutral');
    expect(document.body.textContent).toContain('km/h');
  });

  test('Indonesian UI uses labelId + km/jam and falls back to not_available for empty wind/visibility', () => {
    localStorage.setItem('webgis_lang', 'id');

    render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test"
          heroImageUrl={null}
          villageName="Village"
          villageId="v1"
          forecast={makeForecast({ pet_value: 20, wind_direction: '', visibility: '' })}
          currentTime="2026-01-01T15:00:00.000Z"
          times={['2026-01-01T15:00:00.000Z']}
          standard="temperate"
          onClose={() => {}}
          onTimeChange={() => {}}
        />
      </I18nProvider>
    );

    // labelId (Indonesian) for neutral is "Nyaman"
    expect(document.body.textContent).toContain('Nyaman');
    expect(document.body.textContent).toContain('km/jam');
    // not available text in Indonesian dictionary
    expect(document.body.textContent).toContain('Belum tersedia');
  });
});

