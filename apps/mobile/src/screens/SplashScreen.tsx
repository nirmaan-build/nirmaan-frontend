import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';
import { useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { AppText } from '../components/Typography';

/**
 * In-app splash shown while auth state hydrates (after the native bootsplash
 * hands off). Brand mark fades + scales in for a polished, native-feeling start.
 */
export function SplashScreen() {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 12,
        stiffness: 140,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
        <View style={styles.logo}>
          <AppText variant="display" style={styles.logoMark}>
            {t('common.appName').charAt(0)}
          </AppText>
        </View>
        <AppText variant="h1" style={styles.brand}>
          {t('common.appName')}
        </AppText>
      </Animated.View>
      <ActivityIndicator color="#ffffff" style={styles.spinner} />
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {
      width: 84,
      height: 84,
      borderRadius: t.radius.xl,
      backgroundColor: 'rgba(255,255,255,0.16)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    logoMark: { color: '#ffffff' },
    brand: { color: '#ffffff' },
    spinner: { position: 'absolute', bottom: 64 },
  });
