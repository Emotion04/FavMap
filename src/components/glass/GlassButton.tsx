import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

interface GlassButtonProps {
  title?: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  disabled?: boolean;
  children?: ReactNode;
}

const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  icon,
  variant = 'secondary',
  size = 'medium',
  style,
  disabled = false,
  children,
}) => {
  const { isDark, colors } = useTheme();

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'small':
        return {
          container: { paddingVertical: 8, paddingHorizontal: 16 },
          text: { fontSize: 14 },
        };
      case 'large':
        return {
          container: { paddingVertical: 16, paddingHorizontal: 28 },
          text: { fontSize: 18 },
        };
      default:
        return {
          container: { paddingVertical: 12, paddingHorizontal: 24 },
          text: { fontSize: 16 },
        };
    }
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
          },
          text: {
            color: '#FFFFFF',
            fontWeight: '600',
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
          },
          text: {
            color: colors.primary,
          },
        };
      default:
        return {
          container: {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(255, 255, 255, 0.8)',
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.15)'
              : 'rgba(255, 255, 255, 0.5)',
          },
          text: {
            color: colors.text,
          },
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[style]}
    >
      <BlurView
        intensity={variant === 'ghost' ? 0 : 30}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.container,
          sizeStyles.container,
          variantStyles.container,
          disabled && styles.disabled,
        ]}
      >
        {icon && <>{icon}</>}
        {title && (
          <Text style={[styles.text, sizeStyles.text, variantStyles.text]}>
            {title}
          </Text>
        )}
        {children}
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    overflow: 'hidden',
  },
  text: {
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default GlassButton;
