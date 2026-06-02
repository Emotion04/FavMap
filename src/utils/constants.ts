// 高德地图 API Key（默认为空，用户在设置中填写）
export const AMAP_API_KEY = '';

// 默认地图中心点（北京）
export const DEFAULT_CENTER = {
  latitude: 39.9042,
  longitude: 116.4074,
};

// 默认缩放级别
export const DEFAULT_ZOOM = 12;

// 收藏图标列表
export const FAVORITE_ICONS = [
  { emoji: '⭐', name: '星星' },
  { emoji: '📌', name: '图钉' },
  { emoji: '🌱', name: '小草' },
  { emoji: '🏠', name: '房子' },
  { emoji: '🍜', name: '面条' },
  { emoji: '☕', name: '咖啡' },
  { emoji: '🎬', name: '电影' },
  { emoji: '📚', name: '书本' },
  { emoji: '🏥', name: '医院' },
  { emoji: '🏫', name: '学校' },
];

// 默认图标
export const DEFAULT_ICON = '⭐';

// 存储键名
export const STORAGE_KEYS = {
  FAVORITES: '@favmap_favorites',
  SETTINGS: '@favmap_settings',
  AMAP_API_KEY: '@favmap_amap_api_key',
  AMAP_SECURITY_CODE: '@favmap_amap_security_code',
  AMAP_WEB_API_KEY: '@favmap_amap_web_api_key',
};

// 主题颜色
export const COLORS = {
  light: {
    primary: '#2196F3',
    background: '#FFFFFF',
    surface: 'rgba(255, 255, 255, 0.8)',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
    error: '#F44336',
    success: '#4CAF50',
  },
  dark: {
    primary: '#64B5F6',
    background: '#121212',
    surface: 'rgba(255, 255, 255, 0.1)',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
    error: '#EF5350',
    success: '#66BB6A',
  },
};
