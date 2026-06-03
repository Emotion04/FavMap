import React, { useState, useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import MapScreen from './src/screens/MapScreen';
import SearchScreen from './src/screens/SearchScreen';
import DetailScreen from './src/screens/DetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ImportScreen from './src/screens/ImportScreen';
import EditScreen from './src/screens/EditScreen';
import { FavoritePlace } from './src/types';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 底部标签栏配置
const TAB_ITEMS = [
  { key: 'map', label: '地图', icon: '🗺️' },
  { key: 'search', label: '搜索', icon: '🔍' },
  { key: 'favorites', label: '收藏', icon: '⭐' },
  { key: 'settings', label: '设置', icon: '⚙️' },
];

// 主应用内容
function AppContent() {
  const { colors, isDark } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<'map' | 'search' | 'detail' | 'settings' | 'import' | 'edit'>('map');
  const [selectedPlace, setSelectedPlace] = useState<FavoritePlace | null>(null);

  // 动画值 - 光球位置
  const ballPosition = useRef(new Animated.Value(0)).current;
  const ballScale = useRef(new Animated.Value(1)).current;
  const ballOpacity = useRef(new Animated.Value(0.8)).current;

  // 计算每个标签的位置
  const tabWidth = (SCREEN_WIDTH - 64) / 4; // 减去左右边距

  // 更新光球位置
  useEffect(() => {
    const tabIndex = TAB_ITEMS.findIndex((item) => {
      if (item.key === 'favorites') return currentScreen === 'map';
      return item.key === currentScreen;
    });

    if (tabIndex >= 0) {
      Animated.spring(ballPosition, {
        toValue: tabIndex * tabWidth + tabWidth / 2,
        useNativeDriver: true,
        bounciness: 15,
        speed: 12,
      }).start();
    }
  }, [currentScreen, tabWidth]);

  // 处理标签点击
  const handleTabPress = (key: string) => {
    // 光球缩放动画
    Animated.sequence([
      Animated.timing(ballScale, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(ballScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // 切换页面
    if (key === 'favorites') {
      setCurrentScreen('map');
    } else {
      setCurrentScreen(key as any);
    }
  };

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

      {/* 底部悬浮标签栏（液态玻璃效果） */}
      {showTabBar && (
        <View style={styles.tabBarContainer}>
          {/* 液态玻璃背景 */}
          <BlurView
            intensity={isDark ? 20 : 30}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.tabBar,
              {
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)',
                backgroundColor: isDark ? 'rgba(15,15,15,0.5)' : 'rgba(255,255,255,0.5)',
              },
            ]}
          >
            {/* 光球指示器 */}
            <Animated.View
              style={[
                styles.lightBall,
                {
                  transform: [
                    { translateX: ballPosition },
                    { scale: ballScale },
                  ],
                  opacity: ballOpacity,
                },
              ]}
            />

            {/* 标签项 */}
            {TAB_ITEMS.map((item) => {
              const isActive = item.key === currentScreen || (item.key === 'favorites' && currentScreen === 'map');
              return (
                <TouchableOpacity
                  key={item.key}
                  style={styles.tabItem}
                  onPress={() => handleTabPress(item.key)}
                  activeOpacity={0.7}
                >
                  <Animated.Text
                    style={[
                      styles.tabIcon,
                      {
                        transform: [{ scale: isActive ? 1.1 : 1 }],
                      },
                    ]}
                  >
                    {item.icon}
                  </Animated.Text>
                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        color: isActive ? '#FFFFFF' : colors.textSecondary,
                        fontWeight: isActive ? '600' : '400',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </BlurView>
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
  tabBarContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 28,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 15,
    position: 'relative',
  },
  lightBall: {
    position: 'absolute',
    top: 4,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
  },
});
