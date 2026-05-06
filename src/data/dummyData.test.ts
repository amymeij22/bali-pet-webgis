import { describe, expect, test } from 'vitest';
import {
  classifyPet,
  formatPetClassRange,
  generateWeatherForecasts,
  getForecast,
  getForecastsByTime,
  getThermalCategory,
  getVillageById,
  getVillageByKdebps,
  WEATHER_FORECASTS,
  VILLAGES,
} from '@/data/dummyData';

describe('classifyPet', () => {
  test('temperate boundaries are consistent', () => {
    expect(classifyPet(4, 'temperate')).toBe('cold');
    expect(classifyPet(3.999, 'temperate')).toBe('very_cold');
    expect(classifyPet(8, 'temperate')).toBe('cool');
    expect(classifyPet(13, 'temperate')).toBe('slight_cool');
    expect(classifyPet(18, 'temperate')).toBe('neutral');
    expect(classifyPet(23, 'temperate')).toBe('slight_warm');
    expect(classifyPet(29, 'temperate')).toBe('warm');
    expect(classifyPet(35, 'temperate')).toBe('hot');
    expect(classifyPet(41, 'temperate')).toBe('hot');
    expect(classifyPet(41.001, 'temperate')).toBe('very_hot');
  });

  test('tropical boundaries are consistent', () => {
    expect(classifyPet(14, 'tropical')).toBe('cold');
    expect(classifyPet(13.999, 'tropical')).toBe('very_cold');
    expect(classifyPet(18, 'tropical')).toBe('cool');
    expect(classifyPet(22, 'tropical')).toBe('slight_cool');
    expect(classifyPet(26, 'tropical')).toBe('neutral');
    expect(classifyPet(30, 'tropical')).toBe('slight_warm');
    expect(classifyPet(34, 'tropical')).toBe('warm');
    expect(classifyPet(38, 'tropical')).toBe('hot');
    expect(classifyPet(42, 'tropical')).toBe('hot');
    expect(classifyPet(42.001, 'tropical')).toBe('very_hot');
  });

  test('non-finite returns neutral', () => {
    expect(classifyPet(Number.NaN, 'temperate')).toBe('neutral');
  });
});

describe('dummyData helpers', () => {
  test('getForecast returns forecast for village+time', () => {
    const sample = WEATHER_FORECASTS[0];
    expect(sample).toBeTruthy();
    const found = getForecast(sample.village_id, sample.forecast_time);
    expect(found?.id).toBe(sample.id);
  });

  test('getForecastsByTime returns map keyed by village_id', () => {
    const sample = WEATHER_FORECASTS[0];
    const map = getForecastsByTime(sample.forecast_time);
    expect(map.get(sample.village_id)?.forecast_time).toBe(sample.forecast_time);
  });

  test('getVillageByKdebps and getVillageById find village', () => {
    const v = VILLAGES[0];
    expect(getVillageByKdebps(v.kdebps)?.id).toBe(v.id);
    expect(getVillageById(v.id)?.kdebps).toBe(v.kdebps);
  });

  test('getThermalCategory selects by standard', () => {
    const sample = WEATHER_FORECASTS[0];
    expect(getThermalCategory(sample, 'temperate')).toBe(sample.thermal_category_temperate);
    expect(getThermalCategory(sample, 'tropical')).toBe(sample.thermal_category_tropical);
  });

  test('formatPetClassRange uses ∞ when max=999', () => {
    expect(formatPetClassRange('temperate', 'very_hot')).toContain('∞');
    expect(formatPetClassRange('temperate', 'hot')).not.toContain('∞');
  });

  test('generateWeatherForecasts runs and returns non-empty list', () => {
    const list = generateWeatherForecasts();
    expect(list.length).toBeGreaterThan(0);
  });
});

