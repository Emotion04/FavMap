import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert,
  Platform,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { useFavorites } from '../contexts/FavoritesContext';
import { useTheme } from '../contexts/ThemeContext';
import WebMap from '../components/WebMap';
import { FavoritePlace } from '../types';
import { DEFAULT_CENTER } from '../utils/constants';

const { width, height } = Dimensions.get('window');

// 底部卡片位置状态
type CardPosition = 'collapsed' | 'half' | 'expanded';

interface MapScreenProps {
  onSearchPress: () => void;
  onPlacePress: (place: FavoritePlace) => void;
}

const MapScreen: React.FC<MapScreenProps> = ({ onSearchPress, onPlacePress }) => {
  const { favorites } = useFavorites();
  const { colors, isDark } = useTheme();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [cardPosition, setCardPosition] = useState<CardPosition>('half');

  // 动画值
  const cardTranslateY = useRef(new Animated.Value(height * 0.5)).current;
  const lastOffset = useRef(height * 0.5);

  // 卡片拖动手势
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        cardTranslateY.setOffset(lastOffset.current);
        cardTranslateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const minValue = height * 0.15;
        const maxValue = height * 0.85;
        const clampedValue = Math.max(
          minValue - lastOffset.current,
          Math.min(maxValue - lastOffset.current, gestureState.dy)
        );
        cardTranslateY.setValue(clampedValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        cardTranslateY.flattenOffset();
        const currentValue = lastOffset.current + gestureState.dy;
        const velocity = gestureState.vy;

        let targetPosition: CardPosition;
        if (velocity > 300) {
          targetPosition = 'collapsed';
        } else if (velocity < -300) {
          targetPosition = 'expanded';
        } else if (currentValue < height * 0.3) {
          targetPosition = 'expanded';
        } else if (currentValue > height * 0.7) {
          targetPosition = 'collapsed';
        } else {
          targetPosition = 'half';
        }

        animateToPosition(targetPosition);
      },
    })
  ).current;

  // 动画到指定位置
  const animateToPosition = useCallback((position: CardPosition) => {
    setCardPosition(position);
    let targetValue: number;

    switch (position) {
      case 'collapsed':
        targetValue = height * 0.85;
        break;
      case 'half':
        targetValue = height * 0.5;
        break;
      case 'expanded':
        targetValue = height * 0.15;
        break;
    }

    lastOffset.current = targetValue;

    Animated.spring(cardTranslateY, {
      toValue: targetValue,
      useNativeDriver: true,
      bounciness: 12,
      speed: 14,
    }).start();
  }, [cardTranslateY]);

  // 获取用户位置
  const getUserLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
              setLocationLoading(false);
            },
            (error) => {
              console.error('获取位置失败:', error);
              setUserLocation(DEFAULT_CENTER);
              setLocationLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
          );
        } else {
          setUserLocation(DEFAULT_CENTER);
          setLocationLoading(false);
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('权限提示', '需要定位权限才能显示您的位置');
          setUserLocation(DEFAULT_CENTER);
          setLocationLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setLocationLoading(false);
      }
    } catch (error) {
      console.error('获取位置失败:', error);
      setUserLocation(DEFAULT_CENTER);
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // 处理地点点击
  const handlePlacePress = useCallback((place: FavoritePlace) => {
    onPlacePress(place);
  }, [onPlacePress]);

  // 渲染地图
  const renderMap = () => {
    if (Platform.OS === 'web') {
      return (
        <WebMap
          favorites={favorites}
          onPlacePress={handlePlacePress}
          userLocation={userLocation}
        />
      );
    }

    return <NativeMapView userLocation={userLocation} favorites={favorites} onPlacePress={handlePlacePress} />;
  };

  // 原生地图组件
  const NativeMapView = ({ userLocation, favorites, onPlacePress }: {
    userLocation: { latitude: number; longitude: number } | null;
    favorites: FavoritePlace[];
    onPlacePress: (place: FavoritePlace) => void;
  }) => {
    const [MapView, setMapView] = useState<any>(null);
    const [MapMarker, setMapMarker] = useState<any>(null);
    const mapRef = useRef<any>(null);

    useEffect(() => {
      try {
        const maps = require('react-native-maps');
        setMapView(() => maps.default);
        setMapMarker(() => maps.Marker);
      } catch (error) {
        console.error('加载地图失败:', error);
      }
    }, []);

    useEffect(() => {
      if (mapRef.current && userLocation) {
        mapRef.current.animateToRegion({
          ...userLocation,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }, 1000);
      }
    }, [userLocation]);

    if (!MapView) {
      return (
        <View style={[styles.map, styles.loadingContainer]}>
          <Text style={[styles.loadingText, { color: colors.text }]}>加载地图中...</Text>
        </View>
      );
    }

    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          ...(userLocation || DEFAULT_CENTER),
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {favorites.map((place) => (
          <MapMarker
            key={place.id}
            coordinate={place.coordinate}
            title={place.name}
            description={place.address}
            onPress={() => onPlacePress(place)}
          />
        ))}
      </MapView>
    );
  };

  return (
    <View style={styles.container}>
      {/* 全屏地图 */}
      <View style={styles.mapContainer}>
        {renderMap()}
      </View>

      {/* 搜索栏（液态玻璃效果） */}
      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={onSearchPress} activeOpacity={0.8}>
          <BlurView
            intensity={isDark ? 15 : 25}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.searchButton,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)',
                backgroundColor: isDark ? 'rgba(15,15,15,0.4)' : 'rgba(255,255,255,0.4)',
              },
            ]}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>
              搜索地点...
            </Text>
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* 地图控制按钮 */}
      <View style={styles.mapControls}>
        {/* 最大化/还原按钮 */}
        <TouchableOpacity
          onPress={() => animateToPosition(cardPosition === 'collapsed' ? 'half' : 'collapsed')}
          activeOpacity={0.7}
        >
          <BlurView
            intensity={isDark ? 15 : 25}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.controlButton,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)',
                backgroundColor: isDark ? 'rgba(15,15,15,0.4)' : 'rgba(255,255,255,0.4)',
              },
            ]}
          >
            <Text style={styles.controlIcon}>
              {cardPosition === 'collapsed' ? '🔽' : '🔼'}
            </Text>
          </BlurView>
        </TouchableOpacity>

        {/* 定位按钮 */}
        <TouchableOpacity
          onPress={getUserLocation}
          activeOpacity={0.7}
          disabled={locationLoading}
        >
          <BlurView
            intensity={isDark ? 15 : 25}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.controlButton,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)',
                backgroundColor: isDark ? 'rgba(15,15,15,0.4)' : 'rgba(255,255,255,0.4)',
              },
            ]}
          >
            <Text style={[styles.controlIcon, locationLoading && { opacity: 0.5 }]}>
              {locationLoading ? '⏳' : '📍'}
            </Text>
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* 收藏计数 */}
      <View style={styles.mapCounter}>
        <BlurView
          intensity={isDark ? 15 : 25}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.countBadge,
            {
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)',
              backgroundColor: isDark ? 'rgba(15,15,15,0.4)' : 'rgba(255,255,255,0.4)',
            },
          ]}
        >
          <Text style={[styles.countBadgeText, { color: colors.text }]}>
            ⭐ {favorites.length}
          </Text>
        </BlurView>
      </View>

      {/* 底部卡片（液态玻璃效果） */}
      <Animated.View
        style={[
          styles.bottomCard,
          {
            transform: [{ translateY: cardTranslateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <BlurView
          intensity={isDark ? 20 : 35}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.bottomCardInner,
            {
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)',
              backgroundColor: isDark ? 'rgba(10,10,10,0.6)' : 'rgba(255,255,255,0.6)',
            },
          ]}
        >
          {/* 拖动指示器 */}
          <View style={styles.dragIndicatorContainer}>
            <View style={[styles.dragIndicator, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
          </View>

          {/* 位置切换按钮 */}
          <View style={styles.positionButtons}>
            {(['collapsed', 'half', 'expanded'] as CardPosition[]).map((pos) => (
              <TouchableOpacity
                key={pos}
                onPress={() => animateToPosition(pos)}
                activeOpacity={0.7}
              >
                <BlurView
                  intensity={cardPosition === pos ? (isDark ? 25 : 40) : (isDark ? 10 : 20)}
                  tint={isDark ? 'dark' : 'light'}
                  style={[
                    styles.positionButton,
                    {
                      borderColor: cardPosition === pos
                        ? 'rgba(255,255,255,0.3)'
                        : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.2)',
                      backgroundColor: cardPosition === pos
                        ? 'rgba(255,255,255,0.15)'
                        : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.1)',
                    },
                  ]}
                >
                  <Text style={[
                    styles.positionButtonText,
                    { color: cardPosition === pos ? colors.primary : colors.textSecondary },
                  ]}>
                    {pos === 'collapsed' ? '收起' : pos === 'half' ? '半屏' : '展开'}
                  </Text>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>

          {/* 标题 */}
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>🗺️ FavMap</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              {favorites.length > 0 ? `${favorites.length} 个收藏地点` : '收藏地图应用'}
            </Text>
          </View>

          {/* 收藏列表 */}
          <ScrollView style={styles.cardContent} showsVerticalScrollIndicator={false}>
            {favorites.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>⭐</Text>
                <Text style={[styles.emptyText, { color: colors.text }]}>
                  还没有收藏地点
                </Text>
                <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                  点击搜索按钮添加你的第一个收藏
                </Text>
              </View>
            ) : (
              favorites.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  onPress={() => handlePlacePress(place)}
                  activeOpacity={0.8}
                >
                  <BlurView
                    intensity={isDark ? 15 : 25}
                    tint={isDark ? 'dark' : 'light'}
                    style={[
                      styles.placeCard,
                      {
                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.3)',
                        backgroundColor: isDark ? 'rgba(20,20,20,0.4)' : 'rgba(255,255,255,0.4)',
                      },
                    ]}
                  >
                    <View style={styles.placeContent}>
                      <Text style={styles.placeIcon}>{place.icon}</Text>
                      <View style={styles.placeInfo}>
                        <Text style={[styles.placeName, { color: colors.text }]} numberOfLines={1}>
                          {place.name}
                        </Text>
                        <Text style={[styles.placeAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                          {place.address}
                        </Text>
                      </View>
                      <Text style={[styles.placeArrow, { color: colors.textSecondary }]}>›</Text>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </BlurView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 70,
    zIndex: 100,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchPlaceholder: {
    fontSize: 16,
  },
  mapControls: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 100,
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  controlIcon: {
    fontSize: 22,
  },
  mapCounter: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    zIndex: 50,
  },
  countBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: height,
    zIndex: 90,
  },
  bottomCardInner: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  positionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  positionButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  positionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
  },
  placeCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  placeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeIcon: {
    fontSize: 36,
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
  },
  placeArrow: {
    fontSize: 24,
  },
});

export default MapScreen;
