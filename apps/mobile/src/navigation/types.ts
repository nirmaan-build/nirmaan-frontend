import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabsParamList = {
  Home: undefined;
  Categories: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  Tabs: NavigatorScreenParams<TabsParamList> | undefined;
  Truck: undefined;
  CategoryPage: { categoryId: string; categoryName: string; q?: string };
  ItemDetail: { itemId: string };
  PostRfq: { categoryId?: string; categoryName?: string };
  RfqConfirmation: { rfqId: string; status: string; leadCount: number };
  MyRequirements: undefined;
  MyOrders: undefined;
  Notifications: undefined;
  OrderTracking: { orderId: string };
  Payment: { orderId: string };
  RequestCallback: undefined;
  CallbackConfirmation: { callbackId: string };
  PayLink: { paymentLinkId: string };
  Content: { type: 'help' | 'privacy' | 'terms' };
};

export type AuthStackParamList = {
  Login: undefined;
  Otp: { email: string };
};
