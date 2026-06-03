import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Linking,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { MapServiceFactory } from '../services/mapServiceFactory';
import { ShareService } from '../services/share';
import { GlassCard, GlassButton } from '../components/glass';
import { FavoritePlace, SubwayStation } from '../types';
import { formatDistance, formatWalkingTime, formatDate } from '../utils/helpers';
import { FAVORITE_ICONS } from '../utils/constants';

interface DetailScreenProps {
  place: FavoritePlace;
  onBack: () => void;
  onEdit: (place: FavoritePlace) => void;
}

const DetailScreen: React.FC<DetailScreenProps> = ({ place, onBack, onEdit }) => {
  const { colors, isDark } = useTheme();
  const { updateFavorite, removeFavorite } = useFavorites();
  const [subwayStations, setSubwayStations] = useState<SubwayStation[]>(
    place.subwayStations || []
  );
  const [loadingSubway, setLoadingSubway] = useState(false);

  // 加载地铁站信息
  useEffect(() => {
    if (!place.subwayStations || place.subwayStations.length === 0) {
      loadSubwayStations();
    }
  }, []);

  const loadSubwayStations = async () => {
    setLoadingSubway(true);
    try {
      const mapService = await MapServiceFactory.getService();
      const stations = await mapService.searchNearbySubway(
        place.coordinate.latitude,
        place.coordinate.longitude
      );
      setSubwayStations(stations);
      await updateFavorite(place.id, { subwayStations: stations });
    } catch (error) {
      console.error('加载地铁站失败:', error);
    } finally {
      setLoadingSubway(false);
    }
  };

  // 导航
  const handleNavigation = useCallback(() => {
    const { latitude, longitude } = place.coordinate;
    const name = encodeURIComponent(place.name);

    Alert.alert('选择地图应用', '请选择要使用的地图应用', [
      {
        text: '高德地图',
        onPress: () => {
          const url = `amapuri://route/plan/?dlat=${latitude}&dlon=${longitude}&dname=${name}&dev=0&t=0`;
          Linking.openURL(url).catch(() => Alert.alert('错误', '未安装高德地图'));
        },
      },
      {
        text: '百度地图',
        onPress: () => {
          const url = `baidumap://map/direction?destination=name:${name}|latlng:${latitude},${longitude}&mode=driving`;
          Linking.openURL(url).catch(() => Alert.alert('错误', '未安装百度地图'));
        },
      },
      {
        text: '腾讯地图',
        onPress: () => {
          const url = `qqmap://map/routeplan?type=drive&to=${name}&tocoord=${latitude},${longitude}`;
          Linking.openURL(url).catch(() => Alert.alert('错误', '未安装腾讯地图'));
        },
      },
      { text: '取消', style: 'cancel' },
    ]);
  }, [place]);

  // 分享
  const handleShare = useCallback(async () => {
    await ShareService.sharePlace(place);
  }, [place]);

  // 删除
  const handleDelete = useCallback(() => {
    Alert.alert('确认删除', `确定要删除"${place.name}"吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await removeFavorite(place.id);
          onBack();
        },
      },
    ]);
  }, [place, removeFavorite, onBack]);

  // 修改图标
  const handleChangeIcon = useCallback(async (icon: string) => {
    await updateFavorite(place.id, { icon });
  }, [place, updateFavorite]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 头部（液态玻璃效果） */}
      <BlurView
        intensity={isDark ? 40 : 60}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.header,
          {
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
            backgroundColor: isDark ? 'rgba(20,20,20,0.9)' : 'rgba(255,255,255,0.9)',
          },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {place.name}
        </Text>
        <TouchableOpacity onPress={() => onEdit(place)} style={styles.editButton}>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </BlurView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 基本信息（液态玻璃效果） */}
        <BlurView
          intensity={isDark ? 30 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.section,
            {
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
              backgroundColor: isDark ? 'rgba(40,40,40,0.7)' : 'rgba(255,255,255,0.7)',
            },
          ]}
        >
          <View style={styles.basicInfo}>
            <Text style={styles.icon}>{place.icon}</Text>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]}>{place.name}</Text>
              <Text style={[styles.address, { color: colors.textSecondary }]}>{place.address}</Text>
              {place.rating && <Text style={styles.rating}>⭐ {place.rating.toFixed(1)}</Text>}
            </View>
          </View>
        </BlurView>

        {/* 图标选择（液态玻璃效果） */}
        <BlurView
          intensity={isDark ? 30 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.section,
            {
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
              backgroundColor: isDark ? 'rgba(40,40,40,0.7)' : 'rgba(255,255,255,0.7)',
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>选择图标</Text>
          <View style={styles.iconGrid}>
            {FAVORITE_ICONS.map((item) => (
              <TouchableOpacity
                key={item.emoji}
                onPress={() => handleChangeIcon(item.emoji)}
                style={[
                  styles.iconItem,
                  place.icon === item.emoji && styles.iconItemSelected,
                ]}
              >
                <Text style={styles.iconEmoji}>{item.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>

        {/* 地铁站信息（液态玻璃效果） */}
        <BlurView
          intensity={isDark ? 30 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.section,
            {
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
              backgroundColor: isDark ? 'rgba(40,40,40,0.7)' : 'rgba(255,255,255,0.7)',
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>附近地铁站</Text>
          {loadingSubway ? (
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>加载中...</Text>
          ) : subwayStations.length > 0 ? (
            subwayStations.map((station, index) => (
              <View key={index} style={styles.stationItem}>
                <Text style={[styles.stationName, { color: colors.text }]}>🚇 {station.name}</Text>
                <Text style={[styles.stationDistance, { color: colors.textSecondary }]}>
                  {formatDistance(station.distance)} · 步行{formatWalkingTime(station.walkingTime)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>附近没有地铁站</Text>
          )}
        </BlurView>

        {/* 备注（液态玻璃效果） */}
        {place.notes && (
          <BlurView
            intensity={isDark ? 30 : 50}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.section,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
                backgroundColor: isDark ? 'rgba(40,40,40,0.7)' : 'rgba(255,255,255,0.7)',
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>备注</Text>
            <Text style={[styles.notes, { color: colors.text }]}>{place.notes}</Text>
          </BlurView>
        )}

        {/* 标签（液态玻璃效果） */}
        {place.tags && place.tags.length > 0 && (
          <BlurView
            intensity={isDark ? 30 : 50}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.section,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
                backgroundColor: isDark ? 'rgba(40,40,40,0.7)' : 'rgba(255,255,255,0.7)',
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>标签</Text>
            <View style={styles.tagsContainer}>
              {place.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </BlurView>
        )}

        {/* 时间信息（液态玻璃效果） */}
        <BlurView
          intensity={isDark ? 30 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.section,
            {
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
              backgroundColor: isDark ? 'rgba(40,40,40,0.7)' : 'rgba(255,255,255,0.7)',
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>收藏时间</Text>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {formatDate(place.createdAt)}
          </Text>
        </BlurView>
      </ScrollView>

      {/* 底部操作栏（液态玻璃效果） */}
      <BlurView
        intensity={isDark ? 50 : 80}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.bottomBar,
          {
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
            backgroundColor: isDark ? 'rgba(20,20,20,0.9)' : 'rgba(255,255,255,0.9)',
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleNavigation}
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.actionIcon}>🧭</Text>
          <Text style={styles.actionText}>导航</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShare}
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>分享</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          style={[styles.actionButton, { backgroundColor: '#F44336' }]}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
          <Text style={styles.actionText}>删除</Text>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // 头部（液态玻璃）
  header: {
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
  },
  editIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // 区块样式（液态玻璃）
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  basicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  address: {
    fontSize: 16,
    marginBottom: 4,
  },
  rating: {
    fontSize: 16,
    color: '#FFD700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  iconItemSelected: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  iconEmoji: {
    fontSize: 24,
  },
  stationItem: {
    marginBottom: 12,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  stationDistance: {
    fontSize: 14,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
  },
  notes: {
    fontSize: 16,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  tagText: {
    fontSize: 14,
    color: '#2196F3',
  },
  timeText: {
    fontSize: 16,
  },
  // 底部操作栏（液态玻璃）
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    gap: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default DetailScreen;
