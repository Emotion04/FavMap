import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert, TextInput, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites } from '../contexts/FavoritesContext';
import GlassCard from '../components/GlassCard';
import { AMapService } from '../services/amap';
import { FavoritePlace } from '../types';
import { generateId } from '../utils/helpers';

interface ImportScreenProps {
  onBack: () => void;
}

const ImportScreen: React.FC<ImportScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const { addFavorite } = useFavorites();
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  // 批量导入
  const handleImport = async () => {
    if (!importText.trim()) {
      Alert.alert('错误', '请输入要导入的地点');
      return;
    }

    // Web 平台提示
    if (Platform.OS === 'web') {
      Alert.alert(
        '提示',
        'Web 版本需要配置高德地图 API Key 才能使用批量导入功能。请在设置页面配置。',
        [{ text: '确定' }]
      );
      return;
    }

    setImporting(true);
    setResults(null);

    try {
      // 按行分割地点
      const lines = importText.split('\n').filter((line) => line.trim());
      let success = 0;
      let failed = 0;

      for (const line of lines) {
        try {
          // 搜索地点
          const searchResults = await AMapService.searchKeyword(line.trim());

          if (searchResults.length > 0) {
            const place = searchResults[0];

            // 获取地铁站信息
            const subwayStations = await AMapService.searchNearbySubway(
              place.coordinate.latitude,
              place.coordinate.longitude
            );

            // 添加收藏
            const newPlace: Omit<FavoritePlace, 'id' | 'createdAt' | 'updatedAt'> = {
              name: place.name,
              address: place.address,
              coordinate: place.coordinate,
              rating: place.rating,
              icon: '⭐',
              subwayStations,
            };

            await addFavorite(newPlace);
            success++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error('导入地点失败:', error);
          failed++;
        }
      }

      setResults({ success, failed });

      if (failed === 0) {
        Alert.alert('成功', `成功导入 ${success} 个地点`);
      } else {
        Alert.alert('完成', `成功 ${success} 个，失败 ${failed} 个`);
      }
    } catch (error) {
      console.error('批量导入失败:', error);
      Alert.alert('错误', '导入失败');
    } finally {
      setImporting(false);
    }
  };

  // 从 JSON 导入
  const handleImportJSON = async () => {
    if (!importText.trim()) {
      Alert.alert('错误', '请输入 JSON 数据');
      return;
    }

    setImporting(true);
    try {
      const places = JSON.parse(importText) as FavoritePlace[];

      for (const place of places) {
        const newPlace: Omit<FavoritePlace, 'id' | 'createdAt' | 'updatedAt'> = {
          name: place.name,
          address: place.address,
          coordinate: place.coordinate,
          rating: place.rating,
          icon: place.icon || '⭐',
          subwayStations: place.subwayStations,
        };
        await addFavorite(newPlace);
      }

      Alert.alert('成功', `成功导入 ${places.length} 个地点`);
    } catch (error) {
      console.error('JSON 导入失败:', error);
      Alert.alert('错误', '无效的 JSON 格式');
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>批量导入</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* 说明 */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>导入方式</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            方式一：每行输入一个地点名称，系统会自动搜索并收藏
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            方式二：输入 JSON 格式的收藏数据
          </Text>
        </GlassCard>

        {/* 输入区域 */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>输入内容</Text>
          <TextInput
            style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
            value={importText}
            onChangeText={setImportText}
            placeholder="每行一个地点名称，或输入 JSON 数据"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
        </GlassCard>

        {/* 操作按钮 */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleImport}
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            disabled={importing}
          >
            <Text style={styles.actionButtonText}>
              {importing ? '导入中...' : '按名称导入'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleImportJSON}
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            disabled={importing}
          >
            <Text style={styles.actionButtonText}>
              {importing ? '导入中...' : '按 JSON 导入'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 导入结果 */}
        {results && (
          <GlassCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>导入结果</Text>
            <Text style={[styles.resultText, { color: colors.text }]}>
              ✅ 成功：{results.success} 个
            </Text>
            {results.failed > 0 && (
              <Text style={[styles.resultText, { color: colors.error }]}>
                ❌ 失败：{results.failed} 个
              </Text>
            )}
          </GlassCard>
        )}
      </ScrollView>
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
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 150,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  resultText: {
    fontSize: 16,
    marginBottom: 8,
  },
});

export default ImportScreen;
