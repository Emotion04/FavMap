import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

interface TabItem {
  key: string;
  label: string;
  icon: string;
}

interface GlassTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (key: string) => void;
}

const GlassTabBar: React.FC<GlassTabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
}) => {
  const { isDark, colors } = useTheme();

  return (
    <BlurView
      intensity={40}
      tint={isDark ? 'dark' : 'light'}
      style={styles.container}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>
              {tab.icon}
            </Text>
            <Text
              style={[
                styles.label,
                { color: colors.textSecondary },
                isActive && { color: colors.primary, fontWeight: '600' },
              ]}
            >
              {tab.label}
            </Text>
            {isActive && (
              <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  iconActive: {
    transform: [{ scale: 1.1 }],
  },
  label: {
    fontSize: 11,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 3,
    borderRadius: 1.5,
  },
});

export default GlassTabBar;
