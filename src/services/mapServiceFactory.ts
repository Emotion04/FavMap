import { MapProvider, SearchResult, SubwayStation } from '../types';
import { ApiStorageService } from './apiStorage';
import { AMapService } from './amap';

// 地图服务接口
export interface MapService {
  searchKeyword(keyword: string, city?: string): Promise<SearchResult[]>;
  getDetails(poiId: string): Promise<any>;
  searchNearbySubway(latitude: number, longitude: number): Promise<SubwayStation[]>;
  geocode(address: string, city?: string): Promise<{ latitude: number; longitude: number } | null>;
  reverseGeocode(latitude: number, longitude: number): Promise<string | null>;
  getCityDistricts(city: string): Promise<any[]>;
}

// 腾讯地图服务实现
class TencentMapService implements MapService {
  private async getApiKey(): Promise<string> {
    return await ApiStorageService.getActiveApiKey();
  }

  async searchKeyword(keyword: string, city?: string): Promise<SearchResult[]> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) return [];

      const region = city ? `&region=${encodeURIComponent(city)}` : '';
      const url = `https://apis.map.qq.com/ws/place/v1/search?key=${apiKey}&keyword=${encodeURIComponent(keyword)}${region}&page_size=20`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 0 && data.data) {
        return data.data.map((poi: any) => ({
          id: poi.id,
          name: poi.title,
          address: poi.address,
          coordinate: {
            latitude: poi.location.lat,
            longitude: poi.location.lng,
          },
          rating: undefined,
          type: poi.category,
        }));
      }
      return [];
    } catch (error) {
      console.error('腾讯地图搜索失败:', error);
      return [];
    }
  }

  async getDetails(poiId: string): Promise<any> {
    // 腾讯地图 POI 详情
    return null;
  }

  async searchNearbySubway(latitude: number, longitude: number): Promise<SubwayStation[]> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) return [];

      const url = `https://apis.map.qq.com/ws/place/v1/search?key=${apiKey}&keyword=地铁站&boundary=nearby(${latitude},${longitude},2000)&page_size=3`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 0 && data.data) {
        return data.data.map((poi: any) => ({
          name: poi.title,
          distance: poi._distance || 0,
          walkingTime: (poi._distance || 0) / 80,
        }));
      }
      return [];
    } catch (error) {
      console.error('腾讯地图搜索地铁站失败:', error);
      return [];
    }
  }

  async geocode(address: string, city?: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) return null;

      const region = city ? `&region=${encodeURIComponent(city)}` : '';
      const url = `https://apis.map.qq.com/ws/geocoder/v1/?key=${apiKey}&address=${encodeURIComponent(address)}${region}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 0 && data.result) {
        return {
          latitude: data.result.location.lat,
          longitude: data.result.location.lng,
        };
      }
      return null;
    } catch (error) {
      console.error('腾讯地图地理编码失败:', error);
      return null;
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) return null;

      const url = `https://apis.map.qq.com/ws/geocoder/v1/?key=${apiKey}&location=${latitude},${longitude}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 0 && data.result) {
        return data.result.formatted_addresses?.recommend || data.result.address;
      }
      return null;
    } catch (error) {
      console.error('腾讯地图逆地理编码失败:', error);
      return null;
    }
  }

  async getCityDistricts(city: string): Promise<any[]> {
    return [];
  }
}

// 百度地图服务实现
class BaiduMapService implements MapService {
  private async getApiKey(): Promise<string> {
    return await ApiStorageService.getActiveApiKey();
  }

  async searchKeyword(keyword: string, city?: string): Promise<SearchResult[]> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) return [];

      const region = city ? `&region=${encodeURIComponent(city)}` : '';
      const url = `https://api.map.baidu.com/place/v2/search?query=${encodeURIComponent(keyword)}${region}&output=json&ak=${apiKey}&page_size=20`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 0 && data.results) {
        return data.results.map((poi: any) => ({
          id: poi.uid,
          name: poi.name,
          address: poi.address,
          coordinate: {
            latitude: poi.location.lat,
            longitude: poi.location.lng,
          },
          rating: poi.detail_info?.overall_rating ? parseFloat(poi.detail_info.overall_rating) : undefined,
          type: poi.detail_info?.tag,
        }));
      }
      return [];
    } catch (error) {
      console.error('百度地图搜索失败:', error);
      return [];
    }
  }

  async getDetails(poiId: string): Promise<any> {
    return null;
  }

  async searchNearbySubway(latitude: number, longitude: number): Promise<SubwayStation[]> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) return [];

      const url = `https://api.map.baidu.com/place/v2/search?query=地铁站&location=${latitude},${longitude}&radius=2000&output=json&ak=${apiKey}&page_size=3`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 0 && data.results) {
        return data.results.map((poi: any) => ({
          name: poi.name,
          distance: poi.detail_info?.distance || 0,
          walkingTime: (poi.detail_info?.distance || 0) / 80,
        }));
      }
      return [];
    } catch (error) {
      console.error('百度地图搜索地铁站失败:', error);
      return [];
    }
  }

  async geocode(address: string, city?: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) return null;

      const url = `https://api.map.baidu.com/geocoding/v3/?address=${encodeURIComponent(address)}&output=json&ak=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 0 && data.result) {
        return {
          latitude: data.result.location.lat,
          longitude: data.result.location.lng,
        };
      }
      return null;
    } catch (error) {
      console.error('百度地图地理编码失败:', error);
      return null;
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) return null;

      const url = `https://api.map.baidu.com/reverse_geocoding/v3/?location=${latitude},${longitude}&output=json&ak=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 0 && data.result) {
        return data.result.formatted_address;
      }
      return null;
    } catch (error) {
      console.error('百度地图逆地理编码失败:', error);
      return null;
    }
  }

  async getCityDistricts(city: string): Promise<any[]> {
    return [];
  }
}

// 地图服务工厂
export const MapServiceFactory = {
  // 获取当前活跃的地图服务
  async getService(): Promise<MapService> {
    const provider = await ApiStorageService.getActiveProvider();

    switch (provider) {
      case 'tencent':
        return new TencentMapService();
      case 'baidu':
        return new BaiduMapService();
      case 'amap':
      default:
        return AMapService;
    }
  },

  // 获取指定提供商的服务
  getServiceByProvider(provider: MapProvider): MapService {
    switch (provider) {
      case 'tencent':
        return new TencentMapService();
      case 'baidu':
        return new BaiduMapService();
      case 'amap':
      default:
        return AMapService;
    }
  },
};
