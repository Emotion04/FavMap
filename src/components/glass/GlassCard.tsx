import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

interface GlassCardProps {
  children: ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  style?: ViewStyle;
  borderRadius?: number;
  noPadding?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = 20,
  tint = 'default',
  style,
  borderRadius = 16,
  noPadding = false,
}) => {
  const { isDark, colors } = useTheme();

  const resolvedTint = tint === 'default' ? (isDark ? 'dark' : 'light') : tint;

  const containerStyle: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(255, 255, 255, 0.5)',
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    } : {}),
  };

  const innerStyle: ViewStyle = {
    backgroundColor: isDark
      ? 'rgba(30, 30, 30, 0.85)'
      : 'rgba(255, 255, 255, 0.85)',
    padding: noPadding ? 0 : 16,
  };

  return (
    <BlurView
      intensity={intensity}
      tint={resolvedTint}
      style={[containerStyle, style]}
    >
      <View style={innerStyle}>
        {children}
      </View>
    </BlurView>
  );
};

export default GlassCard;
