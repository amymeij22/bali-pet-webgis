import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { I18nProvider } from '@/lib/i18n';
import WeatherPopup from '@/components/popup/WeatherPopup';
import type { WeatherForecast } from '@/data/supabaseQueries';

vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    AreaChart: ({ children, onClick, data }: any) => {
      return (
        <div 
          data-testid="area-chart" 
          onClick={() => {
            if (onClick) {
              // 1. Cover happy path
              onClick({ activeTooltipIndex: 0 });
              // 2. Cover falsy state
              onClick(null);
              // 3. Cover activeTooltipIndex undefined
              onClick({});
              // 4. Cover activeTooltipIndex out of bounds
              onClick({ activeTooltipIndex: 99 });
            }
          }}
        >
          {children}
        </div>
      );
    },
    Area: ({ dot, activeDot }: any) => {
      return (
        <div data-testid="area-chart-area">
          {/* Render dot - truthy */}
          {dot && React.isValidElement(dot) 
            ? React.cloneElement(dot, { cx: 10, cy: 10, payload: { pet: 25 } } as any) 
            : null}
          {/* Render dot - falsy to cover the guard */}
          {dot && React.isValidElement(dot) 
            ? React.cloneElement(dot, { cx: null, cy: null, payload: { pet: 25 } } as any) 
            : null}
          
          {/* Render activeDot - truthy */}
          {activeDot && React.isValidElement(activeDot) 
            ? React.cloneElement(activeDot, { cx: 20, cy: 20, payload: { pet: 30 } } as any) 
            : null}
          {/* Render activeDot - falsy to cover the guard */}
          {activeDot && React.isValidElement(activeDot) 
            ? React.cloneElement(activeDot, { cx: null, cy: null, payload: { pet: 30 } } as any) 
            : null}
        </div>
      );
    },
    Tooltip: ({ content }: any) => {
      if (content) {
        const dummyPayload = [{ payload: { pet: 25, temp: 24, fullTimeLabel: '12:00 WITA' } }];
        
        // Render with active=true and valid payload
        const elActive = React.isValidElement(content) 
          ? React.cloneElement(content, { active: true, payload: dummyPayload } as any) 
          : null;
        
        // Render with active=false to cover the false branch
        const elInactive = React.isValidElement(content) 
          ? React.cloneElement(content, { active: false, payload: dummyPayload } as any) 
          : null;

        // Render with empty payload to cover the empty branch
        const elEmpty = React.isValidElement(content) 
          ? React.cloneElement(content, { active: true, payload: [] } as any) 
          : null;

        return (
          <div data-testid="tooltip-wrapper">
            {elActive}
            {elInactive}
            {elEmpty}
          </div>
        );
      }
      return <div data-testid="tooltip" />;
    },
    XAxis: () => <div data-testid="xaxis" />,
    YAxis: () => <div data-testid="yaxis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Line: () => <div data-testid="line" />,
  };
});


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

  test('toggling between current and trend tabs and clicking on area chart works', () => {
    const times = [
      '2026-01-01T12:00:00.000Z',
      '2026-01-01T15:00:00.000Z',
    ];
    const timeChangeCalls: string[] = [];

    render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test Destination"
          heroImageUrl={null}
          villageName="Test Village"
          villageId="v1"
          forecast={makeForecast({ forecast_time: times[0] })}
          currentTime={times[0]}
          times={times}
          standard="temperate"
          onClose={() => {}}
          onTimeChange={(t) => timeChangeCalls.push(t)}
          forecastList={[
            makeForecast({ forecast_time: times[0], temperature: 26, pet_value: 26 }),
            makeForecast({ forecast_time: times[1], temperature: 28, pet_value: 28 }),
          ]}
        />
      </I18nProvider>
    );

    // Default tab is 'current'. Let's verify we see the weather grid.
    expect(document.body.textContent).toContain('26°C');

    // Find and click the Trend tab button
    const trendBtn = screen.getByText(/Trend|Tren/i);
    fireEvent.click(trendBtn);

    // Verify we are now on the trend tab and Recharts elements are rendered
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart-area')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-wrapper')).toBeInTheDocument();

    // Click on the AreaChart to trigger the mocked click handler
    const chart = screen.getByTestId('area-chart');
    fireEvent.click(chart);

    // The mock click triggers onTimeChange with the first item's forecast time
    expect(timeChangeCalls).toEqual([times[0]]);

    // Go back to the Current tab
    const currentBtn = screen.getByText(/Weather Details|Detail Cuaca/i);
    fireEvent.click(currentBtn);

    // Verify we are back on the current tab (grid items visible)
    expect(document.body.textContent).toContain('26°C');
  });

  test('renders empty state when chartData is empty in trend tab', () => {
    render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test Destination"
          heroImageUrl={null}
          villageName="Test Village"
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

    const trendBtn = screen.getByText(/Trend|Tren/i);
    fireEvent.click(trendBtn);

    // Verify empty state message is shown
    expect(document.body.textContent).toContain('Data prakiraan belum tersedia');
  });

  test('renders trend tab with single forecast item and toggling language covers gradient and label branches', () => {
    // 1. English language
    localStorage.setItem('webgis_lang', 'en');
    const times = ['2026-01-01T12:00:00.000Z'];
    const { unmount } = render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test Destination"
          heroImageUrl={null}
          villageName="Test Village"
          villageId="v1"
          forecast={makeForecast({ forecast_time: times[0] })}
          currentTime={times[0]}
          times={times}
          standard="temperate"
          onClose={() => {}}
          onTimeChange={() => {}}
          forecastList={[makeForecast({ forecast_time: times[0], temperature: 26, pet_value: 26 })]}
        />
      </I18nProvider>
    );

    const trendBtn1 = screen.getByText(/Trend|Tren/i);
    fireEvent.click(trendBtn1);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    unmount();

    // 2. Indonesian language
    localStorage.setItem('webgis_lang', 'id');
    render(
      <I18nProvider>
        <WeatherPopup
          destinationName="Test Destination"
          heroImageUrl={null}
          villageName="Test Village"
          villageId="v1"
          forecast={makeForecast({ forecast_time: times[0] })}
          currentTime={times[0]}
          times={times}
          standard="temperate"
          onClose={() => {}}
          onTimeChange={() => {}}
          forecastList={[makeForecast({ forecast_time: times[0], temperature: 26, pet_value: 26 })]}
        />
      </I18nProvider>
    );

    const trendBtn2 = screen.getByText(/Trend|Tren/i);
    fireEvent.click(trendBtn2);
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });
});

