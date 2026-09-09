import React, { ReactNode } from 'react';
import { View, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';

// Web 端动态导入 liquid-glass-react，避免移动端报错
let LiquidGlassWeb: any = null;
if (Platform.OS === 'web') {
  try {
    LiquidGlassWeb = require('liquid-glass-react').default;
  } catch {}
}

interface Props {
  children: ReactNode;
  intensity?: number;    // 模糊强度 (0-100)，对标 expo-blur
  opacity?: number;      // 透明度 (0-1)
  style?: ViewStyle;
  borderRadius?: number;
  interactive?: boolean;
}

const LiquidGlass: React.FC<Props> = ({
  children,
  intensity = 10,
  opacity = 0.15,
  style,
  borderRadius = 24,
  interactive = false,
}) => {
  const { isDark } = useTheme();

  if (Platform.OS === 'web' && LiquidGlassWeb) {
    // Web：真实液态玻璃（SVG 位移滤镜 + CSS backdrop-filter + RGB 色散）
    return (
      <LiquidGlassWeb
        blurAmount={intensity / 160}
        saturation={isDark ? 120 : 140}
        aberrationIntensity={2}
        displacementScale={25}
        elasticity={0.12}
        cornerRadius={borderRadius}
        overLight={!isDark}
        interactive={interactive}
        style={{ ...style as any }}
      >
        {children}
      </LiquidGlassWeb>
    );
  }

  // 移动端 / Web 降级：expo-blur
  return (
    <BlurView
      intensity={intensity}
      tint={isDark ? 'dark' : 'light'}
      style={[
        {
          borderRadius,
          overflow: 'hidden' as const,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.25)',
        },
        style,
      ]}
    >
      <View style={{ backgroundColor: isDark ? `rgba(15,15,15,${opacity})` : `rgba(255,255,255,${opacity})` }}>
        {children}
      </View>
    </BlurView>
  );
};

export default LiquidGlass;
