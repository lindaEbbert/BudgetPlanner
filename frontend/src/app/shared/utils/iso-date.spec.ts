import { fromIsoDate, toIsoDate } from './iso-date';

// Node picks up a changed TZ at runtime, so one run covers both sides of UTC.
function inTimeZone(timeZone: string, specs: () => void): void {
  describe(`in ${timeZone}`, () => {
    beforeEach(() => vi.stubEnv('TZ', timeZone));
    afterEach(() => vi.unstubAllEnvs());
    specs();
  });
}

describe('toIsoDate', () => {
  inTimeZone('Europe/Berlin', () => {
    it('keeps the day of a date picked at local midnight', () => {
      expect(toIsoDate(new Date(2026, 8, 30))).toBe('2026-09-30');
    });

    it('keeps the day shortly after local midnight', () => {
      expect(toIsoDate(new Date(2026, 8, 30, 0, 30))).toBe('2026-09-30');
    });
  });

  inTimeZone('America/New_York', () => {
    it('keeps the day of a date picked at local midnight', () => {
      expect(toIsoDate(new Date(2026, 8, 30))).toBe('2026-09-30');
    });

    it('keeps the day shortly after local midnight', () => {
      expect(toIsoDate(new Date(2026, 8, 30, 0, 30))).toBe('2026-09-30');
    });

    it('keeps the day late in the evening', () => {
      expect(toIsoDate(new Date(2026, 8, 30, 23, 30))).toBe('2026-09-30');
    });
  });
});

describe('fromIsoDate', () => {
  for (const timeZone of ['Europe/Berlin', 'America/New_York']) {
    inTimeZone(timeZone, () => {
      it('shows the stored day in the date picker', () => {
        const date = fromIsoDate('2026-09-30');
        expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 8, 30]);
      });
    });
  }
});
