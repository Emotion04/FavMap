import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, ActivityIndicator, Alert, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { MapServiceFactory } from '../services/mapServiceFactory';
import SearchBar from '../components/SearchBar';
import GlassCard from '../components/GlassCard';
import { SearchResult, FavoritePlace } from '../types';
import { generateId } from '../utils/helpers';

interface SearchScreenProps {
  onBack: () => void;
  onPlaceSelect: (place: FavoritePlace) => void;
}

const SearchScreen: React.FC<SearchScreenProps> = ({ onBack, onPlaceSelect }) => {
  const { colors } = useTheme();
  const { addFavorite, favorites } = useFavorites();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // 搜索地点
  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const mapService = await MapServiceFactory.getService();
      const data = await mapService.searchKeyword(query);
      setResults(data);

      if (data.length === 0) {
        Alert.alert('提示', '未找到结果，请检查 API Key 配置');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      Alert.alert('错误', '搜索失败，请检查网络连接和 API Key 配置');
    } finally {
      setLoading(false);
    }
  };

  // 收藏地点
  const handleFavorite = async (result: SearchResult) => {
    // 检查是否已收藏
    const isAlreadyFavorite = favorites.some(
      (f) => f.coordinate.latitude === result.coordinate.latitude &&
             f.coordinate.longitude === result.coordinate.longitude
    );

    if (isAlreadyFavorite) {
      alert('该地点已收藏');
      return;
    }

    // 获取地铁站信息
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
    alert('收藏成功！');
  };

  // 查看详情
  const handleViewDetail = (result: SearchResult) => {
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
  };

  // 渲染搜索结果
  const renderItem = ({ item }: { item: SearchResult }) => (
    <GlassCard style={styles.resultCard}>
      <TouchableOpacity onPress={() => handleViewDetail(item)} activeOpacity={0.8}>
        <View style={styles.resultContent}>
          <View style={styles.resultInfo}>
            <Text style={styles.resultName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.resultAddress} numberOfLines={2}>
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
      </TouchableOpacity>
    </GlassCard>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchInput}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onSubmit={handleSearch}
            placeholder="搜索地点..."
          />
        </View>
      </View>

      {/* 搜索结果 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
                <Text style={styles.emptyText}>未找到相关地点</Text>
              </View>
            ) : null
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
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
  listContainer: {
    padding: 16,
  },
  resultCard: {
    marginBottom: 12,
    padding: 16,
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
    opacity: 0.7,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.5,
  },
});

export default SearchScreen;
