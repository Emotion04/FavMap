import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import MapScreen from './src/screens/MapScreen';
import SearchScreen from './src/screens/SearchScreen';
import DetailScreen from './src/screens/DetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ImportScreen from './src/screens/ImportScreen';
import EditScreen from './src/screens/EditScreen';
import { FavoritePlace } from './src/types';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// 主应用内容
function AppContent() {
  const { colors, isDark } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<'map' | 'search' | 'detail' | 'settings' | 'import' | 'edit'>('map');
  const [selectedPlace, setSelectedPlace] = useState<FavoritePlace | null>(null);

  // 处理搜索按钮点击
  const handleSearchPress = () => {
    setCurrentScreen('search');
  };

  // 处理地点选择
  const handlePlaceSelect = (place: FavoritePlace) => {
    setSelectedPlace(place);
    setCurrentScreen('detail');
  };

  // 处理返回
  const handleBack = () => {
    setCurrentScreen('map');
    setSelectedPlace(null);
  };

  // 处理编辑
  const handleEdit = (place: FavoritePlace) => {
    setSelectedPlace(place);
    setCurrentScreen('edit');
  };

  // 处理导入按钮点击
  const handleImportPress = () => {
    setCurrentScreen('import');
  };

  // 处理编辑保存
  const handleEditSave = (place: FavoritePlace) => {
    setSelectedPlace(place);
    setCurrentScreen('detail');
  };

  // 渲染当前屏幕
  const renderScreen = () => {
    switch (currentScreen) {
      case 'map':
        return (
          <MapScreen
            onSearchPress={handleSearchPress}
            onPlacePress={handlePlaceSelect}
          />
        );
      case 'search':
        return (
          <SearchScreen
            onBack={handleBack}
            onPlaceSelect={handlePlaceSelect}
          />
        );
      case 'detail':
        return selectedPlace ? (
          <DetailScreen
            place={selectedPlace}
            onBack={handleBack}
            onEdit={handleEdit}
          />
        ) : null;
      case 'settings':
        return <SettingsScreen onImportPress={handleImportPress} />;
      case 'import':
        return <ImportScreen onBack={() => setCurrentScreen('settings')} />;
      case 'edit':
        return selectedPlace ? (
          <EditScreen
            place={selectedPlace}
            onBack={() => setCurrentScreen('detail')}
            onSave={handleEditSave}
          />
        ) : null;
      default:
        return null;
    }
  };

  // 是否显示底部标签栏
  const showTabBar = ['map', 'search', 'settings'].includes(currentScreen);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* 主内容区域 */}
      <View style={styles.content}>
        {renderScreen()}
      </View>

      {/* 底部标签栏 */}
      {showTabBar && (
        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentScreen('map')}
          >
            <Text style={styles.tabIcon}>🗺️</Text>
            <Text style={[styles.tabLabel, { color: currentScreen === 'map' ? colors.primary : colors.textSecondary }]}>
              地图
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentScreen('search')}
          >
            <Text style={styles.tabIcon}>🔍</Text>
            <Text style={[styles.tabLabel, { color: currentScreen === 'search' ? colors.primary : colors.textSecondary }]}>
              搜索
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentScreen('map')}
          >
            <Text style={styles.tabIcon}>⭐</Text>
            <Text style={[styles.tabLabel, { color: colors.textSecondary }]}>
              收藏
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setCurrentScreen('settings')}
          >
            <Text style={styles.tabIcon}>⚙️</Text>
            <Text style={[styles.tabLabel, { color: currentScreen === 'settings' ? colors.primary : colors.textSecondary }]}>
              设置
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// 主应用
export default function App() {
  return (
    <ThemeProvider>
      <FavoritesProvider>
        <AppContent />
      </FavoritesProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
  },
});
