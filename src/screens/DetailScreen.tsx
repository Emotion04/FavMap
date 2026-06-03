import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Linking, Alert } from 'react-native';
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
  const { colors } = useTheme();
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
  const handleNavigation = () => {
    const { latitude, longitude } = place.coordinate;
    const name = encodeURIComponent(place.name);

    Alert.alert(
      '选择地图应用',
      '请选择要使用的地图应用',
      [
        {
          text: '高德地图',
          onPress: () => {
            const url = `amapuri://route/plan/?dlat=${latitude}&dlon=${longitude}&dname=${name}&dev=0&t=0`;
            Linking.openURL(url).catch(() => {
              Alert.alert('错误', '未安装高德地图');
            });
          },
        },
        {
          text: '百度地图',
          onPress: () => {
            const url = `baidumap://map/direction?destination=name:${name}|latlng:${latitude},${longitude}&mode=driving`;
            Linking.openURL(url).catch(() => {
              Alert.alert('错误', '未安装百度地图');
            });
          },
        },
        {
          text: '腾讯地图',
          onPress: () => {
            const url = `qqmap://map/routeplan?type=drive&to=${name}&tocoord=${latitude},${longitude}`;
            Linking.openURL(url).catch(() => {
              Alert.alert('错误', '未安装腾讯地图');
            });
          },
        },
        {
          text: '取消',
          style: 'cancel',
        },
      ]
    );
  };

  // 分享
  const handleShare = async () => {
    await ShareService.sharePlace(place);
  };

  // 删除
  const handleDelete = () => {
    Alert.alert(
      '确认删除',
      `确定要删除"${place.name}"吗？`,
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await removeFavorite(place.id);
            onBack();
          },
        },
      ]
    );
  };

  // 修改图标
  const handleChangeIcon = async (icon: string) => {
    await updateFavorite(place.id, { icon });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {place.name}
        </Text>
        <TouchableOpacity onPress={() => onEdit(place)} style={styles.editButton}>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 基本信息 */}
        <GlassCard style={styles.section}>
          <View style={styles.basicInfo}>
            <Text style={styles.icon}>{place.icon}</Text>
            <View style={styles.info}>
              <Text style={styles.name}>{place.name}</Text>
              <Text style={styles.address}>{place.address}</Text>
              {place.rating && (
                <Text style={styles.rating}>⭐ {place.rating.toFixed(1)}</Text>
              )}
            </View>
          </View>
        </GlassCard>

        {/* 图标选择 */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>选择图标</Text>
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
        </GlassCard>

        {/* 地铁站信息 */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>附近地铁站</Text>
          {loadingSubway ? (
            <Text style={styles.loadingText}>加载中...</Text>
          ) : subwayStations.length > 0 ? (
            subwayStations.map((station, index) => (
              <View key={index} style={styles.stationItem}>
                <Text style={styles.stationName}>🚇 {station.name}</Text>
                <Text style={styles.stationDistance}>
                  {formatDistance(station.distance)} · 步行{formatWalkingTime(station.walkingTime)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>附近没有地铁站</Text>
          )}
        </GlassCard>

        {/* 备注和标签 */}
        {place.notes && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>备注</Text>
            <Text style={styles.notes}>{place.notes}</Text>
          </GlassCard>
        )}

        {place.tags && place.tags.length > 0 && (
          <GlassCard style={styles.section}>
            <Text style={styles.sectionTitle}>标签</Text>
            <View style={styles.tagsContainer}>
              {place.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        )}

        {/* 时间信息 */}
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>收藏时间</Text>
          <Text style={styles.timeText}>{formatDate(place.createdAt)}</Text>
        </GlassCard>
      </ScrollView>

      {/* 底部操作栏 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handleNavigation} style={[styles.actionButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.actionIcon}>🧭</Text>
          <Text style={styles.actionText}>导航</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={[styles.actionButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionText}>分享</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={[styles.actionButton, { backgroundColor: '#F44336' }]}>
          <Text style={styles.actionIcon}>🗑️</Text>
          <Text style={styles.actionText}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
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
  section: {
    marginBottom: 16,
    padding: 16,
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
    opacity: 0.7,
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
    opacity: 0.7,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.5,
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
    opacity: 0.7,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
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
