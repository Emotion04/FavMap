import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

interface GlassModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
  style?: ViewStyle;
}

const GlassModal: React.FC<GlassModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  style,
}) => {
  const { isDark, colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <BlurView
          intensity={60}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blurOverlay}
        />
      </TouchableOpacity>

      <View style={styles.centeredView}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <BlurView
            intensity={30}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.modalView, style]}
          >
            {/* 头部 */}
            {(title || showCloseButton) && (
              <View style={styles.header}>
                {title && (
                  <Text style={[styles.title, { color: colors.text }]}>
                    {title}
                  </Text>
                )}
                {showCloseButton && (
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* 内容 */}
            <View style={styles.content}>
              {children}
            </View>
          </BlurView>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  blurOverlay: {
    flex: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalView: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

export default GlassModal;
