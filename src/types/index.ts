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
