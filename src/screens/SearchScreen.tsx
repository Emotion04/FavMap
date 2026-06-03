import React, { useState, useCallback } from 'react';
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
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { MapServiceFactory } from '../services/mapServiceFactory';
import { GlassInput, GlassCard } from '../components/glass';
import { SearchResult, FavoritePlace } from '../types';
import { generateId } from '../utils/helpers';

interface SearchScreenProps {
  onBack: () => void;
  onPlaceSelect: (place: FavoritePlace) => void;
  userLocation?: { latitude: number; longitude: number } | null;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ onBack, onPlaceSelect, userLocation }) => {
  const { colors, isDark } = useTheme();
  const { addFavorite, favorites } = useFavorites();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // 搜索地点 - 支持多页结果和城市筛选
  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      Alert.alert('提示', '请输入搜索关键词');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const mapService = await MapServiceFactory.getService();
      console.log('开始搜索:', query, '城市:', city || '全国');

      // 获取多页结果（最多 3 页，约 75 条）
      const data = await mapService.searchKeyword(query, city || undefined, 3);
      console.log('搜索结果:', data.length, '条');
      setResults(data);

      if (data.length === 0) {
        Alert.alert('提示', '未找到结果，请检查 API Key 配置是否正确');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      Alert.alert('错误', '搜索失败，请检查网络连接和 API Key 配置');
    } finally {
      setLoading(false);
    }
  }, [query, city]);

  // 收藏地点
  const handleFavorite = useCallback(async (result: SearchResult) => {
    const isAlreadyFavorite = favorites.some(
      (f) =>
        f.coordinate.latitude === result.coordinate.latitude &&
        f.coordinate.longitude === result.coordinate.longitude
    );

    if (isAlreadyFavorite) {
      Alert.alert('提示', '该地点已收藏');
      return;
    }

    try {
      const mapService = await MapServiceFactory.getService();
      const subwayStations = await mapService.searchNearbySubway(
        result.coordinate.latitude,
        result.coordinate.longitude
      );

      const newPlace: Omit<FavoritePlace, 'id' | 'createdAt' | 'updatedAt'> = {
        name: result.name,
        address: result.address,
        coordinate: result.coordinate,
        rating: result.rating,
        icon: '⭐',
        subwayStations,
      };

      await addFavorite(newPlace);
      Alert.alert('成功', '收藏成功！');
    } catch (error) {
      console.error('收藏失败:', error);
      Alert.alert('错误', '收藏失败');
    }
  }, [favorites, addFavorite]);

  // 查看详情
  const handleViewDetail = useCallback((result: SearchResult) => {
    const place: FavoritePlace = {
      id: generateId(),
      name: result.name,
      address: result.address,
      coordinate: result.coordinate,
      rating: result.rating,
      icon: '⭐',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onPlaceSelect(place);
  }, [onPlaceSelect]);

  // 渲染搜索结果（液态玻璃效果）
  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity onPress={() => handleViewDetail(item)} activeOpacity={0.8}>
      <BlurView
        intensity={isDark ? 30 : 50}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.resultCard,
          {
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
            backgroundColor: isDark ? 'rgba(40,40,40,0.7)' : 'rgba(255,255,255,0.7)',
          },
        ]}
      >
        <View style={styles.resultContent}>
          <View style={styles.resultInfo}>
            <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.resultAddress, { color: colors.textSecondary }]} numberOfLines={2}>
              {item.address}
            </Text>
            {item.rating && (
              <Text style={styles.resultRating}>⭐ {item.rating.toFixed(1)}</Text>
            )}
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
      {/* 搜索栏（液态玻璃效果） */}
      <BlurView
        intensity={isDark ? 40 : 60}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.searchHeader,
          {
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
            backgroundColor: isDark ? 'rgba(20,20,20,0.9)' : 'rgba(255,255,255,0.9)',
          },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchInput}>
          <GlassInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            placeholder="搜索地点..."
            returnKeyType="search"
            icon={<Text>🔍</Text>}
          />
        </View>
        <TouchableOpacity onPress={handleSearch} style={styles.searchSubmitButton}>
          <Text style={[styles.searchSubmitText, { color: colors.primary }]}>搜索</Text>
        </TouchableOpacity>
      </BlurView>
      {/* 城市筛选（可选） */}
      <View style={styles.cityContainer}>
        <Text style={[styles.cityLabel, { color: colors.textSecondary }]}>城市:</Text>
        <TextInput
          style={[styles.cityInput, { color: colors.text, borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)" }]}
          value={city}
          onChangeText={setCity}
          placeholder="全国" placeholderTextColor={colors.textSecondary}
        />
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
            query.length > 0 && !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={[styles.emptyText, { color: colors.text }]}>未找到相关地点</Text>
                <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                  请检查 API Key 配置或尝试其他关键词
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🗺️</Text>
                <Text style={[styles.emptyText, { color: colors.text }]}>搜索地点</Text>
                <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                  输入关键词搜索你想收藏的地点
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
  container: {
    flex: 1,
  },
  // 搜索头部（液态玻璃）
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backIcon: {
    fontSize: 24,
  },
  searchInput: {
    flex: 1,
  },
  searchSubmitButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchSubmitText: {
    fontSize: 16,
    fontWeight: '600',
  // 城市筛选
  },
  cityContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  cityLabel: {
    fontSize: 14,
  },
  cityInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
  },
  // 列表样式
  listContainer: {
    padding: 16,
  },
  // 结果卡片（液态玻璃）
  resultCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultAddress: {
    fontSize: 14,
    marginBottom: 4,
  },
  resultRating: {
    fontSize: 14,
    color: '#FFD700',
  },
  favoriteButton: {
    padding: 8,
  },
  favoriteIcon: {
    fontSize: 24,
  },
  // 加载状态
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  // 空状态
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SearchScreen;
