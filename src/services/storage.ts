import AsyncStorage from '@react-native-async-storage/async-storage';
import { FavoritePlace, UserSettings } from '../types';
import { STORAGE_KEYS, DEFAULT_ICON } from '../utils/constants';

// 收藏地点存储
export const FavoritesStorage = {
  // 获取所有收藏
  async getAll(): Promise<FavoritePlace[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('获取收藏失败:', error);
      return [];
    }
  },

  // 保存收藏
  async save(favorites: FavoritePlace[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (error) {
      console.error('保存收藏失败:', error);
    }
  },

  // 添加收藏
  async add(place: FavoritePlace): Promise<void> {
    const favorites = await this.getAll();
    favorites.push(place);
    await this.save(favorites);
  },

  // 更新收藏
  async update(id: string, updates: Partial<FavoritePlace>): Promise<void> {
    const favorites = await this.getAll();
    const index = favorites.findIndex((f) => f.id === id);
    if (index !== -1) {
      favorites[index] = { ...favorites[index], ...updates, updatedAt: new Date().toISOString() };
      await this.save(favorites);
    }
  },

  // 删除收藏
  async remove(id: string): Promise<void> {
    const favorites = await this.getAll();
    const filtered = favorites.filter((f) => f.id !== id);
    await this.save(filtered);
  },

  // 导出为 JSON
  async exportToJSON(): Promise<string> {
    const favorites = await this.getAll();
    return JSON.stringify(favorites, null, 2);
  },

  // 从 JSON 导入
  async importFromJSON(json: string): Promise<void> {
    try {
      const favorites = JSON.parse(json) as FavoritePlace[];
      await this.save(favorites);
    } catch (error) {
      console.error('导入失败:', error);
      throw new Error('无效的 JSON 格式');
    }
  },
};

// 用户设置存储
export const SettingsStorage = {
  // 获取设置
  async get(): Promise<UserSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data
        ? JSON.parse(data)
        : {
            theme: 'system',
            defaultIcon: DEFAULT_ICON,
            mapStyle: 'standard',
            activeProvider: 'amap',
          };
    } catch (error) {
      console.error('获取设置失败:', error);
      return {
        theme: 'system',
        defaultIcon: DEFAULT_ICON,
        mapStyle: 'standard',
        activeProvider: 'amap',
      };
    }
  },

  // 保存设置
  async save(settings: UserSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  },
};
