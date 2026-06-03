import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { MapServiceFactory } from '../services/mapServiceFactory';
import { SearchResult, FavoritePlace } from '../types';
import { generateId, calculateDistance } from '../utils/helpers';
import { DEFAULT_CENTER } from '../utils/constants';

interface SearchScreenProps {
  onBack: () => void;
  onPlaceSelect: (place: FavoritePlace) => void;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ onBack, onPlaceSelect }) => {
  const { colors, isDark } = useTheme();
  const { addFavorite, favorites } = useFavorites();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentCity, setCurrentCity] = useState<string>('');

  // 获取用户位置和城市信息
  useEffect(() => {
    getUserLocationAndCity();
  }, []);

  const getUserLocationAndCity = async () => {
    try {
      let location: { latitude: number; longitude: number } | null = null;

      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          location = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                });
              },
              () => resolve(null),
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
          });
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          location = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
        }
      }

      if (location) {
        setUserLocation(location);
        const mapService = await MapServiceFactory.getService();
        const address = await mapService.reverseGeocode(location.latitude, location.longitude);
        if (address) {
          console.log('获取到地址:', address);
          let cityName = '';
          const directCityMatch = address.match(/([^\s省]+?)市/);
          if (directCityMatch) {
            cityName = directCityMatch[1];
          }
          if (!cityName) {
            const stateMatch = address.match(/([^\s省]+?)州/);
            if (stateMatch) {
              cityName = stateMatch[1] + '州';
            }
          }
          if (!cityName) {
            const leagueMatch = address.match(/([^\s省]+?)盟/);
            if (leagueMatch) {
              cityName = leagueMatch[1] + '盟';
            }
          }
          if (cityName) {
            console.log('提取的城市名:', cityName);
            setCurrentCity(cityName);
            setCity(cityName);
          }
        }
      }
    } catch (error) {
      console.error('获取位置失败:', error);
    }
  };

  const getDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    return calculateDistance(lat1, lon1, lat2, lon2) / 1000;
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      Alert.alert('提示', '请输入搜索关键词');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const mapService = await MapServiceFactory.getService();
      console.log('=== 开始搜索 ===');
      console.log('关键词:', query);
      console.log('城市:', city || '全国');

      const data = await mapService.searchKeyword(query, city || undefined, 3);
      console.log('搜索完成，结果数量:', data.length);

      let sortedResults = data;
      if (userLocation) {
        sortedResults = data.map((item) => ({
          ...item,
          distance: getDistance(
            userLocation.latitude,
            userLocation.longitude,
            item.coordinate.latitude,
            item.coordinate.longitude
          ),
        })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      setResults(sortedResults);

      if (sortedResults.length === 0) {
        Alert.alert('提示', '未找到结果，请检查 API Key 配置是否正确');
      }
    } catch (error: any) {
      console.error('搜索失败:', error);
      Alert.alert('搜索错误', error.message || '搜索失败');
    } finally {
      setLoading(false);
    }
  }, [query, city, userLocation, getDistance]);

  const handleFavorite = useCallback(async (result: SearchResult) => {
    const exists = favorites.some(
      (f) =>
        f.coordinate.latitude === result.coordinate.latitude &&
        f.coordinate.longitude === result.coordinate.longitude
    );

    if (exists) {
      Alert.alert('提示', '已收藏');
      return;
    }

    try {
      const mapService = await MapServiceFactory.getService();
      const subwayStations = await mapService.searchNearbySubway(
        result.coordinate.latitude,
        result.coordinate.longitude
      );

      await addFavorite({
        name: result.name,
        address: result.address,
        coordinate: result.coordinate,
        rating: result.rating,
        icon: '⭐',
        subwayStations,
      });
      Alert.alert('成功', '收藏成功！');
    } catch (error) {
      Alert.alert('错误', '收藏失败');
    }
  }, [favorites, addFavorite]);

  const handleViewDetail = useCallback((result: SearchResult) => {
    onPlaceSelect({
      id: generateId(),
      name: result.name,
      address: result.address,
      coordinate: result.coordinate,
      rating: result.rating,
      icon: '⭐',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }, [onPlaceSelect]);

  const renderItem = ({ item }: { item: SearchResult & { distance?: number } }) => (
    <TouchableOpacity onPress={() => handleViewDetail(item)} activeOpacity={0.8}>
      <BlurView
        intensity={isDark ? 15 : 25}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.resultCard, {
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.3)',
          backgroundColor: isDark ? 'rgba(20,20,20,0.4)' : 'rgba(255,255,255,0.4)',
        }]}
      >
        <View style={styles.resultContent}>
          <View style={styles.resultInfo}>
            <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.resultAddress, { color: colors.textSecondary }]} numberOfLines={2}>{item.address}</Text>
            <View style={styles.resultMeta}>
              {item.rating && <Text style={styles.resultRating}>⭐ {item.rating.toFixed(1)}</Text>}
              {item.distance !== undefined && (
                <Text style={[styles.resultDistance, { color: colors.textSecondary }]}>
                  📍 {item.distance < 1 ? `${Math.round(item.distance * 1000)}米` : `${item.distance.toFixed(1)}公里`}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleFavorite(item)}
            style={styles.favoriteButton}
          >
            <Text style={styles.favoriteIcon}>⭐</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 搜索头部 */}
      <BlurView
        intensity={isDark ? 20 : 35}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.searchHeader, {
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.3)',
          backgroundColor: isDark ? 'rgba(10,10,10,0.6)' : 'rgba(255,255,255,0.6)',
        }]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            placeholder="搜索地点..."
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity onPress={handleSearch} style={styles.searchSubmitButton}>
          <Text style={[styles.searchSubmitText, { color: colors.primary }]}>搜索</Text>
        </TouchableOpacity>
      </BlurView>

      {/* 城市筛选 */}
      <View style={styles.cityContainer}>
        <Text style={[styles.cityLabel, { color: colors.textSecondary }]}>城市:</Text>
        <TextInput
          style={[styles.cityInput, {
            color: colors.text,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          }]}
          value={city}
          onChangeText={setCity}
          placeholder={currentCity || '全国（可选）'}
          placeholderTextColor={colors.textSecondary}
        />
        {currentCity && (
          <TouchableOpacity onPress={() => setCity(currentCity)} style={styles.cityButton}>
            <Text style={[styles.cityButtonText, { color: colors.primary }]}>定位</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 搜索结果 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>搜索中...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            query.length > 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={[styles.emptyText, { color: colors.text }]}>未找到结果</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🗺️</Text>
                <Text style={[styles.emptyText, { color: colors.text }]}>搜索地点</Text>
                <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                  结果按距离排序，最近的排在前面
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 8, marginRight: 8 },
  backIcon: { fontSize: 24 },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 16 },
  searchSubmitButton: { padding: 8, marginLeft: 8 },
  searchSubmitText: { fontSize: 16, fontWeight: '600' },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  cityLabel: { fontSize: 14 },
  cityInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
  },
  cityButton: { padding: 6 },
  cityButtonText: { fontSize: 14, fontWeight: '500' },
  listContainer: { padding: 16 },
  resultCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  resultContent: { flexDirection: 'row', alignItems: 'center' },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  resultAddress: { fontSize: 14, marginBottom: 4 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultRating: { fontSize: 14, color: '#FFD700' },
  resultDistance: { fontSize: 13 },
  favoriteButton: { padding: 8 },
  favoriteIcon: { fontSize: 24 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  emptyContainer: { padding: 60, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyHint: { fontSize: 14, textAlign: 'center' },
});

export default SearchScreen;
