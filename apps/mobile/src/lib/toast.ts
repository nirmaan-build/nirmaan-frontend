import Toast from 'react-native-toast-message';

export type ToastType = 'success' | 'error' | 'info';

interface ActionToast {
  title: string;
  message?: string;
  actionLabel: string;
  onAction: () => void;
  type?: ToastType;
}

/**
 * Tiny wrapper over react-native-toast-message so call sites stay clean and the
 * styling/behaviour lives in one place (see components/ToastConfig.tsx).
 */
export const toast = {
  success(title: string, message?: string) {
    Toast.show({ type: 'success', text1: title, text2: message });
  },
  error(title: string, message?: string) {
    Toast.show({ type: 'error', text1: title, text2: message, visibilityTime: 3500 });
  },
  info(title: string, message?: string) {
    Toast.show({ type: 'info', text1: title, text2: message });
  },
  /** Toast with a tappable action (e.g. "Added — View Truck"). */
  action({ title, message, actionLabel, onAction, type = 'success' }: ActionToast) {
    Toast.show({
      type,
      text1: title,
      text2: message,
      visibilityTime: 4000,
      props: { actionLabel, onAction },
    });
  },
  hide() {
    Toast.hide();
  },
};
