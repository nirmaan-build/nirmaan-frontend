import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { AppText } from './Typography';

const SCREEN_H = Dimensions.get('window').height;

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Fraction of screen height the sheet may occupy. */
  heightRatio?: number;
}

/**
 * Smooth, spring-animated bottom sheet with a fade backdrop and drag-to-dismiss
 * on the handle. Pure Animated (no extra native deps) — feels native without
 * pulling in reanimated/gesture-handler. Replaces the stock Modal slide.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  heightRatio = 0.85,
}: Props) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  const animateClose = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_H,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMounted(false);
      cb?.();
    });
  };

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.setValue(SCREEN_H);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            damping: 22,
            stiffness: 240,
            mass: 0.9,
            useNativeDriver: true,
          }),
          Animated.timing(backdrop, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else if (mounted) {
      animateClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_e, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 120 || g.vy > 0.6) {
          animateClose(onClose);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 22,
            stiffness: 240,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  if (!mounted) return null;

  return (
    <Modal visible transparent statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          {
            maxHeight: SCREEN_H * heightRatio,
            paddingBottom: insets.bottom + 12,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.handleArea} {...pan.panHandlers}>
          <View style={styles.grabber} />
          {title ? (
            <View style={styles.head}>
              <AppText variant="title">{title}</AppText>
              <Pressable onPress={onClose} hitSlop={8}>
                <AppText variant="bodyStrong" color="primary">
                  {t('common.close')}
                </AppText>
              </Pressable>
            </View>
          ) : null}
        </View>
        {children}
      </Animated.View>
    </Modal>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: t.colors.overlay },
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: t.colors.bgElevated,
      borderTopLeftRadius: t.radius.xl,
      borderTopRightRadius: t.radius.xl,
      paddingHorizontal: 16,
      paddingTop: 8,
      ...t.elevation.lg,
    },
    handleArea: { paddingBottom: 4 },
    grabber: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: t.colors.border,
      marginBottom: 12,
    },
    head: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
  });
