import React, { ReactNode } from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

interface GlassInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  multiline?: boolean;
  numberOfLines?: number;
}

const GlassInput: React.FC<GlassInputProps> = ({
  value,
  onChangeText,
  placeholder,
  icon,
  rightIcon,
  style,
  inputStyle,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  onSubmitEditing,
  returnKeyType = 'done',
  multiline = false,
  numberOfLines = 1,
}) => {
  const { isDark, colors } = useTheme();

  return (
    <BlurView
      intensity={20}
      tint={isDark ? 'dark' : 'light'}
      style={[styles.container, style]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          {
            color: colors.text,
            height: multiline ? numberOfLines * 24 : 48,
          },
          inputStyle,
        ]}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  iconContainer: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
});

export default GlassInput;
