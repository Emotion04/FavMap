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
  const [cardPosition, setCardPosition] = useState<CardPosition>('half');

  // 动画值 - 卡片从底部偏移量
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
        // 限制范围：最小 15%（展开），最大 85%（收起）
        const minValue = height * 0.15;
        const maxValue = height * 0.85;
        const newValue = gestureState.dy;
        const clampedValue = Math.max(
          minValue - lastOffset.current,
          Math.min(maxValue - lastOffset.current, newValue)
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
  const animateToPosition = (position: CardPosition) => {
    setCardPosition(position);
    let targetValue: number;

    switch (position) {
      case 'collapsed':
        targetValue = height * 0.85; // 卡片在底部，只露出一点点
        break;
      case 'half':
        targetValue = height * 0.5; // 卡片在半屏
        break;
      case 'expanded':
        targetValue = height * 0.15; // 卡片几乎全屏
        break;
    }

    lastOffset.current = targetValue;

    Animated.spring(cardTranslateY, {
      toValue: targetValue,
      useNativeDriver: true,
      bounciness: 8,
      speed: 12,
    }).start();
  };

  // 获取用户位置
  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setUserLocation({ latitude, longitude });
            },
            (error) => {
              console.error('获取位置失败:', error);
              setUserLocation(DEFAULT_CENTER);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
          );
        } else {
          setUserLocation(DEFAULT_CENTER);
        }
      } else {
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

    // 移动端使用原生地图
    const [MapView, setMapView] = useState<any>(null);
    const [MapMarker, setMapMarker] = useState<any>(null);

    useEffect(() => {
      try {
        const maps = require('react-native-maps');
        setMapView(() => maps.default);
        setMapMarker(() => maps.Marker);
      } catch (error) {
        console.error('加载地图失败:', error);
      }
    }, []);

    if (!MapView) {
      return (
        <View style={[styles.map, styles.loadingContainer]}>
          <Text style={[styles.loadingText, { color: colors.text }]}>加载地图中...</Text>
        </View>
      );
    }

    return (
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
    );
  };

  return (
    <View style={styles.container}>
      {/* 全屏地图 */}
      <View style={styles.mapContainer}>
        {renderMap()}
      </View>

      {/* 搜索栏（浮在地图上方） */}
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

      {/* 地图控制按钮 */}
      <View style={styles.mapControls}>
        {/* 最大化/还原按钮 */}
        <TouchableOpacity
          onPress={() => animateToPosition(cardPosition === 'collapsed' ? 'half' : 'collapsed')}
          style={styles.controlButton}
        >
          <BlurView
            intensity={30}
            tint={isDark ? 'dark' : 'light'}
            style={styles.controlButtonInner}
          >
            <Text style={styles.controlIcon}>
              {cardPosition === 'collapsed' ? '🔽' : '🔼'}
            </Text>
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

      {/* 收藏计数（浮在地图上方） */}
      <View style={styles.mapCounter}>
        <GlassCard style={styles.countBadge}>
          <Text style={[styles.countBadgeText, { color: colors.text }]}>
            ⭐ {favorites.length}
          </Text>
        </GlassCard>
      </View>

      {/* 底部卡片（叠加在地图上层） */}
      <Animated.View
        style={[
          styles.bottomCard,
          {
            backgroundColor: colors.background,
            transform: [{ translateY: cardTranslateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* 拖动指示器 */}
        <View style={styles.dragIndicatorContainer}>
          <View style={[styles.dragIndicator, { backgroundColor: colors.border }]} />
        </View>

        {/* 位置切换按钮 */}
        <View style={styles.positionButtons}>
          <TouchableOpacity
            onPress={() => animateToPosition('collapsed')}
            style={[
              styles.positionButton,
              cardPosition === 'collapsed' && styles.positionButtonActive,
            ]}
          >
            <Text style={[styles.positionButtonText, { color: colors.textSecondary }]}>
              收起
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => animateToPosition('half')}
            style={[
              styles.positionButton,
              cardPosition === 'half' && styles.positionButtonActive,
            ]}
          >
            <Text style={[styles.positionButtonText, { color: colors.textSecondary }]}>
              半屏
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => animateToPosition('expanded')}
            style={[
              styles.positionButton,
              cardPosition === 'expanded' && styles.positionButtonActive,
            ]}
          >
            <Text style={[styles.positionButtonText, { color: colors.textSecondary }]}>
              展开
            </Text>
          </TouchableOpacity>
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // 地图样式
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
  // 搜索栏样式
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 60,
    zIndex: 100,
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
  // 地图控制按钮
  mapControls: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 100,
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
  // 收藏计数
  mapCounter: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    zIndex: 50,
  },
  countBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // 底部卡片样式
  bottomCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: height,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 90,
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  positionButtonActive: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
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
