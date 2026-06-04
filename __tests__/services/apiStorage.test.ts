import { ApiStorageService } from '../../src/services/apiStorage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('ApiStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveProvider', () => {
    it('should return "amap" as default when no provider is set', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValue(null);

      // Act
      const result = await ApiStorageService.getActiveProvider();

      // Assert
      expect(result).toBe('amap');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@favmap_active_provider');
    });

    it('should return the stored provider when set', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockResolvedValue('tencent');

      // Act
      const result = await ApiStorageService.getActiveProvider();

      // Assert
      expect(result).toBe('tencent');
    });
  });

  describe('setActiveProvider', () => {
    it('should save the provider to storage', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.setItem.mockResolvedValue(undefined);

      // Act
      await ApiStorageService.setActiveProvider('baidu');

      // Assert
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@favmap_active_provider', 'baidu');
    });
  });

  describe('saveApiKey', () => {
    it('should save the API key with correct storage key', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.setItem.mockResolvedValue(undefined);

      // Act
      await ApiStorageService.saveApiKey('amap_web', 'test-api-key');

      // Assert
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@favmap_api_amap_web_key', 'test-api-key');
    });
  });

  describe('getProviderConfig', () => {
    it('should return provider config with API keys from storage', async () => {
      // Arrange
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      AsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === '@favmap_api_amap_js_key') return Promise.resolve('js-api-key');
        if (key === '@favmap_api_amap_js_security') return Promise.resolve('security-code');
        if (key === '@favmap_api_amap_web_key') return Promise.resolve('web-api-key');
        return Promise.resolve(null);
      });

      // Act
      const config = await ApiStorageService.getProviderConfig('amap');

      // Assert
      expect(config.id).toBe('amap');
      expect(config.name).toBe('高德地图');
      expect(config.apis).toHaveLength(2);

      const jsApi = config.apis.find((api) => api.id === 'amap_js');
      expect(jsApi?.apiKey).toBe('js-api-key');
      expect(jsApi?.securityCode).toBe('security-code');

      const webApi = config.apis.find((api) => api.id === 'amap_web');
      expect(webApi?.apiKey).toBe('web-api-key');
    });
  });
});
