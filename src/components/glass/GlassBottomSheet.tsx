import React, { ReactNode, useRef } from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GlassBottomSheetProps {
  children: ReactNode;
  snapPoints?: number[]; // 百分比数组，如 [15, 50, 85]
  initialSnap?: number; // 初始位置索引
  onSnapChange?: (index: number) => void;
  showDragIndicator?: boolean;
}

const GlassBottomSheet: React.FC<GlassBottomSheetProps> = ({
  children,
  snapPoints = [15, 50, 85],
  initialSnap = 1,
  onSnapChange,
  showDragIndicator = true,
}) => {
  const { isDark } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT * (1 - snapPoints[initialSnap] / 100))).current;
  const lastOffset = useRef(SCREEN_HEIGHT * (1 - snapPoints[initialSnap] / 100));
  const currentSnapIndex = useRef(initialSnap);

  const snapTo = (index: number) => {
    const targetY = SCREEN_HEIGHT * (1 - snapPoints[index] / 100);
    lastOffset.current = targetY;
    currentSnapIndex.current = index;
    onSnapChange?.(index);

    Animated.spring(translateY, {
      toValue: targetY,
      useNativeDriver: true,
      bounciness: 8,
      speed: 12,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        translateY.setOffset(lastOffset.current);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const minY = SCREEN_HEIGHT * (1 - snapPoints[snapPoints.length - 1] / 100);
        const maxY = SCREEN_HEIGHT * (1 - snapPoints[0] / 100);
        const newValue = gestureState.dy;
        const clampedValue = Math.max(
          minY - lastOffset.current,
          Math.min(maxY - lastOffset.current, newValue)
        );
        translateY.setValue(clampedValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const currentValue = lastOffset.current + gestureState.dy;
        const velocity = gestureState.vy;

        // 根据速度和位置找到最近的 snap 点
        let targetIndex = currentSnapIndex.current;
        const currentPercent = (1 - currentValue / SCREEN_HEIGHT) * 100;

        if (Math.abs(velocity) > 500) {
          // 快速滑动
          if (velocity > 0) {
            // 向下滑动，找更小的 snap 点
            targetIndex = Math.max(0, currentSnapIndex.current - 1);
          } else {
            // 向上滑动，找更大的 snap 点
            targetIndex = Math.min(snapPoints.length - 1, currentSnapIndex.current + 1);
          }
        } else {
          // 慢速滑动，找最近的 snap 点
          let minDistance = Infinity;
          snapPoints.forEach((point, index) => {
            const distance = Math.abs(currentPercent - point);
            if (distance < minDistance) {
              minDistance = distance;
              targetIndex = index;
            }
          });
        }

        snapTo(targetIndex);
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <BlurView
        intensity={30}
        tint={isDark ? 'dark' : 'light'}
        style={styles.content}
      >
        {showDragIndicator && (
          <View style={styles.dragIndicatorContainer}>
            <View style={[styles.dragIndicator, { backgroundColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }]} />
          </View>
        )}
        {children}
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    zIndex: 100,
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
});

export default GlassBottomSheet;
