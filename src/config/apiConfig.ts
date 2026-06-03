import { MapProviderConfig, MapProvider } from '../types';

// 地图提供商配置
export const MAP_PROVIDERS: MapProviderConfig[] = [
  {
    id: 'amap',
    name: '高德地图',
    icon: '🗺️',
    description: '国内最常用，功能全面',
    apis: [
      {
        id: 'amap_js',
        name: 'JS API Key',
        provider: 'amap',
        type: 'map',
        apiKey: '',
        securityCode: '',
        description: '用于地图渲染（Web端）',
      },
      {
        id: 'amap_web',
        name: 'Web 服务 Key',
        provider: 'amap',
        type: 'search',
        apiKey: '',
        description: '用于搜索、地理编码等 REST API',
      },
    ],
  },
  {
    id: 'tencent',
    name: '腾讯地图',
    icon: '📍',
    description: '微信小程序集成好',
    apis: [
      {
        id: 'tencent_key',
        name: 'API Key',
        provider: 'tencent',
        type: 'map',
        apiKey: '',
        description: '用于地图渲染和搜索',
      },
    ],
  },
  {
    id: 'baidu',
    name: '百度地图',
    icon: '🌐',
    description: '功能全面，覆盖广',
    apis: [
      {
        id: 'baidu_ak',
        name: 'AK (Access Key)',
        provider: 'baidu',
        type: 'map',
        apiKey: '',
        description: '用于地图渲染和搜索',
      },
    ],
  },
];

// 获取默认提供商配置
export const getDefaultProviderConfig = (provider: MapProvider): MapProviderConfig => {
  return MAP_PROVIDERS.find((p) => p.id === provider) || MAP_PROVIDERS[0];
};

// 获取所有 API 配置
export const getAllApiConfigs = (): MapProviderConfig[] => {
  return MAP_PROVIDERS;
};
