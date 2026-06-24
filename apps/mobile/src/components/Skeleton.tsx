import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

/** Simple skeleton block with a soft pulse (PRD-02 §4 — skeletons, not spinners). */
export function Skeleton({
  height = 64,
  width = '100%',
  radius,
  style,
}: {
  height?: number;
  width?: number | `${number}%`;
  radius?: number;
  style?: object;
}) {
  const t = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.block,
        {
          height,
          width,
          opacity,
          backgroundColor: t.colors.skeleton,
          borderRadius: radius ?? t.radius.md,
        },
        style,
      ]}
    />
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} style={{ marginBottom: 10 }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { overflow: 'hidden' },
});
