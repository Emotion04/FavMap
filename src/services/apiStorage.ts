import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapProvider, ApiConfig, MapProviderConfig } from '../types';
import { MAP_PROVIDERS } from '../config/apiConfig';

// 存储键前缀
const STORAGE_PREFIX = '@favmap_api_';

// API 存储服务
export const ApiStorageService = {
  // 获取指定提供商的 API 配置
  async getProviderConfig(provider: MapProvider): Promise<MapProviderConfig> {
    try {
      const config = MAP_PROVIDERS.find((p) => p.id === provider);
      if (!config) throw new Error(`Unknown provider: ${provider}`);

      // 加载存储的 API Key
      const apis = await Promise.all(
        config.apis.map(async (api) => {
          const apiKey = await AsyncStorage.getItem(`${STORAGE_PREFIX}${api.id}_key`);
          const securityCode = await AsyncStorage.getItem(`${STORAGE_PREFIX}${api.id}_security`);
          return {
            ...api,
            apiKey: apiKey || '',
            securityCode: securityCode || '',
          };
        })
      );

      return { ...config, apis };
    } catch (error) {
      console.error('获取提供商配置失败:', error);
      return MAP_PROVIDERS.find((p) => p.id === provider) || MAP_PROVIDERS[0];
    }
  },

  // 获取所有提供商配置
  async getAllProviderConfigs(): Promise<MapProviderConfig[]> {
    try {
      return await Promise.all(
        MAP_PROVIDERS.map((provider) => this.getProviderConfig(provider.id))
      );
    } catch (error) {
      console.error('获取所有提供商配置失败:', error);
      return MAP_PROVIDERS;
    }
  },

  // 保存 API Key
  async saveApiKey(apiId: string, apiKey: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`${STORAGE_PREFIX}${apiId}_key`, apiKey);
    } catch (error) {
      console.error('保存 API Key 失败:', error);
      throw error;
    }
  },

  // 保存安全密钥
  async saveSecurityCode(apiId: string, securityCode: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`${STORAGE_PREFIX}${apiId}_security`, securityCode);
    } catch (error) {
      console.error('保存安全密钥失败:', error);
      throw error;
    }
  },

  // 保存单个 API 配置
  async saveApiConfig(apiId: string, apiKey: string, securityCode?: string): Promise<void> {
    try {
      await this.saveApiKey(apiId, apiKey);
      if (securityCode !== undefined) {
        await this.saveSecurityCode(apiId, securityCode);
      }
    } catch (error) {
      console.error('保存 API 配置失败:', error);
      throw error;
    }
  },

  // 保存整个提供商配置
  async saveProviderConfig(provider: MapProviderConfig): Promise<void> {
    try {
      await Promise.all(
        provider.apis.map((api) =>
          this.saveApiConfig(api.id, api.apiKey, api.securityCode)
        )
      );
    } catch (error) {
      console.error('保存提供商配置失败:', error);
      throw error;
    }
  },

  // 获取当前活跃的提供商
  async getActiveProvider(): Promise<MapProvider> {
    try {
      const provider = await AsyncStorage.getItem('@favmap_active_provider');
      return (provider as MapProvider) || 'amap';
    } catch (error) {
      console.error('获取活跃提供商失败:', error);
      return 'amap';
    }
  },

  // 设置活跃的提供商
  async setActiveProvider(provider: MapProvider): Promise<void> {
    try {
      await AsyncStorage.setItem('@favmap_active_provider', provider);
    } catch (error) {
      console.error('设置活跃提供商失败:', error);
      throw error;
    }
  },

  // 获取当前活跃提供商的 API Key（用于搜索等）
  async getActiveApiKey(): Promise<string> {
    try {
      const provider = await this.getActiveProvider();
      const config = await this.getProviderConfig(provider);

      // 优先使用搜索类型的 API Key
      const searchApi = config.apis.find((api) => api.type === 'search');
      if (searchApi?.apiKey) return searchApi.apiKey;

      // 否则使用地图类型的 API Key
      const mapApi = config.apis.find((api) => api.type === 'map');
      return mapApi?.apiKey || '';
    } catch (error) {
      console.error('获取活跃 API Key 失败:', error);
      return '';
    }
  },
};
