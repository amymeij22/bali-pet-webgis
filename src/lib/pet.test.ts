import { describe, expect, test } from 'vitest';
import { classifyPet, PET_COLORS, PET_RANGES } from '@/lib/pet';

describe('pet (production)', () => {
  test('temperate boundaries', () => {
    expect(classifyPet(4, 'temperate')).toBe('cold');
    expect(classifyPet(3.999, 'temperate')).toBe('very_cold');
    expect(classifyPet(41.001, 'temperate')).toBe('very_hot');
  });

  test('tropical boundaries', () => {
    expect(classifyPet(14, 'tropical')).toBe('cold');
    expect(classifyPet(13.999, 'tropical')).toBe('very_cold');
    expect(classifyPet(42.001, 'tropical')).toBe('very_hot');
  });

  test('non-finite returns neutral', () => {
    expect(classifyPet(Number.NaN, 'temperate')).toBe('neutral');
  });

  test('temperate covers all categories', () => {
    expect(classifyPet(100, 'temperate')).toBe('very_hot');
    expect(classifyPet(41, 'temperate')).toBe('hot');
    expect(classifyPet(36, 'temperate')).toBe('hot');
    expect(classifyPet(30, 'temperate')).toBe('warm');
    expect(classifyPet(24, 'temperate')).toBe('slight_warm');
    expect(classifyPet(20, 'temperate')).toBe('neutral');
    expect(classifyPet(14, 'temperate')).toBe('slight_cool');
    expect(classifyPet(10, 'temperate')).toBe('cool');
    expect(classifyPet(6, 'temperate')).toBe('cold');
    expect(classifyPet(-10, 'temperate')).toBe('very_cold');
  });

  test('tropical covers all categories', () => {
    expect(classifyPet(100, 'tropical')).toBe('very_hot');
    expect(classifyPet(42, 'tropical')).toBe('hot');
    expect(classifyPet(39, 'tropical')).toBe('hot');
    expect(classifyPet(35, 'tropical')).toBe('warm');
    expect(classifyPet(31, 'tropical')).toBe('slight_warm');
    expect(classifyPet(27, 'tropical')).toBe('neutral');
    expect(classifyPet(23, 'tropical')).toBe('slight_cool');
    expect(classifyPet(19, 'tropical')).toBe('cool');
    expect(classifyPet(15, 'tropical')).toBe('cold');
    expect(classifyPet(-10, 'tropical')).toBe('very_cold');
  });

  test('ranges/colors contain all keys used by UI', () => {
    expect(PET_COLORS.neutral).toBeTruthy();
    expect(PET_RANGES.temperate.neutral.label).toBe('Neutral');
    expect(PET_RANGES.tropical.neutral.labelId).toBe('Nyaman');
  });
});

