import React, { ReactNode } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

interface GlassFABProps {
  icon: string;
  onPress: () => void;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  extended?: boolean;
}

const GlassFAB: React.FC<GlassFABProps> = ({
  icon,
  onPress,
  label,
  size = 'medium',
  style,
  extended = false,
}) => {
  const { isDark, colors } = useTheme();

  const getSizeStyles = (): { container: ViewStyle; icon: { fontSize: number } } => {
    switch (size) {
      case 'small':
        return {
          container: { width: 40, height: 40 },
          icon: { fontSize: 20 },
        };
      case 'large':
        return {
          container: { width: 64, height: 64 },
          icon: { fontSize: 28 },
        };
      default:
        return {
          container: { width: 56, height: 56 },
          icon: { fontSize: 24 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.container, style]}
    >
      <BlurView
        intensity={30}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.fab,
          sizeStyles.container,
          extended && styles.extended,
        ]}
      >
        <Text style={[styles.icon, sizeStyles.icon]}>{icon}</Text>
        {extended && label && (
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        )}
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 100,
  },
  fab: {
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  extended: {
    paddingHorizontal: 20,
    borderRadius: 28,
    flexDirection: 'row',
  },
  icon: {},
  label: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GlassFAB;
