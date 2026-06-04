import { calculateDistance, formatDistance, generateId } from '../../src/utils/helpers';

describe('helpers', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // 北京天安门到上海东方明珠的距离约为 1068 公里
      const distance = calculateDistance(
        39.9042, 116.4074, // 北京
        31.2397, 121.4998  // 上海
      );

      // 允许误差 10 公里
      expect(distance).toBeGreaterThan(1050 * 1000);
      expect(distance).toBeLessThan(1100 * 1000);
    });

    it('should return 0 for same point', () => {
      const distance = calculateDistance(
        39.9042, 116.4074,
        39.9042, 116.4074
      );

      expect(distance).toBe(0);
    });
  });

  describe('formatDistance', () => {
    it('should format meters correctly', () => {
      expect(formatDistance(500)).toBe('500米');
      expect(formatDistance(999)).toBe('999米');
    });

    it('should format kilometers correctly', () => {
      expect(formatDistance(1000)).toBe('1.0公里');
      expect(formatDistance(1500)).toBe('1.5公里');
      expect(formatDistance(10000)).toBe('10.0公里');
    });
  });

  describe('generateId', () => {
    it('should generate unique ids', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
    });

    it('should generate string ids', () => {
      const id = generateId();

      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });
});
