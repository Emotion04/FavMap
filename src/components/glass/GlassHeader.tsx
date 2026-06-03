import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

interface GlassHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  style?: ViewStyle;
  transparent?: boolean;
}

const GlassHeader: React.FC<GlassHeaderProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  style,
  transparent = false,
}) => {
  const { isDark, colors } = useTheme();

  if (transparent) {
    return (
      <View style={[styles.container, styles.transparent, style]}>
        <View style={styles.leftAction}>
          {leftAction}
        </View>
        <View style={styles.center}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <View style={styles.rightAction}>
          {rightAction}
        </View>
      </View>
    );
  }

  return (
    <BlurView
      intensity={40}
      tint={isDark ? 'dark' : 'light'}
      style={[styles.container, style]}
    >
      <View style={styles.leftAction}>
        {leftAction}
      </View>
      <View style={styles.center}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.rightAction}>
        {rightAction}
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 56, // 状态栏高度
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  leftAction: {
    minWidth: 40,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  rightAction: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default GlassHeader;
