import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateGroup,
  CATEGORIES,
  categoryDots,
  typeConfig,
  STORAGE_KEYS,
} from '@/lib/constants';

describe('constants', () => {
  describe('STORAGE_KEYS', () => {
    it('has expected keys', () => {
      expect(STORAGE_KEYS.WALKTHROUGH_CREATE_DONE).toBe('splitup_walkthrough_create_done');
      expect(STORAGE_KEYS.ONBOARDING_COMPLETED).toBe('splitup_onboarding_completed');
    });
  });

  describe('typeConfig', () => {
    it('has pg, hostel, trip entries', () => {
      expect(typeConfig.pg).toBeDefined();
      expect(typeConfig.hostel).toBeDefined();
      expect(typeConfig.trip).toBeDefined();
    });
  });

  describe('CATEGORIES', () => {
    it('has 8 categories', () => {
      expect(CATEGORIES).toHaveLength(8);
    });

    it('contains expected categories', () => {
      expect(CATEGORIES).toContain('Food');
      expect(CATEGORIES).toContain('Rent');
      expect(CATEGORIES).toContain('Other');
    });
  });

  describe('categoryDots', () => {
    it('has a dot color for every category', () => {
      for (const cat of CATEGORIES) {
        expect(categoryDots[cat]).toBeDefined();
        expect(typeof categoryDots[cat]).toBe('string');
      }
    });

    it('does not have extra keys beyond CATEGORIES', () => {
      const extraKeys = Object.keys(categoryDots).filter(
        (k) => !(CATEGORIES as readonly string[]).includes(k)
      );
      expect(extraKeys).toHaveLength(0);
    });
  });

  describe('formatDate', () => {
    it('formats without year by default', () => {
      const result = formatDate('2025-03-15T10:30:00Z');
      expect(result).not.toMatch(/2025/);
      expect(result).toMatch(/\d{1,2}\s\w{3}/);
    });

    it('formats with year when includeYear=true', () => {
      const result = formatDate('2025-03-15T10:30:00Z', true);
      expect(result).toMatch(/2025/);
    });
  });

  describe('formatDateGroup', () => {
    it('returns "Today" for current date', () => {
      const now = new Date().toISOString();
      expect(formatDateGroup(now)).toBe('Today');
    });

    it('returns "Yesterday" for previous date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatDateGroup(yesterday.toISOString())).toBe('Yesterday');
    });

    it('returns formatted date string for older dates', () => {
      const result = formatDateGroup('2023-06-01T00:00:00Z');
      expect(result).not.toBe('Today');
      expect(result).not.toBe('Yesterday');
      expect(result).toMatch(/\d{1,2}\s\w{3}\s\d{4}/);
    });
  });
});
