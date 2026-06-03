import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiStorageService } from './apiStorage';
import { SearchResult, SubwayStation } from '../types';

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
  // 获取 API Key（从 ApiStorageService 读取）
  async getApiKey(): Promise<string> {
    try {
      const config = await ApiStorageService.getProviderConfig('amap');
      // 优先使用 Web 服务 Key
      const webApi = config.apis.find((api) => api.id === 'amap_web');
      if (webApi?.apiKey) return webApi.apiKey;

      // 否则使用 JS API Key
      const jsApi = config.apis.find((api) => api.id === 'amap_js');
      return jsApi?.apiKey || '';
    } catch (error) {
      console.error('获取高德 API Key 失败:', error);
      return '';
    }
  },

  // 搜索地点（支持分页获取更多结果）
  async searchKeyword(keyword: string, city?: string, maxPages: number = 3): Promise<SearchResult[]> {
    try {
      const apiKey = await this.getApiKey();
      console.log('AMap searchKeyword - API Key:', apiKey ? '已配置' : '未配置');

      if (!apiKey) {
        console.error('未配置高德地图 API Key');
        return [];
      }

      const allResults: SearchResult[] = [];
      const pageSize = 25; // 高德 API 最大每页 25 条

      // 获取多页结果
      for (let page = 1; page <= maxPages; page++) {
        const cityParam = city ? `&city=${encodeURIComponent(city)}` : '';
        const url = `https://restapi.amap.com/v3/place/text?key=${apiKey}&keywords=${encodeURIComponent(keyword)}${cityParam}&offset=${pageSize}&page=${page}&extensions=all`;

        console.log(`AMap 搜索请求 (第${page}页):`, url);
        const response = await fetch(url);
        const data = await response.json();
        console.log(`AMap 搜索响应 (第${page}页):`, data);

        if (data.status === '1' && data.pois && data.pois.length > 0) {
          const results = data.pois.map((poi: any) => ({
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
          allResults.push(...results);

          // 如果返回的结果少于每页数量，说明没有更多了
          if (data.pois.length < pageSize) {
            break;
          }
        } else {
          break;
        }
      }

      console.log(`搜索完成，共 ${allResults.length} 条结果`);
      return allResults;
    } catch (error) {
      console.error('搜索地点失败:', error);
      return [];
    }
  },

  // 获取地点详情
  async getDetails(poiId: string): Promise<any> {
    try {
      const apiKey = await this.getApiKey();
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
      const apiKey = await this.getApiKey();
      if (!apiKey) return [];

      const url = `https://restapi.amap.com/v3/place/around?key=${apiKey}&location=${longitude},${latitude}&keywords=地铁站&radius=2000&offset=10&page=1&extensions=all`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.pois) {
        return data.pois.slice(0, 3).map((poi: any) => ({
          name: poi.name,
          distance: parseFloat(poi.distance),
          walkingTime: parseFloat(poi.distance) / 80,
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
      const apiKey = await this.getApiKey();
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
      const apiKey = await this.getApiKey();
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
      const apiKey = await this.getApiKey();
      if (!apiKey) return [];

      const url = `https://restapi.amap.com/v3/config/district?key=${apiKey}&keywords=${encodeURIComponent(city)}&subdistrict=1&extensions=base`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.districts && data.districts.length > 0) {
        let best = data.districts[0];
        for (const d of data.districts) {
          if ((d.districts?.length || 0) > (best.districts?.length || 0)) {
            best = d;
          }
        }
        if (best.districts && best.districts.length > 0) {
          return best.districts.map((d: any) => ({
            name: d.name,
            center: {
              latitude: parseFloat(d.center.split(',')[1]),
              longitude: parseFloat(d.center.split(',')[0]),
            },
            level: d.level,
          }));
        }
        return data.districts.map((d: any) => ({
          name: d.name,
          center: {
            latitude: parseFloat(d.center.split(',')[1]),
            longitude: parseFloat(d.center.split(',')[0]),
          },
          level: d.level,
        }));
      }
      return [];
    } catch (error) {
      console.error('获取城市区域失败:', error);
      return [];
    }
  },
};
