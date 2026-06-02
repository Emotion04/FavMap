import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, Alert, Platform, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { useFavorites } from '../contexts/FavoritesContext';
import { useTheme } from '../contexts/ThemeContext';
import SearchBar from '../components/SearchBar';
import GlassCard from '../components/GlassCard';
import { FavoritePlace } from '../types';
import { DEFAULT_CENTER } from '../utils/constants';
import { formatDistance } from '../utils/helpers';

const { width, height } = Dimensions.get('window');

interface MapScreenProps {
  onSearchPress: () => void;
  onPlacePress: (place: FavoritePlace) => void;
}

const MapScreen: React.FC<MapScreenProps> = ({ onSearchPress, onPlacePress }) => {
  const { favorites } = useFavorites();
  const { colors, isDark } = useTheme();
  const [selectedPlace, setSelectedPlace] = useState<FavoritePlace | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // 获取用户位置
  useEffect(() => {
    if (Platform.OS !== 'web') {
      getUserLocation();
    }
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限提示', '需要定位权限才能显示您的位置');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
    } catch (error) {
      console.error('获取位置失败:', error);
    }
  };

  // 处理地点点击
  const handlePlacePress = (place: FavoritePlace) => {
    setSelectedPlace(place);
    onPlacePress(place);
  };

  // Web 版本 - 显示收藏列表
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 头部 */}
        <View style={styles.webHeader}>
          <View style={styles.webHeaderContent}>
            <View style={styles.webHeaderLeft}>
              <Text style={[styles.webTitle, { color: colors.text }]}>🗺️ FavMap</Text>
              <Text style={[styles.webSubtitle, { color: colors.textSecondary }]}>
                收藏地图应用
              </Text>
            </View>
            <View style={styles.webHeaderRight}>
              <TouchableOpacity onPress={onSearchPress} activeOpacity={0.8}>
                <BlurView
                  intensity={20}
                  tint={isDark ? 'dark' : 'light'}
                  style={[styles.searchButton, { borderColor: colors.border }]}
                >
                  <Text style={styles.searchIcon}>🔍</Text>
                  <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>搜索地点...</Text>
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 收藏列表 */}
        <ScrollView style={styles.webContent}>
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

        {/* 统计信息 */}
        <View style={[styles.webFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            ⭐ {favorites.length} 个收藏
          </Text>
        </View>
      </View>
    );
  }

  // 移动版本 - 使用原生地图
  // 这里需要动态加载 react-native-maps
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
      {/* 地图 */}
      <MapView
        style={styles.map}
        initialRegion={{
          ...DEFAULT_CENTER,
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
          <SearchBar
            value=""
            onChangeText={() => {}}
            onSubmit={() => {}}
            placeholder="搜索地点..."
          />
        </TouchableOpacity>
      </View>

      {/* 选中的地点信息 */}
      {selectedPlace && (
        <View style={styles.selectedContainer}>
          <GlassCard style={styles.selectedCard}>
            <TouchableOpacity
              onPress={() => onPlacePress(selectedPlace)}
              activeOpacity={0.8}
            >
              <View style={styles.selectedContent}>
                <Text style={styles.selectedIcon}>{selectedPlace.icon}</Text>
                <View style={styles.selectedInfo}>
                  <Text style={[styles.selectedName, { color: colors.text }]} numberOfLines={1}>
                    {selectedPlace.name}
                  </Text>
                  <Text style={[styles.selectedAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                    {selectedPlace.address}
                  </Text>
                </View>
                <Text style={[styles.arrow, { color: colors.textSecondary }]}>›</Text>
              </View>
            </TouchableOpacity>
          </GlassCard>
        </View>
      )}

      {/* 收藏数量 */}
      <View style={styles.countContainer}>
        <GlassCard style={styles.countCard}>
          <Text style={[styles.countText, { color: colors.text }]}>
            ⭐ {favorites.length} 个收藏
          </Text>
        </GlassCard>
      </View>

      {/* 回到当前位置按钮 */}
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
  webHeader: {
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  webHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  webHeaderLeft: {
    flex: 1,
  },
  webHeaderRight: {
    flex: 2,
    marginLeft: 24,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 2,
  },
  webSubtitle: {
    fontSize: 14,
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
  webContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  webFooter: {
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
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
  // 移动版本样式
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
  },
  selectedContainer: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
  },
  selectedCard: {
    padding: 12,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedAddress: {
    fontSize: 14,
  },
  arrow: {
    fontSize: 24,
  },
  countContainer: {
    position: 'absolute',
    bottom: 60,
    left: 16,
  },
  countCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
  },
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
});

export default MapScreen;
