import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert, TextInput, Platform } from 'react-native';
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

      // 默认展开当前活跃的提供商
      setExpandedProvider(provider);
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  };

  // 切换活跃提供商
  const handleSetActiveProvider = async (provider: MapProvider) => {
    try {
      await ApiStorageService.setActiveProvider(provider);
      setActiveProvider(provider);
      Alert.alert('成功', `已切换到${MAP_PROVIDERS.find(p => p.id === provider)?.name}`);
    } catch (error) {
      Alert.alert('错误', '切换失败');
    }
  };

  // 更新 API Key
  const handleUpdateApiKey = (providerId: MapProvider, apiId: string, value: string) => {
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
  };

  // 更新安全密钥
  const handleUpdateSecurityCode = (providerId: MapProvider, apiId: string, value: string) => {
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
  };

  // 保存提供商配置
  const handleSaveProviderConfig = async (provider: MapProviderConfig) => {
    setSaving(true);
    try {
      await ApiStorageService.saveProviderConfig(provider);
      Alert.alert('成功', `${provider.name} 配置已保存`);
    } catch (error) {
      Alert.alert('错误', '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 导出数据
  const handleExport = async () => {
    setExporting(true);
    try {
      const json = await exportFavorites();
      if (Platform.OS === 'web') {
        // Web 版本复制到剪贴板
        await navigator.clipboard.writeText(json);
        Alert.alert('成功', '数据已复制到剪贴板');
      } else {
        const { Share } = require('react-native');
        await Share.share({
          title: 'FavMap 收藏数据',
          message: json,
        });
      }
    } catch (error) {
      console.error('导出失败:', error);
      Alert.alert('错误', '导出失败');
    } finally {
      setExporting(false);
    }
  };

  // 渲染 API 配置项
  const renderApiConfig = (provider: MapProviderConfig, api: ApiConfig) => (
    <View key={api.id} style={styles.apiItem}>
      <Text style={[styles.apiName, { color: colors.text }]}>{api.name}</Text>
      <Text style={[styles.apiDescription, { color: colors.textSecondary }]}>{api.description}</Text>

      <TextInput
        style={[styles.apiInput, { color: colors.text, borderColor: colors.border }]}
        value={api.apiKey}
        onChangeText={(value) => handleUpdateApiKey(provider.id, api.id, value)}
        placeholder={`输入 ${api.name}`}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* 高德地图安全密钥 */}
      {api.id === 'amap_js' && (
        <>
          <Text style={[styles.apiName, { color: colors.text, marginTop: 12 }]}>安全密钥</Text>
          <Text style={[styles.apiDescription, { color: colors.textSecondary }]}>
            JS API v2.0 鉴权必需
          </Text>
          <TextInput
            style={[styles.apiInput, { color: colors.text, borderColor: colors.border }]}
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
  );

  // 渲染提供商卡片
  const renderProviderCard = (provider: MapProviderConfig) => {
    const isActive = activeProvider === provider.id;
    const isExpanded = expandedProvider === provider.id;

    return (
      <GlassCard
        key={provider.id}
        style={{
          ...styles.providerCard,
          ...(isActive ? styles.providerCardActive : {}),
        }}
      >
        {/* 提供商头部 */}
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
              <Text style={[styles.providerDesc, { color: colors.textSecondary }]}>{provider.description}</Text>
            </View>
          </View>
          <Text style={[styles.expandIcon, { color: colors.textSecondary }]}>
            {isExpanded ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {/* 展开的配置区域 */}
        {isExpanded && (
          <View style={styles.providerContent}>
            {/* API 配置 */}
            {provider.apis.map((api) => renderApiConfig(provider, api))}

            {/* 操作按钮 */}
            <View style={styles.providerActions}>
              <TouchableOpacity
                onPress={() => handleSaveProviderConfig(provider)}
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? '保存中...' : '保存配置'}
                </Text>
              </TouchableOpacity>

              {!isActive && (
                <TouchableOpacity
                  onPress={() => handleSetActiveProvider(provider.id)}
                  style={[styles.activateButton, { borderColor: colors.primary }]}
                >
                  <Text style={[styles.activateButtonText, { color: colors.primary }]}>
                    设为默认
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </GlassCard>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>设置</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 主题设置 */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🎨 主题</Text>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              onPress={() => updateTheme('light')}
              style={[styles.themeOption, themeSetting === 'light' && styles.themeOptionSelected]}
            >
              <Text style={styles.themeIcon}>☀️</Text>
              <Text style={[styles.themeText, { color: colors.text }]}>浅色</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateTheme('dark')}
              style={[styles.themeOption, themeSetting === 'dark' && styles.themeOptionSelected]}
            >
              <Text style={styles.themeIcon}>🌙</Text>
              <Text style={[styles.themeText, { color: colors.text }]}>深色</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => updateTheme('system')}
              style={[styles.themeOption, themeSetting === 'system' && styles.themeOptionSelected]}
            >
              <Text style={styles.themeIcon}>⚙️</Text>
              <Text style={[styles.themeText, { color: colors.text }]}>跟随系统</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* 地图 API 配置 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, paddingHorizontal: 16 }]}>
            🗺️ 地图 API 配置
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, paddingHorizontal: 16 }]}>
            选择地图提供商并配置 API Key
          </Text>

          {providerConfigs.map(renderProviderCard)}
        </View>

        {/* 数据管理 */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>📦 数据管理</Text>
          <View style={styles.dataInfo}>
            <Text style={[styles.dataText, { color: colors.text }]}>
              收藏数量：{favorites.length} 个
            </Text>
          </View>
          <View style={styles.dataActions}>
            <TouchableOpacity
              onPress={handleExport}
              style={[styles.dataButton, { backgroundColor: colors.primary }]}
              disabled={exporting}
            >
              <Text style={styles.dataButtonText}>
                {exporting ? '导出中...' : '导出数据'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onImportPress}
              style={[styles.dataButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.dataButtonText}>导入数据</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* 关于 */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>ℹ️ 关于</Text>
          <View style={styles.aboutContent}>
            <Text style={[styles.aboutText, { color: colors.text }]}>
              FavMap - 收藏地图应用
            </Text>
            <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>
              版本 1.0.0
            </Text>
            <Text style={[styles.aboutDescription, { color: colors.textSecondary }]}>
              支持高德、腾讯、百度地图
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  // 主题样式
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
  // 提供商样式
  providerCard: {
    marginBottom: 12,
    marginHorizontal: 16,
    padding: 0,
    overflow: 'hidden',
  },
  providerCardActive: {
    borderWidth: 2,
    borderColor: '#2196F3',
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
  // API 配置样式
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  // 操作按钮样式
  providerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
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
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  activateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // 数据管理样式
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
  // 关于样式
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
