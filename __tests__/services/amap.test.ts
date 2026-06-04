import { AMapService } from '../../src/services/amap';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock ApiStorageService
jest.mock('../../src/services/apiStorage', () => ({
  ApiStorageService: {
    getProviderConfig: jest.fn(),
  },
}));

// Mock global fetch
(globalThis as any).fetch = jest.fn();

describe('AMapService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getApiKey', () => {
    it('should return web API key when available', async () => {
      // Arrange
      const { ApiStorageService } = require('../../src/services/apiStorage');
      ApiStorageService.getProviderConfig.mockResolvedValue({
        id: 'amap',
        name: '高德地图',
        apis: [
          { id: 'amap_js', apiKey: 'js-key', type: 'map' },
          { id: 'amap_web', apiKey: 'web-key', type: 'search' },
        ],
      });

      // Act
      const result = await AMapService.getApiKey();

      // Assert
      expect(result).toBe('web-key');
    });

    it('should fallback to JS API key when web key is not available', async () => {
      // Arrange
      const { ApiStorageService } = require('../../src/services/apiStorage');
      ApiStorageService.getProviderConfig.mockResolvedValue({
        id: 'amap',
        name: '高德地图',
        apis: [
          { id: 'amap_js', apiKey: 'js-key', type: 'map' },
          { id: 'amap_web', apiKey: '', type: 'search' },
        ],
      });

      // Act
      const result = await AMapService.getApiKey();

      // Assert
      expect(result).toBe('js-key');
    });

    it('should return empty string when no API key is configured', async () => {
      // Arrange
      const { ApiStorageService } = require('../../src/services/apiStorage');
      ApiStorageService.getProviderConfig.mockResolvedValue({
        id: 'amap',
        name: '高德地图',
        apis: [
          { id: 'amap_js', apiKey: '', type: 'map' },
          { id: 'amap_web', apiKey: '', type: 'search' },
        ],
      });

      // Act
      const result = await AMapService.getApiKey();

      // Assert
      expect(result).toBe('');
    });
  });

  describe('searchKeyword', () => {
    it('should return empty array when API key is not configured', async () => {
      // Arrange
      const { ApiStorageService } = require('../../src/services/apiStorage');
      ApiStorageService.getProviderConfig.mockResolvedValue({
        id: 'amap',
        name: '高德地图',
        apis: [
          { id: 'amap_js', apiKey: '', type: 'map' },
          { id: 'amap_web', apiKey: '', type: 'search' },
        ],
      });

      // Act
      const result = await AMapService.searchKeyword('酒店');

      // Assert
      expect(result).toEqual([]);
    });

    it('should return search results when API call succeeds', async () => {
      // Arrange
      const { ApiStorageService } = require('../../src/services/apiStorage');
      ApiStorageService.getProviderConfig.mockResolvedValue({
        id: 'amap',
        name: '高德地图',
        apis: [
          { id: 'amap_js', apiKey: '', type: 'map' },
          { id: 'amap_web', apiKey: 'test-key', type: 'search' },
        ],
      });

      const mockResponse = {
        status: '1',
        info: 'OK',
        infocode: '10000',
        pois: [
          {
            id: '1',
            name: '测试酒店',
            address: '测试地址',
            location: '116.4074,39.9042',
            biz_ext: { rating: '4.5' },
            type: '酒店',
          },
        ],
      };

      ((globalThis as any).fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      // Act
      const result = await AMapService.searchKeyword('酒店');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('测试酒店');
      expect(result[0].address).toBe('测试地址');
      expect(result[0].coordinate.latitude).toBe(39.9042);
      expect(result[0].coordinate.longitude).toBe(116.4074);
      expect(result[0].rating).toBe(4.5);
    });

    it('should throw error when API returns error status', async () => {
      // Arrange
      const { ApiStorageService } = require('../../src/services/apiStorage');
      ApiStorageService.getProviderConfig.mockResolvedValue({
        id: 'amap',
        name: '高德地图',
        apis: [
          { id: 'amap_js', apiKey: '', type: 'map' },
          { id: 'amap_web', apiKey: 'test-key', type: 'search' },
        ],
      });

      const mockResponse = {
        status: '0',
        info: 'INVALID_USER_KEY',
        infocode: '10001',
      };

      ((globalThis as any).fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      // Act & Assert
      await expect(AMapService.searchKeyword('酒店')).rejects.toThrow('API Key 不正确或未配置');
    });
  });
});
