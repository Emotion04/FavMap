import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { GlassCard, GlassInput, GlassButton } from '../components/glass';
import { MapProvider, MapProviderConfig, ApiConfig } from '../types';
import { ApiStorageService } from '../services/apiStorage';
import { MAP_PROVIDERS } from '../config/apiConfig';

interface SettingsScreenProps {
  onImportPress?: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onImportPress }) => {
  const { theme, themeSetting, colors, isDark, updateTheme } = useTheme();
  const { favorites, exportFavorites } = useFavorites();
  const [exporting, setExporting] = useState(false);
  const [activeProvider, setActiveProvider] = useState<MapProvider>('amap');
  const [providerConfigs, setProviderConfigs] = useState<MapProviderConfig[]>([]);
  const [expandedProvider, setExpandedProvider] = useState<MapProvider | null>(null);
  const [saving, setSaving] = useState(false);

  // 加载配置
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const provider = await ApiStorageService.getActiveProvider();
      setActiveProvider(provider);
      const configs = await ApiStorageService.getAllProviderConfigs();
      setProviderConfigs(configs);
      setExpandedProvider(provider);
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  // 切换活跃提供商
  const handleSetActiveProvider = useCallback(async (provider: MapProvider) => {
    try {
      await ApiStorageService.setActiveProvider(provider);
      setActiveProvider(provider);
      Alert.alert('成功', `已切换到${MAP_PROVIDERS.find((p) => p.id === provider)?.name}`);
    } catch (error) {
      Alert.alert('错误', '切换失败');
    }
  }, []);

  // 更新 API Key
  const handleUpdateApiKey = useCallback((providerId: MapProvider, apiId: string, value: string) => {
    setProviderConfigs((prev) =>
      prev.map((provider) =>
        provider.id === providerId
          ? {
              ...provider,
              apis: provider.apis.map((api) =>
                api.id === apiId ? { ...api, apiKey: value } : api
              ),
            }
          : provider
      )
    );
  }, []);

  // 更新安全密钥
  const handleUpdateSecurityCode = useCallback((providerId: MapProvider, apiId: string, value: string) => {
    setProviderConfigs((prev) =>
      prev.map((provider) =>
        provider.id === providerId
          ? {
              ...provider,
              apis: provider.apis.map((api) =>
                api.id === apiId ? { ...api, securityCode: value } : api
              ),
            }
          : provider
      )
    );
  }, []);

  // 保存提供商配置
  const handleSaveProviderConfig = useCallback(async (provider: MapProviderConfig) => {
    setSaving(true);
    try {
      await ApiStorageService.saveProviderConfig(provider);
      Alert.alert('成功', `${provider.name} 配置已保存`);
    } catch (error) {
      Alert.alert('错误', '保存失败');
    } finally {
      setSaving(false);
    }
  }, []);

  // 导出数据
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const json = await exportFavorites();
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(json);
        Alert.alert('成功', '数据已复制到剪贴板');
      } else {
        const { Share } = require('react-native');
        await Share.share({ title: 'FavMap 收藏数据', message: json });
      }
    } catch (error) {
      console.error('导出失败:', error);
      Alert.alert('错误', '导出失败');
    } finally {
      setExporting(false);
    }
  }, [exportFavorites]);

  // 渲染 API 配置项（液态玻璃效果）
  const renderApiConfig = useCallback((provider: MapProviderConfig, api: ApiConfig) => (
    <View key={api.id} style={styles.apiItem}>
      <Text style={[styles.apiName, { color: colors.text }]}>{api.name}</Text>
      <Text style={[styles.apiDescription, { color: colors.textSecondary }]}>{api.description}</Text>
      <TextInput
        style={[
          styles.apiInput,
          {
            color: colors.text,
            borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          },
        ]}
        value={api.apiKey}
        onChangeText={(value) => handleUpdateApiKey(provider.id, api.id, value)}
        placeholder={`输入 ${api.name}`}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {api.id === 'amap_js' && (
        <>
          <Text style={[styles.apiName, { color: colors.text, marginTop: 12 }]}>安全密钥</Text>
          <Text style={[styles.apiDescription, { color: colors.textSecondary }]}>JS API v2.0 鉴权必需</Text>
          <TextInput
            style={[
              styles.apiInput,
              {
                color: colors.text,
                borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              },
            ]}
            value={api.securityCode || ''}
            onChangeText={(value) => handleUpdateSecurityCode(provider.id, api.id, value)}
            placeholder="输入安全密钥"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </>
      )}
    </View>
  ), [colors, isDark, handleUpdateApiKey, handleUpdateSecurityCode]);

  // 渲染提供商卡片（液态玻璃效果）
  const renderProviderCard = useCallback((provider: MapProviderConfig) => {
    const isActive = activeProvider === provider.id;
    const isExpanded = expandedProvider === provider.id;

    return (
      <BlurView
        key={provider.id}
        intensity={isDark ? 30 : 50}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.providerCard,
          isActive && styles.providerCardActive,
          {
            borderColor: isActive
              ? colors.primary
              : isDark
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(255,255,255,0.4)',
            backgroundColor: isDark ? 'rgba(40,40,40,0.7)' : 'rgba(255,255,255,0.7)',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setExpandedProvider(isExpanded ? null : provider.id)}
          style={styles.providerHeader}
        >
          <View style={styles.providerInfo}>
            <Text style={styles.providerIcon}>{provider.icon}</Text>
            <View style={styles.providerText}>
              <View style={styles.providerNameRow}>
                <Text style={[styles.providerName, { color: colors.text }]}>{provider.name}</Text>
                {isActive && (
                  <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.activeBadgeText}>使用中</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.providerDesc, { color: colors.textSecondary }]}>
                {provider.description}
              </Text>
            </View>
          </View>
          <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
            {isExpanded ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.providerContent}>
            {provider.apis.map((api) => renderApiConfig(provider, api))}
            <View style={styles.providerActions}>
              <TouchableOpacity
                onPress={() => handleSaveProviderConfig(provider)}
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>{saving ? '保存中...' : '保存配置'}</Text>
              </TouchableOpacity>
              {!isActive && (
                <TouchableOpacity
                  onPress={() => handleSetActiveProvider(provider.id)}
                  style={[styles.activateButton, { borderColor: colors.primary }]}
                >
                  <Text style={[styles.activateButtonText, { color: colors.primary }]}>设为默认</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </BlurView>
    );
  }, [activeProvider, expandedProvider, colors, isDark, saving, renderApiConfig, handleSaveProviderConfig, handleSetActiveProvider]);

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>设置</Text>
      </BlurView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 主题设置（液态玻璃效果） */}
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🎨 主题</Text>
          <View style={styles.themeOptions}>
            {(['light', 'dark', 'system'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => updateTheme(t)}
                style={[
                  styles.themeOption,
                  themeSetting === t && styles.themeOptionSelected,
                ]}
              >
                <Text style={styles.themeIcon}>
                  {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '⚙️'}
                </Text>
                <Text style={[styles.themeText, { color: colors.text }]}>
                  {t === 'light' ? '浅色' : t === 'dark' ? '深色' : '跟随系统'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>

        {/* 地图 API 配置 */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionContainerTitle, { color: colors.text }]}>🗺️ 地图 API 配置</Text>
          <Text style={[styles.sectionContainerSubtitle, { color: colors.textSecondary }]}>
            选择地图提供商并配置 API Key
          </Text>
          {providerConfigs.map(renderProviderCard)}
        </View>

        {/* 数据管理（液态玻璃效果） */}
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📦 数据管理</Text>
          <View style={styles.dataInfo}>
            <Text style={[styles.dataText, { color: colors.text }]}>收藏数量：{favorites.length} 个</Text>
          </View>
          <View style={styles.dataActions}>
            <TouchableOpacity
              onPress={handleExport}
              style={[styles.dataButton, { backgroundColor: colors.primary }]}
              disabled={exporting}
            >
              <Text style={styles.dataButtonText}>{exporting ? '导出中...' : '导出数据'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onImportPress}
              style={[styles.dataButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.dataButtonText}>导入数据</Text>
            </TouchableOpacity>
          </View>
        </BlurView>

        {/* 关于（液态玻璃效果） */}
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ℹ️ 关于</Text>
          <View style={styles.aboutContent}>
            <Text style={[styles.aboutText, { color: colors.text }]}>FavMap - 收藏地图应用</Text>
            <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>版本 1.0.0</Text>
            <Text style={[styles.aboutDescription, { color: colors.textSecondary }]}>
              支持高德、腾讯、百度地图
            </Text>
          </View>
        </BlurView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // 头部（液态玻璃）
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  // 区块样式（液态玻璃）
  section: {
    marginBottom: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  // 区块容器
  sectionContainer: {
    marginBottom: 16,
  },
  sectionContainerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  sectionContainerSubtitle: {
    fontSize: 14,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  // 主题选项
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  themeOptionSelected: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  themeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  themeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // 提供商卡片（液态玻璃）
  providerCard: {
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  providerCardActive: {
    borderWidth: 2,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  providerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  providerText: {
    flex: 1,
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadgeText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  providerDesc: {
    fontSize: 14,
  },
  expandIcon: {
    fontSize: 16,
  },
  providerContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  // API 配置项
  apiItem: {
    marginBottom: 16,
  },
  apiName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  apiDescription: {
    fontSize: 13,
    marginBottom: 8,
  },
  apiInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  // 操作按钮
  providerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  activateButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  activateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // 数据管理
  dataInfo: {
    marginBottom: 16,
  },
  dataText: {
    fontSize: 16,
  },
  dataActions: {
    flexDirection: 'row',
    gap: 12,
  },
  dataButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  dataButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  // 关于
  aboutContent: {
    alignItems: 'center',
  },
  aboutText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    marginBottom: 8,
  },
  aboutDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SettingsScreen;
