import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert, Share, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useFavorites } from '../contexts/FavoritesContext';
import GlassCard from '../components/GlassCard';
import { AMapService, CityDistrict } from '../services/amap';
import { STORAGE_KEYS } from '../utils/constants';

interface SettingsScreenProps {
  onImportPress?: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onImportPress }) => {
  const { theme, themeSetting, colors, isDark, updateTheme } = useTheme();
  const { favorites, exportFavorites } = useFavorites();
  const [exporting, setExporting] = useState(false);
  const [amapApiKey, setAmapApiKey] = useState('');
  const [amapSecurityCode, setAmapSecurityCode] = useState('');
  const [amapWebApiKey, setAmapWebApiKey] = useState('');
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [districtCity, setDistrictCity] = useState('');
  const [districts, setDistricts] = useState<CityDistrict[] | null>(null);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // 加载 API Key 和安全密钥
  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const key = await AsyncStorage.getItem(STORAGE_KEYS.AMAP_API_KEY);
      const code = await AsyncStorage.getItem(STORAGE_KEYS.AMAP_SECURITY_CODE);
      const webKey = await AsyncStorage.getItem(STORAGE_KEYS.AMAP_WEB_API_KEY);
      if (key) setAmapApiKey(key);
      if (code) setAmapSecurityCode(code);
      if (webKey) setAmapWebApiKey(webKey);
    } catch (error) {
      console.error('加载 API Key 失败:', error);
    }
  };

  // 保存 API Key 和安全密钥
  const handleSaveApiKey = async () => {
    setSavingApiKey(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AMAP_API_KEY, amapApiKey);
      await AsyncStorage.setItem(STORAGE_KEYS.AMAP_SECURITY_CODE, amapSecurityCode);
      await AsyncStorage.setItem(STORAGE_KEYS.AMAP_WEB_API_KEY, amapWebApiKey);
      Alert.alert('成功', 'API Key 已保存');
    } catch (error) {
      console.error('保存 API Key 失败:', error);
      Alert.alert('错误', '保存失败');
    } finally {
      setSavingApiKey(false);
    }
  };

  // 导出数据
  const handleExport = async () => {
    setExporting(true);
    try {
      const json = await exportFavorites();
      await Share.share({
        title: 'FavMap 收藏数据',
        message: json,
      });
    } catch (error) {
      console.error('导出失败:', error);
      Alert.alert('错误', '导出失败');
    } finally {
      setExporting(false);
    }
  };

  // 导入数据
  const handleImport = () => {
    if (onImportPress) {
      onImportPress();
    } else {
      Alert.alert('提示', '导入功能开发中');
    }
  };

  // 切换主题
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    updateTheme(newTheme);
  };

  // 查询城市分区
  const handleQueryDistricts = async () => {
    if (!districtCity.trim()) return;
    setLoadingDistricts(true);
    setDistricts(null);
    try {
      const data = await AMapService.getCityDistricts(districtCity.trim());
      if (data.length === 0) {
        Alert.alert('提示', '未找到该城市的分区信息');
      } else {
        setDistricts(data);
      }
    } catch (error) {
      Alert.alert('错误', '查询失败，请检查网络和 API Key');
    } finally {
      setLoadingDistricts(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>设置</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* 主题设置 */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>主题</Text>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              onPress={() => handleThemeChange('light')}
              style={[
                styles.themeOption,
                themeSetting === 'light' && styles.themeOptionSelected,
              ]}
            >
              <Text style={styles.themeIcon}>☀️</Text>
              <Text style={[styles.themeText, { color: colors.text }]}>浅色</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleThemeChange('dark')}
              style={[
                styles.themeOption,
                themeSetting === 'dark' && styles.themeOptionSelected,
              ]}
            >
              <Text style={styles.themeIcon}>🌙</Text>
              <Text style={[styles.themeText, { color: colors.text }]}>深色</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleThemeChange('system')}
              style={[
                styles.themeOption,
                themeSetting === 'system' && styles.themeOptionSelected,
              ]}
            >
              <Text style={styles.themeIcon}>⚙️</Text>
              <Text style={[styles.themeText, { color: colors.text }]}>跟随系统</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* 高德地图 API 配置 */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>高德地图 API</Text>

          <Text style={[styles.apiLabel, { color: colors.text }]}>JS API Key（地图渲染）</Text>
          <TextInput
            style={[styles.apiKeyInput, { color: colors.text, borderColor: colors.border }]}
            value={amapApiKey}
            onChangeText={setAmapApiKey}
            placeholder="Web端(JS API) Key"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.apiLabel, { color: colors.text }]}>安全密钥</Text>
          <TextInput
            style={[styles.apiKeyInput, { color: colors.text, borderColor: colors.border }]}
            value={amapSecurityCode}
            onChangeText={setAmapSecurityCode}
            placeholder="securityJsCode"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.apiLabel, { color: colors.text }]}>Web 服务 Key（搜索/地点查询）</Text>
          <TextInput
            style={[styles.apiKeyInput, { color: colors.text, borderColor: colors.border }]}
            value={amapWebApiKey}
            onChangeText={setAmapWebApiKey}
            placeholder="Web服务 Key，用于搜索等功能"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.apiKeyHint, { color: colors.textSecondary }]}>
            地图渲染用 JS API Key+安全密钥；搜索用 Web 服务 Key
          </Text>
          <TouchableOpacity
            onPress={handleSaveApiKey}
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            disabled={savingApiKey}
          >
            <Text style={styles.saveButtonText}>
              {savingApiKey ? '保存中...' : '保存'}
            </Text>
          </TouchableOpacity>
        </GlassCard>

        {/* 数据管理 */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>数据管理</Text>
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
              onPress={handleImport}
              style={[styles.dataButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.dataButtonText}>导入数据</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* 城市分区查询 */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>🏙️ 城市分区</Text>
          <Text style={[styles.apiKeyHint, { color: colors.textSecondary }]}>
            输入城市名称，查看行政区划信息
          </Text>
          <View style={styles.districtInputRow}>
            <TextInput
              style={[styles.districtInput, { color: colors.text, borderColor: colors.border }]}
              value={districtCity}
              onChangeText={setDistrictCity}
              placeholder="例如：北京、上海、杭州"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleQueryDistricts}
            />
            <TouchableOpacity
              onPress={handleQueryDistricts}
              style={[styles.queryButton, { backgroundColor: colors.primary }]}
              disabled={loadingDistricts}
            >
              <Text style={styles.queryButtonText}>
                {loadingDistricts ? '...' : '查询'}
              </Text>
            </TouchableOpacity>
          </View>
          {districts && districts.length > 0 && (
            <View style={[styles.districtList, { borderColor: colors.border }]}>
              {districts.map((d, i) => (
                <View
                  key={d.name}
                  style={[
                    styles.districtItem,
                    i < districts.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                >
                  <View style={styles.districtInfo}>
                    <Text style={[styles.districtName, { color: colors.text }]}>{d.name}</Text>
                    <Text style={[styles.districtLevel, { color: colors.textSecondary }]}>
                      {d.level === 'district' ? '区/县' : d.level === 'street' ? '街道' : d.level}
                    </Text>
                  </View>
                  <Text style={[styles.districtCoord, { color: colors.textSecondary }]}>
                    {d.center.latitude.toFixed(4)}, {d.center.longitude.toFixed(4)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </GlassCard>

        {/* 关于 */}
        <GlassCard style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>关于</Text>
          <View style={styles.aboutContent}>
            <Text style={[styles.aboutText, { color: colors.text }]}>
              FavMap - 收藏地图应用
            </Text>
            <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>
              版本 1.0.0
            </Text>
            <Text style={[styles.aboutDescription, { color: colors.textSecondary }]}>
              一个帮助你收藏和管理喜欢地点的应用
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
    padding: 16,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  apiKeyHint: {
    fontSize: 14,
    marginBottom: 12,
  },
  apiLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 8,
  },
  apiKeyInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
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
  districtInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  districtInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  queryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  districtList: {
    borderTopWidth: 1,
    marginTop: 4,
  },
  districtItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  districtInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  districtName: {
    fontSize: 15,
    fontWeight: '500',
  },
  districtLevel: {
    fontSize: 12,
  },
  districtCoord: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
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
    lineHeight: 20,
  },
});

export default SettingsScreen;
