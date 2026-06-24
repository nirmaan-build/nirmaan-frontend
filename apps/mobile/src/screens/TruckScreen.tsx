import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme, useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { useCart, useRemoveCartItem, useUpdateCartItem } from '../api/hooks';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SkeletonList } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { AppText } from '../components/Typography';
import type { CartItem } from '../api/types';
import { money, unitLabel } from '../lib/format';

/** How fast the quantity ticks while a stepper button is held down (ms). */
const HOLD_TICK_MS = 80;
const HOLD_DELAY_MS = 250;

export function TruckScreen() {
  const t = useT();
  const th = useTheme();
  const nav = useNavigation<any>();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useCart();

  const count = data?.total_item_count ?? 0;
  const items = data?.items ?? [];

  return (
    <View style={styles.container}>
      <Header onBack={() => nav.goBack()} showTruck={false} />

      {isLoading ? (
        <ScrollView contentContainerStyle={styles.content}>
          <SkeletonList rows={3} />
        </ScrollView>
      ) : count === 0 ? (
        <ScrollView contentContainerStyle={styles.content}>
          <EmptyState
            icon="cart"
            title={t('truck.emptyTitle')}
            body={t('truck.emptyBody')}
            actionLabel={t('categories.browseAll')}
            onAction={() => nav.navigate('Categories')}
            style={styles.empty}
          />
        </ScrollView>
      ) : (
        <>
          {/* Scrollable item list — the action bar below stays pinned. */}
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {/* All items grouped into one surface, split by hairline dividers. */}
            <Card style={styles.itemsCard}>
              {items.map((it: CartItem, i: number) => (
                <CartRow key={it.id} item={it} divided={i > 0} />
              ))}
            </Card>
          </ScrollView>

          {/* Pinned action bar — total + primary CTA, then callback. */}
          <View
            style={[styles.actionBar, { paddingBottom: 14 + insets.bottom }]}
          >
            <View style={styles.totalRow}>
              <View style={styles.totalLeft}>
                <AppText variant="label" color="muted">
                  {t('truck.estimatedValue').toUpperCase()}
                </AppText>
                <AppText style={styles.totalValue} numberOfLines={1}>
                  {money(data?.total_estimated_value ?? 0)}
                </AppText>
              </View>
              <Button
                title={t('truck.sendAsRequirement')}
                onPress={() => nav.navigate('PostRfq', {})}
                style={styles.primaryCta}
              />
            </View>
            <Pressable
              onPress={() => nav.navigate('RequestCallback')}
              style={({ pressed }) => [
                styles.callbackBtn,
                pressed && styles.pressed,
              ]}
            >
              <Icon name="phone" size={17} color={th.colors.primary} />
              <AppText style={styles.callbackText}>{t('callback.cta')}</AppText>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

/**
 * A single cart line. Owns a local "working" quantity so taps and press-and-hold
 * feel instant; the server is updated once on release (the cart mutation isn't
 * optimistic, so committing per-tick would spam the API and cause flicker).
 */
function CartRow({ item, divided }: { item: CartItem; divided: boolean }) {
  const th = useTheme();
  const styles = useThemedStyles(makeStyles);
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const serverQty = Number(item.quantity);
  const price = item.catalogItem.priceEstimate
    ? Number(item.catalogItem.priceEstimate)
    : 0;

  const [qty, setQtyState] = useState(serverQty);
  const qtyRef = useRef(serverQty);
  const editing = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Manual entry (tap the number to type any quantity).
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const closing = useRef(false);

  // Re-sync from the server only while the user isn't actively editing.
  useEffect(() => {
    if (!editing.current) {
      qtyRef.current = serverQty;
      setQtyState(serverQty);
    }
  }, [serverQty]);

  // Stop the repeat timer if the row unmounts mid-hold.
  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const step = (delta: number) => {
    const next = qtyRef.current + delta;
    if (next < 1) return; // floor at 1; removal is a separate action
    qtyRef.current = next;
    setQtyState(next);
  };

  const stopTimer = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  // Push the final quantity to the server once the press ends.
  const commit = () => {
    stopTimer();
    const target = qtyRef.current;
    if (target !== serverQty) {
      void updateItem
        .mutateAsync({ itemId: item.id, quantity: target })
        .finally(() => {
          editing.current = false;
        });
    } else {
      editing.current = false;
    }
  };

  const onPressInStep = (delta: number) => {
    editing.current = true;
    step(delta); // immediate single step on touch-down
  };

  const onLongPressStep = (delta: number) => {
    stopTimer();
    timer.current = setInterval(() => step(delta), HOLD_TICK_MS);
  };

  const beginTyping = () => {
    closing.current = false;
    editing.current = true;
    setText(String(qtyRef.current));
    setTyping(true);
  };

  // Parse the typed value, floor at 1, then commit to the server.
  const endTyping = () => {
    if (closing.current) return; // guard double-fire (submit + blur)
    closing.current = true;
    const parsed = parseInt(text, 10);
    const next = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
    qtyRef.current = next;
    setQtyState(next);
    setTyping(false);
    commit();
  };

  const isMin = qty <= 1;

  return (
    <View style={[styles.row, divided && styles.rowDivider]}>
      <View style={styles.thumb}>
        <Icon name="package" size={26} color={th.colors.primary} />
      </View>

      <View style={styles.mid}>
        <AppText variant="subtitle" numberOfLines={2}>
          {item.catalogItem.title}
        </AppText>
        <AppText variant="bodyStrong" style={styles.lineTotal}>
          {money(price * qty)}
        </AppText>
        <AppText variant="caption" color="muted">
          {money(item.catalogItem.priceEstimate)} /{' '}
          {unitLabel(item.catalogItem.unit)}
        </AppText>
      </View>

      <View style={styles.stepper}>
        {isMin ? (
          <Pressable
            style={styles.stepBtn}
            hitSlop={6}
            onPress={() => removeItem.mutate(item.id)}
            accessibilityLabel="Remove item"
          >
            <Icon name="trash" size={15} color={th.colors.danger} />
          </Pressable>
        ) : (
          <Pressable
            style={styles.stepBtn}
            hitSlop={6}
            delayLongPress={HOLD_DELAY_MS}
            onPressIn={() => onPressInStep(-1)}
            onLongPress={() => onLongPressStep(-1)}
            onPressOut={commit}
            accessibilityLabel="Decrease quantity"
          >
            <Icon name="minus" size={15} color={th.colors.text} />
          </Pressable>
        )}

        {typing ? (
          <TextInput
            ref={inputRef}
            style={styles.qtyInput}
            value={text}
            onChangeText={(s) => setText(s.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={6}
            autoFocus
            selectTextOnFocus
            onSubmitEditing={endTyping}
            onBlur={endTyping}
          />
        ) : (
          <Pressable
            onPress={beginTyping}
            hitSlop={8}
            accessibilityLabel="Edit quantity"
          >
            <AppText variant="subtitle" style={styles.qty} numberOfLines={1}>
              {String(qty)}
            </AppText>
          </Pressable>
        )}

        <Pressable
          style={styles.stepBtn}
          hitSlop={6}
          delayLongPress={HOLD_DELAY_MS}
          onPressIn={() => onPressInStep(1)}
          onLongPress={() => onLongPressStep(1)}
          onPressOut={commit}
          accessibilityLabel="Increase quantity"
        >
          <Icon name="plus" size={15} color={th.colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    content: { padding: 16, paddingBottom: 32, flexGrow: 1 },
    empty: { marginTop: 40 },

    // Item list — one grouped card with divided rows
    listContent: { padding: 16, paddingBottom: 24 },
    itemsCard: { padding: 0, overflow: 'hidden' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.border,
    },
    thumb: {
      width: 60,
      height: 60,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mid: { flex: 1, marginHorizontal: 12, gap: 2 },
    lineTotal: { marginTop: 2 },

    // Horizontal stepper: [-] qty [+]
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    stepBtn: {
      width: 32,
      height: 32,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.bg,
      borderWidth: 1,
      borderColor: t.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qty: {
      minWidth: 44,
      height: 32,
      lineHeight: 32,
      textAlign: 'center',
      paddingHorizontal: 8,
      borderRadius: t.radius.sm,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.bg,
      overflow: 'hidden',
      fontVariant: ['tabular-nums'],
    },
    qtyInput: {
      minWidth: 44,
      height: 32,
      paddingHorizontal: 8,
      paddingVertical: 0,
      textAlign: 'center',
      borderRadius: t.radius.sm,
      borderWidth: 1,
      borderColor: t.colors.primary,
      backgroundColor: t.colors.bg,
      color: t.colors.text,
      fontSize: t.font.md,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },

    // Pinned action bar
    actionBar: {
      backgroundColor: t.colors.bgElevated,
      borderTopWidth: 1,
      borderTopColor: t.colors.border,
      borderTopLeftRadius: t.radius.xl,
      borderTopRightRadius: t.radius.xl,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 14,
      shadowColor: t.colors.shadow,
      shadowOffset: { width: 0, height: -6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
      elevation: 16,
    },
    totalRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    totalLeft: { flexShrink: 1 },
    totalValue: {
      fontSize: 26,
      lineHeight: 30,
      fontWeight: '800',
      letterSpacing: 0.2,
      color: t.colors.text,
      marginTop: 1,
    },
    primaryCta: { flex: 1, height: 54 },
    callbackBtn: {
      height: 46,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.card,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
    },
    callbackText: {
      color: t.colors.primary,
      fontSize: t.font.md,
      fontWeight: '700',
    },
    pressed: { opacity: 0.85 },
  });
