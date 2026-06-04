import React, { useState, useRef, useCallback, useEffect } from 'react';
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
import GlowBall from './src/components/GlowBall';
import { FavoritePlace } from './src/types';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, PanResponder,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

const TABS = [
  { key: 'map', label: '地图', icon: '🗺️' },
  { key: 'search', label: '搜索', icon: '🔍' },
  { key: 'favorites', label: '收藏', icon: '⭐' },
  { key: 'settings', label: '设置', icon: '⚙️' },
];
const MAX_DW = 800;

const bezier = (t: number, a: number, b: number, c: number, d: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

function AppContent() {
  const { colors, isDark } = useTheme();
  const [screen, setScreen] = useState<'map' | 'search' | 'detail' | 'settings' | 'import' | 'edit'>('map');
  const [prevScreen, setPrevScreen] = useState<'map' | 'search' | 'settings'>('map');
  const [activeTab, setActiveTab] = useState(0);
    const [selectedPlace, setSelectedPlace] = useState<FavoritePlace | null>(null);

  const [sw, setSw] = useState(SW);
  useEffect(() => {
    const s = Dimensions.addEventListener('change', ({ window }) => setSw(window.width));
    return () => s?.remove();
  }, []);

  const large = sw > 1000;
  const dw = Math.min(sw - 32, MAX_DW);

  // Dock 定位：edge=贴边方向, offset=沿边的偏移
  const [dockPos, setDockPos] = useState({ edge: 'bottom' as 'bottom' | 'left' | 'right', offset: sw / 2 });

  const vert = dockPos.edge !== 'bottom';
  const ts = vert ? 56 : (dw - 16) / TABS.length;
  // 底部时限制最大 tab 宽度
  const tsClamped = vert ? ts : Math.min(ts, 100);

  // 动画
  const ballP = useRef(new Animated.Value(activeTab)).current;
  const ballSx = useRef(new Animated.Value(1)).current;
  const ballSy = useRef(new Animated.Value(1)).current;
  const pageFade = useRef(new Animated.Value(1)).current;
  const dragStart = useRef({ x: 0, y: 0, mx: 0, my: 0 });
  const didDrag = useRef(false);

  // 光球动画（纯视觉）
  const moveBall = useCallback((from: number, to: number) => {
    ballP.setValue(from);
    ballSx.setValue(1);
    ballSy.setValue(1);
    const dir = to > from ? 1 : -1;
    const t0 = Date.now();
    const frame = () => {
      const p = Math.min((Date.now() - t0) / 500, 1);
      const e = bezier(p, 0, 0.25, 0.75, 1);
      ballP.setValue(from + (to - from) * e);
      ballSx.setValue(1 + dir * 0.18 * Math.sin(p * Math.PI) * (1 - p));
      ballSy.setValue(1 - dir * 0.10 * Math.sin(p * Math.PI) * (1 - p));
      if (p < 1) requestAnimationFrame(frame);
      else { ballSx.setValue(1); ballSy.setValue(1); }
    };
    requestAnimationFrame(frame);
  }, [ballP, ballSx, ballSy]);

  // 页面切换——快速淡入淡出，无闪黑
  const switchScreen = useCallback((s: string) => {
    // 记录上一个主页面（用于返回）
    if (screen === 'map' || screen === 'search' || screen === 'settings') {
      setPrevScreen(screen);
    }
    pageFade.setValue(1);
    Animated.sequence([
      Animated.timing(pageFade, { toValue: 0.92, duration: 60, useNativeDriver: true }),
      Animated.timing(pageFade, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    setScreen(s as any);
  }, [pageFade, screen]);

  // Tab 点击
  const onTab = useCallback((i: number, key: string) => {
    if (didDrag.current) { didDrag.current = false; return; }
    if (i === activeTab) return;
    const prev = activeTab;
    setActiveTab(i);
    switchScreen(key === 'favorites' ? 'map' : key);
    moveBall(prev, i);
  }, [activeTab, moveBall, switchScreen]);

  // Dock 拖拽——跟随手指，松手贴边
  const [dragOff, setDragOff] = useState({ dx: 0, dy: 0, active: false });
  const dockPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        didDrag.current = false;
        dragStart.current = { x: 0, y: 0, mx: 0, my: 0 };
      },
      onPanResponderMove: (_, g) => {
        didDrag.current = true;
        setDragOff({ dx: g.dx, dy: g.dy, active: true });
      },
      onPanResponderRelease: (_, g) => {
        setDragOff({ dx: 0, dy: 0, active: false });
        const vx = g.vx, vy = g.vy;
        const ex = g.moveX, ey = g.moveY;

        let edge: 'bottom' | 'left' | 'right' = dockPos.edge;
        let offset = dockPos.offset;

        if (Math.abs(vx) > Math.abs(vy) && Math.abs(vx) > 200) {
          edge = vx > 0 ? 'right' : 'left';
          offset = Math.max(100, Math.min(SH - 100, ey));
        } else if (Math.abs(vy) > 200) {
          edge = 'bottom';
          offset = Math.max(100, Math.min(sw - 100, ex));
        } else {
          const dL = ex, dR = sw - ex, dB = SH - ey;
          if (dL < dR && dL < dB) { edge = 'left'; offset = Math.max(100, Math.min(SH - 100, ey)); }
          else if (dR < dL && dR < dB) { edge = 'right'; offset = Math.max(100, Math.min(SH - 100, ey)); }
          else { edge = 'bottom'; offset = Math.max(100, Math.min(sw - 100, ex)); }
        }

        setDockPos({ edge, offset });
      },
    })
  ).current;

  // 页面渲染——保持地图常驻避免重载
  const show = ['map', 'search', 'settings'].includes(screen);
  const showMap = screen !== 'detail' && screen !== 'edit';

  return (
    <View style={[h.con, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* 页面叠化容器 */}
      <Animated.View style={[h.content, { opacity: pageFade }]}>
        {/* 地图常驻，不卸载 */}
        <View style={[h.screenLayer, { display: showMap ? 'flex' : 'none' }]}>
          <MapScreen
            onSearchPress={() => switchScreen('search')}
            onPlacePress={(p: FavoritePlace) => { setSelectedPlace(p); switchScreen('detail'); }}
          />
        </View>
        {screen === 'search' && (
          <View style={h.screenLayer}>
            <SearchScreen
              onBack={() => switchScreen('map')}
              onPlaceSelect={(p: FavoritePlace) => { setSelectedPlace(p); switchScreen('detail'); }}
            />
          </View>
        )}
        {screen === 'detail' && selectedPlace && (
          <View style={h.screenLayer}>
            <DetailScreen place={selectedPlace} onBack={() => switchScreen(prevScreen)} onEdit={(p: FavoritePlace) => { setSelectedPlace(p); switchScreen('edit'); }} />
          </View>
        )}
        {screen === 'settings' && (
          <View style={h.screenLayer}>
            <SettingsScreen onImportPress={() => switchScreen('import')} />
          </View>
        )}
        {screen === 'import' && (
          <View style={h.screenLayer}>
            <ImportScreen onBack={() => switchScreen('settings')} />
          </View>
        )}
        {screen === 'edit' && selectedPlace && (
          <View style={h.screenLayer}>
            <EditScreen place={selectedPlace} onBack={() => switchScreen('detail')} onSave={(p: FavoritePlace) => { setSelectedPlace(p); switchScreen('detail'); }} />
          </View>
        )}
      </Animated.View>

      {/* Dock——纯 CSS 锚定 + 拖拽跟随 */}
      {show && (
        <Animated.View
          {...dockPan.panHandlers}
          style={[
            dockPos.edge === 'left'
              ? { position: 'absolute', left: 16, top: dockPos.offset - 130, width: 72 }
              : dockPos.edge === 'right'
              ? { position: 'absolute', right: 16, top: dockPos.offset - 130, width: 72 }
              : { position: 'absolute', bottom: 24, left: dockPos.offset - (large ? Math.min(dw, MAX_DW) / 2 : dw / 2), width: large ? Math.min(dw, MAX_DW) : dw },
            dragOff.active && { transform: [{ translateX: dragOff.dx }, { translateY: dragOff.dy }] } as any,
          ]}
        >
          <View style={h.wrap}>
            <BlurView intensity={10} tint={isDark ? 'dark' : 'light'}
              style={[h.blur, { backgroundColor: isDark ? 'rgba(15,15,20,0.12)' : 'rgba(255,255,255,0.12)', paddingVertical: vert ? 16 : 12, paddingHorizontal: vert ? 12 : 8 }]}>
              <View style={[h.fresnel, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.10)' }]} />
              {/* 光球 */}
              <Animated.View
                style={[
                  h.ball,
                  vert ? { top: 12 + ts / 2, left: 0 } : { top: 30, left: 8 + tsClamped / 2 },
                  { transform: [
                    vert ? { translateY: Animated.multiply(ballP, ts + 4) } : { translateX: Animated.multiply(ballP, tsClamped) },
                    { scaleX: ballSx }, { scaleY: ballSy },
                  ] },
                ]}
              >
                <GlowBall size={vert ? 36 : 52} isDark={isDark} />
              </Animated.View>

              {/* Tabs */}
              <View style={[h.tabs, vert ? h.tabsV : h.tabsH]}>
                {TABS.map((t, i) => {
                  const on = i === activeTab;
                  return (
                    <TouchableOpacity
                      key={t.key}
                      style={vert ? [h.tabV, { height: ts }] : [h.tabH, { width: tsClamped }]}
                      onPress={() => onTab(i, t.key)}
                      activeOpacity={0.7}
                    >
                      <Animated.Text style={[h.icon, { transform: [{ scale: on ? 1.1 : 1 }] }]}>
                        {t.icon}
                      </Animated.Text>
                      <Text style={[h.label, {
                        color: on ? (isDark ? '#FFFFFF' : '#1A1A1A')
                                 : (isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'),
                        fontWeight: on ? '600' : '400',
                      }]}>
                        {t.label}
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

export default function App() {
  return (
    <ThemeProvider>
      <FavoritesProvider>
        <AppContent />
      </FavoritesProvider>
    </ThemeProvider>
  );
}

const h = StyleSheet.create({
  con: { flex: 1 },
  content: { flex: 1, position: 'relative' },
  screenLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  dock: { position: 'absolute', zIndex: 100 },
  wrap: { borderRadius: 28, overflow: 'hidden', position: 'relative' },
  chromatic: {
    position: 'absolute', top: -1, left: -1, right: -1, bottom: -1,
    borderRadius: 29, borderWidth: 2, opacity: 0.5,
  },
  blur: {
    borderRadius: 28, overflow: 'hidden', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 24, elevation: 15,
  },
  fresnel: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  ball: { position: 'absolute', alignItems: 'center', justifyContent: 'center', width: 0, height: 0 },
  tabs: { position: 'relative', zIndex: 1 },
  tabsH: { flexDirection: 'row' },
  tabsV: { flexDirection: 'column' },
  tabH: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  tabV: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  icon: { fontSize: 20, marginBottom: 2 },
  label: { fontSize: 10, fontWeight: '500' },
});
