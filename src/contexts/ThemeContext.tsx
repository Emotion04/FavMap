import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { UserSettings } from '../types';
import { SettingsStorage } from '../services/storage';
import { COLORS } from '../utils/constants';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  themeSetting: 'light' | 'dark' | 'system';
  colors: typeof COLORS.light;
  isDark: boolean;
  updateTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'system',
    defaultIcon: '⭐',
    mapStyle: 'standard',
    activeProvider: 'amap',
  });

  // 加载设置
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await SettingsStorage.get();
      setSettings(data);
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  };

  // 计算当前主题
  const getCurrentTheme = (): ThemeType => {
    if (settings.theme === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return settings.theme as ThemeType;
  };

  const theme = getCurrentTheme();
  const colors = COLORS[theme];
  const isDark = theme === 'dark';

  // 更新主题
  const updateTheme = async (newTheme: 'light' | 'dark' | 'system') => {
    const newSettings = { ...settings, theme: newTheme };
    await SettingsStorage.save(newSettings);
    setSettings(newSettings);
  };

  const value: ThemeContextType = {
    theme,
    themeSetting: settings.theme,
    colors,
    isDark,
    updateTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
