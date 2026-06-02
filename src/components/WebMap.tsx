import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, DEFAULT_CENTER, DEFAULT_ZOOM } from '../utils/constants';
import { FavoritePlace } from '../types';

// 高德 JS API 类型声明
declare global {
  interface Window {
    AMap: any;
    AMapLoader: {
      load: (options: { key: string; version: string; plugins?: string[] }) => Promise<any>;
    };
    _AMapSecurityConfig: {
      securityJsCode?: string;
      serviceHost?: string;
    };
  }
}

interface WebMapProps {
  favorites: FavoritePlace[];
  onPlacePress: (place: FavoritePlace) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const LOADER_URL = 'https://webapi.amap.com/loader.js';

// 将 emoji 映射到合适的图标风格
const categoryIcons: Record<string, string> = {
  '🍜': '#fa8c16',
  '☕': '#8B4513',
  '🎬': '#eb2f96',
  '📚': '#52c41a',
  '🏥': '#f5222d',
  '🏫': '#1890ff',
  '🏠': '#fa8c16',
  '🌱': '#52c41a',
  '📌': '#eb2f96',
};

const WebMap: React.FC<WebMapProps> = ({ favorites, onPlacePress, userLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载高德 JS API
  const initMap = useCallback(async () => {
    try {
      const apiKey = await AsyncStorage.getItem(STORAGE_KEYS.AMAP_API_KEY);
      if (!apiKey) {
        setError('请先在设置页面配置高德地图 API Key（Web端 JS API 类型）');
        return;
      }

      const securityCode = await AsyncStorage.getItem(STORAGE_KEYS.AMAP_SECURITY_CODE);

      // 加载 loader.js（只加载一次）
      if (!document.querySelector('script[src*="loader.js"]')) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = LOADER_URL;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('加载高德 loader.js 失败'));
          document.head.appendChild(script);
        });
      }

      // 安全密钥配置（必须在 AMapLoader.load 之前）
      if (securityCode) {
        window._AMapSecurityConfig = {
          securityJsCode: securityCode,
        };
      }

      // 加载地图
      const AMap = await window.AMapLoader.load({
        key: apiKey,
        version: '2.0',
        plugins: ['AMap.Scale', 'AMap.ToolBar'],
      });

      // 埋点
      AMap.getConfig().appname = 'amap-jsapi-skill';

      if (!mapContainerRef.current) return;

      // 创建地图实例
      const map = new AMap.Map(mapContainerRef.current, {
        viewMode: '3D',
        zoom: DEFAULT_ZOOM,
        center: [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude],
        resizeEnable: true,
      });

      map.addControl(new AMap.Scale());
      map.addControl(new AMap.ToolBar({ position: 'RT' }));

      mapInstanceRef.current = map;
      setLoaded(true);

      // 如果有用户位置，添加定位标记
      if (userLocation) {
        const userMarker = new AMap.Marker({
          position: [userLocation.longitude, userLocation.latitude],
          icon: new AMap.Icon({
            size: new AMap.Size(24, 24),
            image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
            imageSize: new AMap.Size(24, 24),
          }),
          title: '我的位置',
          zIndex: 100,
        });
        map.add(userMarker);
      }
    } catch (e: any) {
      console.error('地图初始化失败:', e);
      setError(`地图加载失败: ${e?.message || '请检查 Key 和安全密钥是否正确'}`);
    }
  }, [userLocation]);

  // 注入标记样式
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const styleId = 'favmap-marker-styles';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .favmap-marker { display:flex; flex-direction:column; align-items:center; cursor:pointer; }
      .favmap-marker-icon {
        width:36px; height:36px; background:var(--color,#1890ff); border-radius:50%;
        display:flex; align-items:center; justify-content:center; font-size:18px;
        box-shadow:0 2px 8px rgba(0,0,0,0.3); border:2px solid #fff;
      }
      .favmap-marker-label {
        margin-top:3px; padding:2px 6px; background:rgba(255,255,255,0.9);
        border-radius:4px; font-size:11px; color:#333;
        box-shadow:0 1px 3px rgba(0,0,0,0.1); white-space:nowrap;
        max-width:80px; overflow:hidden; text-overflow:ellipsis;
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 更新收藏标记
  useEffect(() => {
    if (!mapInstanceRef.current || !loaded) return;

    const map = mapInstanceRef.current;
    const AMap = window.AMap;

    // 清除旧标记
    markersRef.current.forEach((m) => map.remove(m));
    markersRef.current = [];

    if (favorites.length === 0) {
      // 没有收藏时回到默认视图
      map.setZoomAndCenter(DEFAULT_ZOOM, [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude]);
      return;
    }

    const newMarkers: any[] = [];

    favorites.forEach((place) => {
      const icon = place.icon || '⭐';
      const bgColor = categoryIcons[icon] || '#1890ff';

      // 使用自定义 content 创建标记（参考 skill 中的分类图标 Marker 模式）
      const marker = new AMap.Marker({
        position: [place.coordinate.longitude, place.coordinate.latitude],
        content: `<div class="favmap-marker" style="--color: ${bgColor}">
          <div class="favmap-marker-icon">${icon}</div>
          <div class="favmap-marker-label">${place.name}</div>
        </div>`,
        offset: new AMap.Pixel(-18, -50),
        title: place.name,
        zIndex: 50,
      });

      marker.on('click', () => onPlacePress(place));
      map.add(marker);
      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;

    // 自动缩放到包含所有标记
    map.setFitView(null, false, [60, 60, 60, 60]);
  }, [favorites, loaded, onPlacePress]);

  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🗺️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !loaded ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingIcon}>🗺️</Text>
          <Text style={styles.loadingText}>加载地图中...</Text>
        </View>
      ) : null}
      <div
        ref={mapContainerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    zIndex: 1,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  errorContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    zIndex: 1,
    padding: 24,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default WebMap;
