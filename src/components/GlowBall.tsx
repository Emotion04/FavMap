import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

interface GlowBallProps {
  size?: number;
  isDark?: boolean;
}

const GlowBall: React.FC<GlowBallProps> = ({ size = 52, isDark = false }) => {
  // 多层SVG径向渐变叠加，模拟真实光线穿透液态玻璃的弥散效果
  // 特点：中心大范围均匀高亮 → 快速非线性衰减 → 边缘完全透明
  // 无分界，无极渐变，看起来像光线在玻璃介质中自然散射

  const layers = [
    // 第一层：极广环境光——大面积微弱照明
    {
      id: 'l0',
      width: size * 5,
      stops: [
        { offset: '0%', opacity: isDark ? 0.08 : 0.10 },
        { offset: '20%', opacity: isDark ? 0.05 : 0.06 },
        { offset: '40%', opacity: isDark ? 0.02 : 0.03 },
        { offset: '65%', opacity: 0 },
      ],
    },
    // 第二层：弥漫光——主体光照区域，大范围均匀
    {
      id: 'l1',
      width: size * 3.8,
      stops: [
        { offset: '0%', opacity: isDark ? 0.18 : 0.22 },
        { offset: '15%', opacity: isDark ? 0.17 : 0.20 },
        { offset: '30%', opacity: isDark ? 0.14 : 0.17 },
        { offset: '45%', opacity: isDark ? 0.08 : 0.10 },
        { offset: '60%', opacity: isDark ? 0.03 : 0.04 },
        { offset: '80%', opacity: 0 },
      ],
    },
    // 第三层：中级光——明显的亮度区域
    {
      id: 'l2',
      width: size * 2.6,
      stops: [
        { offset: '0%', opacity: isDark ? 0.28 : 0.33 },
        { offset: '20%', opacity: isDark ? 0.25 : 0.30 },
        { offset: '40%', opacity: isDark ? 0.18 : 0.22 },
        { offset: '55%', opacity: isDark ? 0.08 : 0.10 },
        { offset: '75%', opacity: isDark ? 0.02 : 0.03 },
        { offset: '90%', opacity: 0 },
      ],
    },
    // 第四层：核心高亮——最亮但仍有渐变，非硬边圆形
    {
      id: 'l3',
      width: size * 1.5,
      stops: [
        { offset: '0%', opacity: isDark ? 0.45 : 0.55 },
        { offset: '30%', opacity: isDark ? 0.35 : 0.42 },
        { offset: '55%', opacity: isDark ? 0.15 : 0.20 },
        { offset: '80%', opacity: 0 },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      {layers.map((layer) => (
        <Svg
          key={layer.id}
          width={layer.width}
          height={layer.width}
          style={[styles.svg, { width: layer.width, height: layer.width }]}
        >
          <Defs>
            <RadialGradient id={layer.id} cx="50%" cy="50%" rx="50%" ry="50%">
              {layer.stops.map((stop, i) => (
                <Stop
                  key={i}
                  offset={stop.offset}
                  stopColor={`rgba(255, 255, 255, ${stop.opacity})`}
                />
              ))}
            </RadialGradient>
          </Defs>
          <Circle
            cx={layer.width / 2}
            cy={layer.width / 2}
            r={layer.width / 2}
            fill={`url(#${layer.id})`}
          />
        </Svg>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
});

export default GlowBall;

