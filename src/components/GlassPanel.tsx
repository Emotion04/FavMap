import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';

interface GlassPanelProps {
  children: ReactNode;
  intensity?: number;
  opacity?: number;
  borderRadius?: number;
  style?: ViewStyle;
  interactive?: boolean;
  borderLight?: boolean;
  chromatic?: boolean;
}

const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  intensity = 12,
  opacity = 0.05,
  borderRadius = 24,
  style,
  interactive = false,
  borderLight = true,
  chromatic = true,
}) => {
  const { isDark } = useTheme();

  const glassBg = isDark
    ? `rgba(15,15,20,${opacity})`
    : `rgba(255,255,255,${opacity})`;

  const edgeColor = isDark
    ? `rgba(255,255,255,0.08)`
    : `rgba(255,255,255,0.35)`;

  const highlight = isDark
    ? 'rgba(255,255,255,0.04)'
    : 'rgba(255,255,255,0.12)';

  return (
    <View style={style}>
      {/* 色散彩边——RGB 三通道错位模拟折射 */}
      {chromatic && (
        <>
          <View style={[chroma.r, { borderRadius: borderRadius + 1, borderWidth: 1.5 }]} />
          <View style={[chroma.g, { borderRadius: borderRadius + 0.5, borderWidth: 1 }]} />
          <View style={[chroma.b, { borderRadius, borderWidth: 0.5 }]} />
        </>
      )}

      {/* 主模糊层 */}
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={[
          glass.base,
          {
            borderRadius,
            backgroundColor: glassBg,
            borderColor: edgeColor,
          },
        ]}
      >
        {/* 顶部高光——模拟光线入射 */}
        {borderLight && (
          <View
            style={[glass.highlight, { backgroundColor: highlight, borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }]}
            pointerEvents="none"
          />
        )}

        {/* 内容 */}
        {children}
      </BlurView>
    </View>
  );
};

const glass = StyleSheet.create({
  base: {
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
});

const chroma = StyleSheet.create({
  r: {
    position: 'absolute',
    top: -0.5, left: -0.5, right: -0.5, bottom: -0.5,
    borderColor: 'rgba(255,80,80,0.08)',
    pointerEvents: 'none',
    zIndex: -3,
  },
  g: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderColor: 'rgba(80,255,80,0.06)',
    pointerEvents: 'none',
    zIndex: -2,
  },
  b: {
    position: 'absolute',
    top: 0.5, left: 0.5, right: 0.5, bottom: 0.5,
    borderColor: 'rgba(80,80,255,0.10)',
    pointerEvents: 'none',
    zIndex: -1,
  },
});

export default GlassPanel;
