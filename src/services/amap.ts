import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';
import { SearchResult, SubwayStation } from '../types';

// 获取 API Key
const getApiKey = async (): Promise<string> => {
  try {
    const key = await AsyncStorage.getItem(STORAGE_KEYS.AMAP_API_KEY);
    return key || '';
  } catch {
    return '';
  }
};

// 城市区域信息
export interface CityDistrict {
  name: string;
  center: {
    latitude: number;
    longitude: number;
  };
  level: string;
}

// 高德地图 API 服务
export const AMapService = {
  // 搜索地点
  async searchKeyword(keyword: string, city?: string): Promise<SearchResult[]> {
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        console.error('未配置高德地图 API Key');
        return [];
      }

      const cityParam = city ? `&city=${encodeURIComponent(city)}` : '';
      const url = `https://restapi.amap.com/v3/place/text?key=${apiKey}&keywords=${encodeURIComponent(keyword)}${cityParam}&offset=20&page=1&extensions=all`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.pois) {
        return data.pois.map((poi: any) => ({
          id: poi.id,
          name: poi.name,
          address: poi.address,
          coordinate: {
            latitude: parseFloat(poi.location.split(',')[1]),
            longitude: parseFloat(poi.location.split(',')[0]),
          },
          rating: poi.biz_ext?.rating ? parseFloat(poi.biz_ext.rating) : undefined,
          type: poi.type,
        }));
      }
      return [];
    } catch (error) {
      console.error('搜索地点失败:', error);
      return [];
    }
  },

  // 获取地点详情
  async getDetails(poiId: string): Promise<any> {
    try {
      const apiKey = await getApiKey();
      if (!apiKey) return null;

      const url = `https://restapi.amap.com/v3/place/detail?key=${apiKey}&id=${poiId}&extensions=all`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.pois && data.pois.length > 0) {
        return data.pois[0];
      }
      return null;
    } catch (error) {
      console.error('获取详情失败:', error);
      return null;
    }
  },

  // 搜索附近地铁站
  async searchNearbySubway(latitude: number, longitude: number): Promise<SubwayStation[]> {
    try {
      const apiKey = await getApiKey();
      if (!apiKey) return [];

      const url = `https://restapi.amap.com/v3/place/around?key=${apiKey}&location=${longitude},${latitude}&keywords=地铁站&radius=2000&offset=10&page=1&extensions=all`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.pois) {
        return data.pois.slice(0, 3).map((poi: any) => ({
          name: poi.name,
          distance: parseFloat(poi.distance),
          walkingTime: parseFloat(poi.distance) / 80, // 假设步行速度 80米/分钟
        }));
      }
      return [];
    } catch (error) {
      console.error('搜索地铁站失败:', error);
      return [];
    }
  },

  // 地理编码（地址转坐标）
  async geocode(address: string, city?: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const apiKey = await getApiKey();
      if (!apiKey) return null;

      const cityParam = city ? `&city=${encodeURIComponent(city)}` : '';
      const url = `https://restapi.amap.com/v3/geocode/geo?key=${apiKey}&address=${encodeURIComponent(address)}${cityParam}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
        const location = data.geocodes[0].location.split(',');
        return {
          latitude: parseFloat(location[1]),
          longitude: parseFloat(location[0]),
        };
      }
      return null;
    } catch (error) {
      console.error('地理编码失败:', error);
      return null;
    }
  },

  // 逆地理编码（坐标转地址）
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const apiKey = await getApiKey();
      if (!apiKey) return null;

      const url = `https://restapi.amap.com/v3/geocode/regeo?key=${apiKey}&location=${longitude},${latitude}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.regeocode) {
        return data.regeocode.formatted_address;
      }
      return null;
    } catch (error) {
      console.error('逆地理编码失败:', error);
      return null;
    }
  },

  // 获取城市区域信息
  async getCityDistricts(city: string): Promise<CityDistrict[]> {
    try {
      const apiKey = await getApiKey();
      if (!apiKey) return [];

      const url = `https://restapi.amap.com/v3/config/district?key=${apiKey}&keywords=${encodeURIComponent(city)}&subdistrict=1&extensions=base`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.districts && data.districts.length > 0) {
        const district = data.districts[0];
        if (district.districts) {
          return district.districts.map((d: any) => ({
            name: d.name,
            center: {
              latitude: parseFloat(d.center.split(',')[1]),
              longitude: parseFloat(d.center.split(',')[0]),
            },
            level: d.level,
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('获取城市区域失败:', error);
      return [];
    }
  },
};
