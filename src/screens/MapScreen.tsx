import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, StyleSheet, Dimensions, TouchableOpacity, Text, Alert,
  Platform, ScrollView, Animated, PanResponder,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import { useFavorites } from '../contexts/FavoritesContext';
import { useTheme } from '../contexts/ThemeContext';
import WebMap from '../components/WebMap';
import { FavoritePlace } from '../types';
import { DEFAULT_CENTER } from '../utils/constants';

const { width: SW, height: SH } = Dimensions.get('window');

type CardPosition = 'collapsed' | 'half' | 'expanded';

interface MapScreenProps {
  onSearchPress: () => void;
  onPlacePress: (place: FavoritePlace) => void;
}

const MapScreen: React.FC<MapScreenProps> = ({ onSearchPress, onPlacePress }) => {
  const { favorites } = useFavorites();
  const { colors, isDark } = useTheme();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [cardPos, setCardPos] = useState<CardPosition>('half');
  const [sw, setSw] = useState(SW);
  const [sh, setSh] = useState(SH);

  useEffect(() => {
    const s = Dimensions.addEventListener('change', ({ window }) => {
      setSw(window.width); setSh(window.height);
    });
    return () => s?.remove();
  }, []);

  // 卡片始终在底部，最小 500px
  const cardMinW = Math.max(280, sw * 0.22);
  const [cardWidth, setCardWidth] = useState(cardMinW);

  // 右边缘拖拽调宽度
  const resizeRef = useRef({ startW: cardMinW, lastDx: 0 });
  const resizePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 3,
      onPanResponderGrant: () => {
        resizeRef.current.startW = cardWidth;
        resizeRef.current.lastDx = 0;
      },
      onPanResponderMove: (_, g) => {
        const delta = g.dx - resizeRef.current.lastDx;
        resizeRef.current.lastDx = g.dx;
        const newW = Math.max(cardMinW, Math.min(sw - 16, resizeRef.current.startW + g.dx));
        setCardWidth(newW);
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  // 动画：垂直滑动
  const animY = useRef(new Animated.Value(SH * 0.5)).current;
  const lastY = useRef(SH * 0.5);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        animY.setOffset(lastY.current); animY.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        const clamped = Math.max(SH * 0.15 - lastY.current, Math.min(SH * 0.85 - lastY.current, g.dy));
        animY.setValue(clamped);
      },
      onPanResponderRelease: (_, g) => {
        animY.flattenOffset();
        const cur = lastY.current + g.dy;
        const vel = g.vy;
        let pos: CardPosition;
        if (vel > 300) pos = 'collapsed';
        else if (vel < -300) pos = 'expanded';
        else if (cur > SH * 0.7) pos = 'collapsed';
        else if (cur < SH * 0.3) pos = 'expanded';
        else pos = 'half';
        snapTo(pos);
      },
    })
  ).current;

  const snapTo = useCallback((pos: CardPosition) => {
    setCardPos(pos);
    let v: number;
    switch (pos) { case 'collapsed': v = SH * 0.85; break; case 'half': v = SH * 0.5; break; case 'expanded': v = SH * 0.15; break; }
    lastY.current = v;
    Animated.spring(animY, { toValue: v, useNativeDriver: true, bounciness: 10, speed: 14 }).start();
  }, [animY, sh]);

  // 位置
  useEffect(() => { getUserLocation(); }, []);
  const getUserLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      if (Platform.OS === 'web' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (p) => setUserLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
          () => setUserLocation(DEFAULT_CENTER),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
      } else if (Platform.OS !== 'web') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setUserLocation(DEFAULT_CENTER); return; }
        const l = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setUserLocation({ latitude: l.coords.latitude, longitude: l.coords.longitude });
      }
    } catch { setUserLocation(DEFAULT_CENTER); }
    setLocationLoading(false);
  }, []);

  const onPlace = useCallback((p: FavoritePlace) => onPlacePress(p), [onPlacePress]);

  const renderMap = () => {
    if (Platform.OS === 'web') {
      return <WebMap favorites={favorites} onPlacePress={onPlace} userLocation={userLocation} />;
    }
    return <NativeMap userLocation={userLocation} favorites={favorites} onPlacePress={onPlace} />;
  };

  // 收藏列表内容
  const cardContent = (
    <>
      <View style={[st.cardHead, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <Text style={[st.cardTitle, { color: colors.text }]}>🗺️ 收藏</Text>
        <Text style={[st.cardSub, { color: colors.textSecondary }]}>{favorites.length} 个地点</Text>
      </View>
      <ScrollView style={st.cardScroll} showsVerticalScrollIndicator={false}>
        {favorites.length === 0 ? (
          <View style={st.empty}>
            <Text style={st.emptyIcon}>⭐</Text>
            <Text style={[st.emptyText, { color: colors.text }]}>还没有收藏</Text>
          </View>
        ) : favorites.map(place => (
          <TouchableOpacity key={place.id} onPress={() => onPlace(place)} activeOpacity={0.8}>
            <BlurView intensity={isDark ? 15 : 25} tint={isDark ? 'dark' : 'light'}
              style={[st.placeCard, { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.3)', backgroundColor: isDark ? 'rgba(20,20,20,0.4)' : 'rgba(255,255,255,0.4)' }]}>
              <View style={st.placeRow}>
                <Text style={st.placeIcon}>{place.icon}</Text>
                <View style={st.placeInfo}>
                  <Text style={[st.placeName, { color: colors.text }]} numberOfLines={1}>{place.name}</Text>
                  <Text style={[st.placeAddr, { color: colors.textSecondary }]} numberOfLines={1}>{place.address}</Text>
                </View>
                <Text style={[st.placeArrow, { color: colors.textSecondary }]}>›</Text>
              </View>
            </BlurView>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );

  return (
    <View style={st.con}>
      {/* 全屏地图 */}
      <View style={st.mapWrap}>{renderMap()}</View>

      {/* 统一设计的顶部栏 */}
      <View style={st.topBar}>
        <BlurView intensity={10} tint={isDark ? 'dark' : 'light'}
          style={[st.topBadge, st.glassEdge, { backgroundColor: isDark ? 'rgba(15,15,15,0.12)' : 'rgba(255,255,255,0.12)' }]}>
          <Text style={[st.topBadgeText, { color: colors.text }]}>⭐ {favorites.length}</Text>
        </BlurView>
        <TouchableOpacity onPress={onSearchPress} activeOpacity={0.8} style={{ flex: 1 }}>
          <BlurView intensity={10} tint={isDark ? 'dark' : 'light'}
            style={[st.searchBtn, st.glassEdge, { backgroundColor: isDark ? 'rgba(15,15,15,0.12)' : 'rgba(255,255,255,0.12)' }]}>
            <Text style={st.searchIcon}>🔍</Text>
            <Text style={[st.searchPla, { color: colors.textSecondary }]}>搜索地点...</Text>
          </BlurView>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => snapTo(cardPos === 'collapsed' ? 'half' : 'collapsed')} activeOpacity={0.7}>
          <BlurView intensity={10} tint={isDark ? 'dark' : 'light'}
            style={[st.ctrlBtn, st.glassEdge, { backgroundColor: isDark ? 'rgba(15,15,15,0.12)' : 'rgba(255,255,255,0.12)' }]}>
            <Text style={st.ctrlIcon}>{cardPos === 'collapsed' ? '🔼' : '🔽'}</Text>
          </BlurView>
        </TouchableOpacity>
        <TouchableOpacity onPress={getUserLocation} activeOpacity={0.7} disabled={locationLoading}>
          <BlurView intensity={10} tint={isDark ? 'dark' : 'light'}
            style={[st.ctrlBtn, st.glassEdge, { backgroundColor: isDark ? 'rgba(15,15,15,0.12)' : 'rgba(255,255,255,0.12)' }]}>
            <Text style={[st.ctrlIcon, locationLoading && { opacity: 0.5 }]}>{locationLoading ? '⏳' : '📍'}</Text>
          </BlurView>
        </TouchableOpacity>
      </View>

      {/* 比例尺 */}
      <View style={st.scale}>
        <BlurView intensity={10} tint={isDark ? 'dark' : 'light'}
          style={[st.scaleIn, st.glassEdge, { backgroundColor: isDark ? 'rgba(15,15,15,0.12)' : 'rgba(255,255,255,0.12)' }]}>
          <View style={[st.scaleLine, { backgroundColor: colors.text }]} />
          <Text style={[st.scaleLabel, { color: colors.textSecondary }]}>100m</Text>
        </BlurView>
      </View>

      {/* 底部卡片——从底部生长，可调宽度 */}
      <Animated.View
        style={[
          st.card,
          { left: 0, width: cardWidth, bottom: 0, height: '100%', transform: [{ translateY: animY }], userSelect: 'none', WebkitUserSelect: 'none' } as any,
        ]}
        {...pan.panHandlers}
      >
        <BlurView intensity={12} tint={isDark ? 'dark' : 'light'}
          style={[st.cardIn, { borderTopLeftRadius: 24, borderTopRightRadius: 24 }, st.glassEdgeStrong, { backgroundColor: isDark ? 'rgba(12,12,18,0.25)' : 'rgba(255,255,255,0.25)' }]}>
          {/* 拖动条 */}
          <View style={st.dragBar}>
            <View style={[st.dragLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />
          </View>
          {/* 右边缘拖拽调宽度 */}
          <View style={[st.resizeHandle, { right: 0 }]} {...resizePan.panHandlers}>
            <View style={[st.resizeLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]} />
          </View>
          {cardContent}
        </BlurView>
      </Animated.View>
    </View>
  );
};

// 原生地图占位
function NativeMap({ userLocation, favorites, onPlacePress }: any) {
  const [M, setM] = useState<any>(null);
  const [P, setP] = useState<any>(null);
  const ref = useRef<any>(null);
  useEffect(() => {
    try { const m = require('react-native-maps'); setM(() => m.default); setP(() => m.Marker); } catch {}
  }, []);
  useEffect(() => {
    if (ref.current && userLocation) ref.current.animateToRegion({ ...userLocation, latitudeDelta: 0.0922, longitudeDelta: 0.0421 }, 1000);
  }, [userLocation]);
  if (!M) return <View style={[st.map, { justifyContent: 'center', alignItems: 'center' }]}><Text>加载地图中...</Text></View>;
  return (
    <M ref={ref} style={st.map} initialRegion={{ ...(userLocation || DEFAULT_CENTER), latitudeDelta: 0.0922, longitudeDelta: 0.0421 }} showsUserLocation showsMyLocationButton={false}>
      {favorites.map((p: any) => <P key={p.id} coordinate={p.coordinate} title={p.name} description={p.address} onPress={() => onPlacePress(p)} />)}
    </M>
  );
}

const st = StyleSheet.create({
  con: { flex: 1 },
  mapWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  map: { width: '100%', height: '100%' },
  // 液态玻璃折射边效果
  glassEdge: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderTopColor: 'rgba(255,255,255,0.35)',
    borderLeftColor: 'rgba(255,255,255,0.25)',
    borderRightColor: 'rgba(180,180,220,0.15)',
    borderBottomColor: 'rgba(180,180,220,0.10)',
    overflow: 'hidden',
  },
  glassEdgeStrong: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    borderTopColor: 'rgba(255,255,255,0.45)',
    borderLeftColor: 'rgba(255,255,255,0.30)',
    borderRightColor: 'rgba(200,200,240,0.20)',
    borderBottomColor: 'rgba(200,200,240,0.12)',
    overflow: 'hidden',
  },
  // 顶部栏
  topBar: { position: 'absolute', top: 50, left: 16, right: 16, zIndex: 100, flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBadge: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 24 },
  topBadgeText: { fontSize: 16, fontWeight: '600' },
  searchBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, borderWidth: 1, overflow: 'hidden' },
  searchIcon: { fontSize: 20, marginRight: 12 },
  searchPla: { fontSize: 16 },
  ctrlBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, overflow: 'hidden' },
  ctrlIcon: { fontSize: 22 },
  // 比例尺
  scale: { position: 'absolute', top: 110, left: 16, zIndex: 50 },
  scaleIn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1, gap: 6 },
  scaleLine: { width: 30, height: 2 },
  scaleLabel: { fontSize: 11 },
  // 卡片
  card: { position: 'absolute', zIndex: 90 },
  cardIn: { flex: 1, borderWidth: 1, borderBottomWidth: 0, overflow: 'hidden', paddingBottom: 80 },
  dragBar: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  dragLine: { width: 40, height: 4, borderRadius: 2 },
  resizeHandle: { position: 'absolute', top: 0, bottom: 0, width: 12, zIndex: 10, justifyContent: 'center', alignItems: 'center', cursor: 'col-resize' as any },
  resizeLine: { width: 3, height: 40, borderRadius: 1.5 },
  cardHead: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1 },
  cardTitle: { fontSize: 22, fontWeight: '600', marginBottom: 2 },
  cardSub: { fontSize: 13 },
  cardScroll: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  empty: { alignItems: 'center', paddingTop: 40, paddingBottom: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600' },
  placeCard: { marginBottom: 12, padding: 16, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  placeRow: { flexDirection: 'row', alignItems: 'center' },
  placeIcon: { fontSize: 26, marginRight: 10 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  placeAddr: { fontSize: 14 },
  placeArrow: { fontSize: 24 },
});

export default MapScreen;
