import React, { useState, useRef, useCallback } from 'react';
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
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 底部标签栏配置
const TAB_ITEMS = [
  { key: 'map', label: '地图', icon: '🗺️' },
  { key: 'search', label: '搜索', icon: '🔍' },
  { key: 'favorites', label: '收藏', icon: '⭐' },
  { key: 'settings', label: '设置', icon: '⚙️' },
];

const TAB_COUNT = TAB_ITEMS.length;
const DOCK_PADDING = 8;
const DOCK_MARGIN = 16;
const TAB_WIDTH = (SCREEN_WIDTH - DOCK_MARGIN * 2 - DOCK_PADDING * 2) / TAB_COUNT;

// 物理弹簧参数 - 流体动画
const SPRING_CONFIG = {
  // 光球位移 - 流体姿态，较低阻尼产生更流畅的运动
  ball: {
    stiffness: 150,
    damping: 12,
    mass: 1.2,
    useNativeDriver: true,
  },
  // 光球缩放 - 柔和的缩放
  ballScale: {
    stiffness: 200,
    damping: 18,
    mass: 0.8,
    useNativeDriver: true,
  },
  // Dock 拖拽
  dockDrag: {
    stiffness: 180,
    damping: 16,
    mass: 1,
    useNativeDriver: true,
  },
};

// 主应用内容
function AppContent() {
  const { colors, isDark } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<
    'map' | 'search' | 'detail' | 'settings' | 'import' | 'edit'
  >('map');
  const [selectedPlace, setSelectedPlace] = useState<FavoritePlace | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // 光球动画值
  const ballPositionX = useRef(new Animated.Value(0)).current;
  const ballScale = useRef(new Animated.Value(1)).current;
  const ballOpacity = useRef(new Animated.Value(1)).current;
  const ballGlow = useRef(new Animated.Value(0.8)).current;

  // Dock 拖拽动画值
  const dockTranslateX = useRef(new Animated.Value(0)).current;
  const dockDragOffset = useRef(0);

  // 记录光球起始位置
  const ballStartX = useRef(0);

  // 计算标签位置
  const getTabCenterX = useCallback(
    (index: number) => {
      return index * TAB_WIDTH + TAB_WIDTH / 2;
    },
    []
  );

  // Dock 拖拽手势
  const dockPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderGrant: () => {
        dockDragOffset.current = (dockTranslateX as any)._value;
      },
      onPanResponderMove: (_, gestureState) => {
        // 拖拽位置滞后手指（速度越大滞后越明显）
        const lagFactor = Math.max(0.3, 1 - Math.abs(gestureState.vx) * 0.1);
        const targetX = dockDragOffset.current + gestureState.dx * lagFactor;

        // 限制范围
        const maxX = 50;
        const minX = -50;
        const clampedX = Math.max(minX, Math.min(maxX, targetX));

        dockTranslateX.setValue(clampedX);
      },
      onPanResponderRelease: (_, gestureState) => {
        // 松手后过冲小幅震荡后回弹归位
        Animated.spring(dockTranslateX, {
          toValue: 0,
          ...SPRING_CONFIG.dockDrag,
        }).start();
      },
    })
  ).current;

  // 光球跃迁动画 - 流体姿态
  const animateBallTransition = useCallback(
    (fromIndex: number, toIndex: number, callback: () => void) => {
      const fromX = getTabCenterX(fromIndex);
      const toX = getTabCenterX(toIndex);

      // 设置初始位置
      ballPositionX.setValue(fromX);
      ballStartX.current = fromX;

      // 重置动画值
      ballScale.setValue(1);
      ballOpacity.setValue(1);

      // 流体动画：位移和缩放同时进行
      // 位移：流体姿态，弹簧阻尼曲线
      Animated.spring(ballPositionX, {
        toValue: toX,
        ...SPRING_CONFIG.ball,
      }).start();

      // 缩放：起飞时略微放大，落地时柔和回弹
      Animated.sequence([
        // 起飞放大
        Animated.spring(ballScale, {
          toValue: 1.2,
          ...SPRING_CONFIG.ballScale,
        }),
        // 落地回弹
        Animated.spring(ballScale, {
          toValue: 0.95,
          ...SPRING_CONFIG.ballScale,
        }),
        // 恢复正常
        Animated.spring(ballScale, {
          toValue: 1,
          ...SPRING_CONFIG.ballScale,
        }),
      ]).start();

      // 动画完成后执行页面切换
      setTimeout(() => {
        callback();
      }, 400);
    },
    [getTabCenterX, ballPositionX, ballScale, ballOpacity]
  );

  // 处理标签点击
  const handleTabPress = useCallback(
    (index: number, key: string) => {
      if (index === activeTab) return;

      const fromIndex = activeTab;
      const toIndex = index;

      // 光球跃迁动画，完成后切换页面
      animateBallTransition(fromIndex, toIndex, () => {
        setActiveTab(toIndex);
        if (key === 'favorites') {
          setCurrentScreen('map');
        } else {
          setCurrentScreen(key as any);
        }
      });
    },
    [activeTab, animateBallTransition]
  );

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
        return <MapScreen onSearchPress={handleSearchPress} onPlacePress={handlePlaceSelect} />;
      case 'search':
        return <SearchScreen onBack={handleBack} onPlaceSelect={handlePlaceSelect} />;
      case 'detail':
        return selectedPlace ? (
          <DetailScreen place={selectedPlace} onBack={handleBack} onEdit={handleEdit} />
        ) : null;
      case 'settings':
        return <SettingsScreen onImportPress={handleImportPress} />;
      case 'import':
        return <ImportScreen onBack={() => setCurrentScreen('settings')} />;
      case 'edit':
        return selectedPlace ? (
          <EditScreen place={selectedPlace} onBack={() => setCurrentScreen('detail')} onSave={handleEditSave} />
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
      <View style={styles.content}>{renderScreen()}</View>

      {/* 底部液态玻璃 Dock */}
      {showTabBar && (
        <Animated.View
          style={[styles.dockContainer, { transform: [{ translateX: dockTranslateX }] }]}
          {...dockPanResponder.panHandlers}
        >
          {/* 液态玻璃背景层 */}
          <View style={styles.dockGlassWrapper}>
            {/* 色散彩边效果（RGB 通道错位） */}
            <View
              style={[
                styles.dockChromatic,
                {
                  borderColor: isDark
                    ? 'rgba(100, 180, 255, 0.15)'
                    : 'rgba(100, 180, 255, 0.2)',
                },
              ]}
            />

            {/* 主模糊层 */}
            <BlurView
              intensity={isDark ? 25 : 40}
              tint={isDark ? 'dark' : 'light'}
              style={[
                styles.dockBlur,
                {
                  backgroundColor: isDark
                    ? 'rgba(10, 10, 15, 0.55)'
                    : 'rgba(245, 245, 255, 0.55)',
                },
              ]}
            >
              {/* 菲涅尔角度高光反射层 */}
              <View
                style={[
                  styles.dockFresnel,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(255, 255, 255, 0.15)',
                  },
                ]}
              />

              {/* 弥散光球指示器 */}
              <Animated.View
                style={[
                  styles.lightBall,
                  {
                    transform: [
                      { translateX: Animated.add(ballPositionX, -TAB_WIDTH / 2) },
                      { scale: ballScale },
                    ],
                    opacity: ballOpacity,
                  },
                ]}
              >
                {/* 最外层弥散光晕 - 低透明度 */}
                <View
                  style={[
                    styles.ballGlowOuter,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(255, 255, 255, 0.08)',
                    },
                  ]}
                />
                {/* 中层弥散光晕 */}
                <View
                  style={[
                    styles.ballGlowMiddle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : 'rgba(255, 255, 255, 0.18)',
                    },
                  ]}
                />
                {/* 内层光晕 */}
                <View
                  style={[
                    styles.ballGlowInner,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.25)'
                        : 'rgba(255, 255, 255, 0.35)',
                    },
                  ]}
                />
                {/* 核心高亮 - 最亮 */}
                <View
                  style={[
                    styles.ballCore,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.5)'
                        : 'rgba(255, 255, 255, 0.7)',
                    },
                  ]}
                />
              </Animated.View>

              {/* Tab 选项 */}
              <View style={styles.tabsContainer}>
                {TAB_ITEMS.map((item, index) => {
                  const isActive = index === activeTab;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={styles.tabItem}
                      onPress={() => handleTabPress(index, item.key)}
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
                            color: isActive
                              ? isDark
                                ? '#FFFFFF'
                                : '#212121'
                              : isDark
                              ? 'rgba(255,255,255,0.5)'
                              : 'rgba(0,0,0,0.4)',
                            fontWeight: isActive ? '600' : '400',
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </BlurView>
          </View>
        </Animated.View>
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
  // Dock 容器
  dockContainer: {
    position: 'absolute',
    bottom: 24,
    left: DOCK_MARGIN,
    right: DOCK_MARGIN,
    zIndex: 100,
  },
  dockGlassWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  // 色散彩边
  dockChromatic: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 29,
    borderWidth: 2,
    opacity: 0.6,
  },
  // 主模糊层
  dockBlur: {
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: DOCK_PADDING,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 15,
  },
  // 菲涅尔高光
  dockFresnel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  // 光球容器
  lightBall: {
    position: 'absolute',
    top: 4,
    left: DOCK_PADDING,
    width: TAB_WIDTH,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 最外层弥散光晕
  ballGlowOuter: {
    position: 'absolute',
    width: TAB_WIDTH + 32,
    height: 80,
    borderRadius: 40,
  },
  // 中层弥散光晕
  ballGlowMiddle: {
    position: 'absolute',
    width: TAB_WIDTH + 16,
    height: 68,
    borderRadius: 34,
  },
  // 内层光晕
  ballGlowInner: {
    position: 'absolute',
    width: TAB_WIDTH + 4,
    height: 60,
    borderRadius: 30,
  },
  // 核心高亮
  ballCore: {
    width: TAB_WIDTH - 4,
    height: 52,
    borderRadius: 26,
  },
  // Tab 容器
  tabsContainer: {
    flexDirection: 'row',
    position: 'relative',
    zIndex: 1,
  },
  tabItem: {
    width: TAB_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
  },
});
