import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

interface GlassBadgeProps {
  label: string;
  icon?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

const GlassBadge: React.FC<GlassBadgeProps> = ({
  label,
  icon,
  variant = 'default',
  size = 'small',
  style,
}) => {
  const { isDark, colors } = useTheme();

  const getVariantColor = (): string => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'success':
        return colors.success;
      case 'warning':
        return '#FFC107';
      case 'error':
        return colors.error;
      default:
        return isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'medium':
        return {
          container: { paddingVertical: 6, paddingHorizontal: 12 },
          text: { fontSize: 14 },
          icon: { fontSize: 16 },
        };
      default:
        return {
          container: { paddingVertical: 4, paddingHorizontal: 8 },
          text: { fontSize: 12 },
          icon: { fontSize: 14 },
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantColor = getVariantColor();

  return (
    <BlurView
      intensity={15}
      tint={isDark ? 'dark' : 'light'}
      style={[
        styles.container,
        sizeStyles.container,
        { backgroundColor: variantColor },
        style,
      ]}
    >
      {icon && (
        <Text style={[styles.icon, sizeStyles.icon]}>{icon}</Text>
      )}
      <Text
        style={[
          styles.text,
          sizeStyles.text,
          { color: variant === 'default' ? colors.text : '#FFFFFF' },
        ]}
      >
        {label}
      </Text>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    gap: 4,
    overflow: 'hidden',
  },
  icon: {},
  text: {
    fontWeight: '500',
  },
});

export default GlassBadge;
