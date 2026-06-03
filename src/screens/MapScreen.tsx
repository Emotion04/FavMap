import React, { useState, useEffect, useRef } from 'react';
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
import GlassCard from '../components/GlassCard';
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
  const [selectedPlace, setSelectedPlace] = useState<FavoritePlace | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [cardPosition, setCardPosition] = useState<CardPosition>('half');

  // 动画值
  const cardAnimValue = useRef(new Animated.Value(height * 0.5)).current;
  const mapAnimValue = useRef(new Animated.Value(height * 0.45)).current;

  // 卡片拖动手势
  const lastOffset = useRef(height * 0.5);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        cardAnimValue.setOffset(lastOffset.current);
        cardAnimValue.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = gestureState.dy;
        const minHeight = height * 0.15;
        const maxHeight = height * 0.85;
        const clampedValue = Math.max(minHeight - lastOffset.current, Math.min(maxHeight - lastOffset.current, newValue));
        cardAnimValue.setValue(clampedValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        cardAnimValue.flattenOffset();
        const currentValue = lastOffset.current + gestureState.dy;
        const velocity = gestureState.vy;

        let targetPosition: CardPosition;
        if (velocity > 500) {
          targetPosition = 'collapsed';
        } else if (velocity < -500) {
          targetPosition = 'expanded';
        } else if (currentValue < height * 0.3) {
          targetPosition = 'collapsed';
        } else if (currentValue > height * 0.7) {
          targetPosition = 'expanded';
        } else {
          targetPosition = 'half';
        }

        animateToPosition(targetPosition);
      },
    })
  ).current;

  // 动画到指定位置
  const animateToPosition = (position: CardPosition) => {
    setCardPosition(position);
    let targetValue: number;

    switch (position) {
      case 'collapsed':
        targetValue = height * 0.15;
        break;
      case 'half':
        targetValue = height * 0.5;
        break;
      case 'expanded':
        targetValue = height * 0.85;
        break;
    }

    lastOffset.current = targetValue;

    Animated.spring(cardAnimValue, {
      toValue: targetValue,
      useNativeDriver: false,
      bounciness: 8,
    }).start();

    // 同时调整地图高度
    const mapHeight = height - targetValue;
    Animated.spring(mapAnimValue, {
      toValue: mapHeight,
      useNativeDriver: false,
      bounciness: 8,
    }).start();
  };

  // 获取用户位置
  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web 版本使用浏览器 Geolocation API
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setUserLocation({ latitude, longitude });
            },
            (error) => {
              console.error('获取位置失败:', error);
              // 使用默认位置（北京）
              setUserLocation(DEFAULT_CENTER);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000,
            }
          );
        } else {
          // 浏览器不支持 Geolocation，使用默认位置
          setUserLocation(DEFAULT_CENTER);
        }
      } else {
        // 移动版本使用 expo-location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('权限提示', '需要定位权限才能显示您的位置');
          setUserLocation(DEFAULT_CENTER);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        setUserLocation({ latitude, longitude });
      }
    } catch (error) {
      console.error('获取位置失败:', error);
      setUserLocation(DEFAULT_CENTER);
    }
  };

  // 处理地点点击
  const handlePlacePress = (place: FavoritePlace) => {
    setSelectedPlace(place);
    onPlacePress(place);
  };

  // 切换地图最大化
  const toggleMapExpand = () => {
    if (mapExpanded) {
      setMapExpanded(false);
      animateToPosition('half');
    } else {
      setMapExpanded(true);
      animateToPosition('collapsed');
    }
  };

  // Web 版本
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 地图区域 */}
        <Animated.View style={[styles.webMapContainer, { height: mapAnimValue }]}>
          <WebMap
            favorites={favorites}
            onPlacePress={handlePlacePress}
            userLocation={userLocation}
          />

          {/* 地图上的搜索栏 */}
          <View style={styles.webMapSearch}>
            <TouchableOpacity onPress={onSearchPress} activeOpacity={0.8}>
              <BlurView
                intensity={40}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.searchButton, { borderColor: colors.border }]}
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
            {/* 最大化按钮 */}
            <TouchableOpacity onPress={toggleMapExpand} style={styles.controlButton}>
              <BlurView
                intensity={30}
                tint={isDark ? 'dark' : 'light'}
                style={styles.controlButtonInner}
              >
                <Text style={styles.controlIcon}>{mapExpanded ? '🔽' : '🔼'}</Text>
              </BlurView>
            </TouchableOpacity>

            {/* 定位按钮 */}
            <TouchableOpacity onPress={getUserLocation} style={styles.controlButton}>
              <BlurView
                intensity={30}
                tint={isDark ? 'dark' : 'light'}
                style={styles.controlButtonInner}
              >
                <Text style={styles.controlIcon}>📍</Text>
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* 地图上的收藏计数 */}
          <View style={styles.webMapCounter}>
            <GlassCard style={styles.countBadge}>
              <Text style={[styles.countBadgeText, { color: colors.text }]}>
                ⭐ {favorites.length}
              </Text>
            </GlassCard>
          </View>
        </Animated.View>

        {/* 底部收藏列表（可拖动） */}
        <Animated.View
          style={[
            styles.webListSection,
            {
              backgroundColor: colors.background,
              height: cardAnimValue,
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* 拖动指示器 */}
          <View style={styles.dragIndicatorContainer}>
            <View style={[styles.dragIndicator, { backgroundColor: colors.border }]} />
          </View>

          {/* 切换按钮 */}
          <View style={styles.positionButtons}>
            <TouchableOpacity
              onPress={() => animateToPosition('collapsed')}
              style={[
                styles.positionButton,
                cardPosition === 'collapsed' && styles.positionButtonActive,
              ]}
            >
              <Text style={[styles.positionButtonText, { color: colors.textSecondary }]}>收起</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => animateToPosition('half')}
              style={[
                styles.positionButton,
                cardPosition === 'half' && styles.positionButtonActive,
              ]}
            >
              <Text style={[styles.positionButtonText, { color: colors.textSecondary }]}>半屏</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => animateToPosition('expanded')}
              style={[
                styles.positionButton,
                cardPosition === 'expanded' && styles.positionButtonActive,
              ]}
            >
              <Text style={[styles.positionButtonText, { color: colors.textSecondary }]}>展开</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.webListHeader}>
            <Text style={[styles.webTitle, { color: colors.text }]}>🗺️ FavMap</Text>
            <Text style={[styles.webSubtitle, { color: colors.textSecondary }]}>
              {favorites.length > 0 ? `${favorites.length} 个收藏地点` : '收藏地图应用'}
            </Text>
          </View>

          <ScrollView style={styles.webContent} showsVerticalScrollIndicator={false}>
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
                  <GlassCard style={styles.placeCard}>
                    <View style={styles.placeContent}>
                      <Text style={styles.placeIcon}>{place.icon}</Text>
                      <View style={styles.placeInfo}>
                        <Text style={[styles.placeName, { color: colors.text }]} numberOfLines={1}>
                          {place.name}
                        </Text>
                        <Text style={[styles.placeAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                          {place.address}
                        </Text>
                        {place.rating && (
                          <Text style={styles.placeRating}>⭐ {place.rating.toFixed(1)}</Text>
                        )}
                      </View>
                      <Text style={[styles.placeArrow, { color: colors.textSecondary }]}>›</Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </View>
    );
  }

  // 移动版本
  const [MapView, setMapView] = useState<any>(null);
  const [MapMarker, setMapMarker] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        const maps = require('react-native-maps');
        setMapView(() => maps.default);
        setMapMarker(() => maps.Marker);
      } catch (error) {
        console.error('加载地图失败:', error);
      }
    }
  }, []);

  if (!MapView) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>加载地图中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          ...(userLocation || DEFAULT_CENTER),
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {favorites.map((place) => (
          <MapMarker
            key={place.id}
            coordinate={place.coordinate}
            title={place.name}
            description={place.address}
            onPress={() => handlePlacePress(place)}
          />
        ))}
      </MapView>

      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={onSearchPress} activeOpacity={0.8}>
          <BlurView
            intensity={40}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.searchButton, { borderColor: colors.border }]}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>
              搜索地点...
            </Text>
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* 收藏计数 */}
      <View style={styles.countContainer}>
        <GlassCard style={styles.countBadge}>
          <Text style={[styles.countBadgeText, { color: colors.text }]}>
            ⭐ {favorites.length}
          </Text>
        </GlassCard>
      </View>

      {/* 定位按钮 */}
      <View style={styles.locationButtonContainer}>
        <TouchableOpacity
          onPress={getUserLocation}
          style={[styles.locationButton, { backgroundColor: colors.surface }]}
        >
          <Text style={styles.locationIcon}>📍</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
  // Web 版本样式
  webMapContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  webMapSearch: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 60,
    zIndex: 10,
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
  },
  controlButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  controlIcon: {
    fontSize: 20,
  },
  webMapCounter: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    zIndex: 10,
  },
  webListSection: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16,
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
    overflow: 'hidden',
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 8,
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
    paddingBottom: 8,
  },
  positionButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  positionButtonActive: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
  },
  positionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  webListHeader: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  webTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 2,
  },
  webSubtitle: {
    fontSize: 13,
  },
  webContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // 搜索栏样式
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  // 收藏计数样式
  countContainer: {
    position: 'absolute',
    bottom: 60,
    left: 16,
  },
  countBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // 定位按钮样式
  locationButtonContainer: {
    position: 'absolute',
    bottom: 60,
    right: 16,
  },
  locationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  locationIcon: {
    fontSize: 24,
  },
  // 收藏列表样式
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
    marginBottom: 4,
  },
  placeRating: {
    fontSize: 14,
    color: '#FFD700',
  },
  placeArrow: {
    fontSize: 24,
  },
});

export default MapScreen;
