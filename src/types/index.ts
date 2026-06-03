// 地图提供商类型
export type MapProvider = 'amap' | 'tencent' | 'baidu';

// API 类型
export type ApiType = 'map' | 'search' | 'geocoding';

// API 配置
export interface ApiConfig {
  id: string;
  name: string;
  provider: MapProvider;
  type: ApiType;
  apiKey: string;
  securityCode?: string; // 仅高德需要
  description: string;
}

// 地图提供商配置
export interface MapProviderConfig {
  id: MapProvider;
  name: string;
  icon: string;
  description: string;
  apis: ApiConfig[];
}

// 收藏地点
export interface FavoritePlace {
  id: string;
  name: string;
  address: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  notes?: string;
  tags?: string[];
  icon: string; // emoji 图标
  subwayStations?: SubwayStation[];
  createdAt: string;
  updatedAt: string;
}

// 地铁站
export interface SubwayStation {
  name: string;
  distance: number; // 米
  walkingTime: number; // 分钟
}

// 用户设置
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  defaultIcon: string;
  mapStyle: string;
  activeProvider: MapProvider; // 当前使用的地图提供商
}

// 搜索结果
export interface SearchResult {
  id: string;
  name: string;
  address: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  type?: string;
}

// 分享数据
export interface ShareData {
  title: string;
  message: string;
  url?: string;
  image?: string;
}
