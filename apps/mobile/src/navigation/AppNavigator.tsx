import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme, type Theme } from '../theme';
import { useT, translate } from '../i18n';
import { useSettingsStore } from '../store/settingsStore';
import { Icon, type IconName } from '../components/Icon';

import { HomeScreen } from '../screens/HomeScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { TruckScreen } from '../screens/TruckScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CategoryPageScreen } from '../screens/CategoryPageScreen';
import { ItemDetailScreen } from '../screens/ItemDetailScreen';
import { PostRfqScreen } from '../screens/PostRfqScreen';
import { RfqConfirmationScreen } from '../screens/RfqConfirmationScreen';
import { MyRequirementsScreen } from '../screens/MyRequirementsScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { RequestCallbackScreen } from '../screens/RequestCallbackScreen';
import { CallbackConfirmationScreen } from '../screens/CallbackConfirmationScreen';
import { PayLinkScreen } from '../screens/PayLinkScreen';
import { OrderTrackingScreen } from '../screens/OrderTrackingScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { ContentScreen } from '../screens/ContentScreen';
import type { AppStackParamList, TabsParamList } from './types';

const Tab = createBottomTabNavigator<TabsParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

/** Vector icon with an active "pill" highlight behind it when focused. */
function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  const th = useTheme();
  const styles = tabStyles(th);
  return (
    <View style={[styles.pill, focused && styles.pillActive]}>
      <Icon
        name={name}
        size={22}
        color={focused ? th.colors.primary : th.colors.muted}
        strokeWidth={focused ? 2.4 : 2}
      />
    </View>
  );
}

function Tabs() {
  const t = useT();
  const th = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: th.colors.primary,
        tabBarInactiveTintColor: th.colors.muted,
        tabBarStyle: {
          backgroundColor: th.colors.bgElevated,
          borderTopColor: th.colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('home.tab'),
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          tabBarLabel: t('categories.title'),
          tabBarIcon: ({ focused }) => (
            <TabIcon name="categories" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('profile.tab'),
          tabBarIcon: ({ focused }) => (
            <TabIcon name="profile" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const tabStyles = (t: Theme) =>
  StyleSheet.create({
    pill: {
      minWidth: 52,
      height: 30,
      borderRadius: t.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
    },
    pillActive: { backgroundColor: t.colors.primaryMuted },
  });

export function AppNavigator() {
  const locale = useSettingsStore((s) => s.locale);
  const title = (key: string) => translate(locale, key);

  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="Truck"
        component={TruckScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CategoryPage"
        component={CategoryPageScreen}
        options={({ route }) => ({ title: route.params.categoryName })}
      />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="PostRfq"
        component={PostRfqScreen}
        options={{ title: title('postRfq.title') }}
      />
      <Stack.Screen
        name="RfqConfirmation"
        component={RfqConfirmationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MyRequirements"
        component={MyRequirementsScreen}
        options={{ title: title('requirements.title') }}
      />
      <Stack.Screen
        name="MyOrders"
        component={OrdersScreen}
        options={{ title: title('orders.title') }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: title('notifications.title') }}
      />
      <Stack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
        options={{ title: title('tracking.title') }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: title('payment.title') }}
      />
      <Stack.Screen
        name="RequestCallback"
        component={RequestCallbackScreen}
        options={{ title: title('callback.title') }}
      />
      <Stack.Screen
        name="CallbackConfirmation"
        component={CallbackConfirmationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PayLink"
        component={PayLinkScreen}
        options={{ title: title('payLink.title') }}
      />
      <Stack.Screen
        name="Content"
        component={ContentScreen}
        options={({ route }) => ({ title: title(`content.${route.params.type}`) })}
      />
    </Stack.Navigator>
  );
}
