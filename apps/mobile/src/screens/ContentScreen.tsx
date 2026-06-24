import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { AppText } from '../components/Typography';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'Content'>;

// Help / Privacy / Terms. The backend content endpoint (admin-editable
// content_pages) is a later stage, so this shows a placeholder for now (flagged).
export function ContentScreen({ route }: Props) {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const { type } = route.params;
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppText variant="h2" style={styles.title}>
        {t(`content.${type}`)}
      </AppText>
      <AppText variant="body" color="muted">
        {t('content.empty')}
      </AppText>
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    content: { padding: 24 },
    title: { marginBottom: 12 },
  });
