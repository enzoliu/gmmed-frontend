import { writable } from 'svelte/store';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timeout: number;
}

const createNotificationStore = () => {
  const { subscribe, update } = writable<Notification[]>([]);

  const addNotification = (
    type: NotificationType,
    message: string,
    timeout: number = 5000
  ) => {
    const id = crypto.randomUUID();
    const notification: Notification = { id, type, message, timeout };

    update((all) => [notification, ...all]);

    if (timeout > 0) {
      setTimeout(() => {
        update((all) => all.filter((n) => n.id !== id));
      }, timeout);
    }
  };

  return {
    subscribe,
    info: (message: string, timeout?: number) => addNotification('info', message, timeout),
    success: (message: string, timeout?: number) => addNotification('success', message, timeout),
    warning: (message: string, timeout?: number) => addNotification('warning', message, timeout),
    error: (message: string, timeout: number = 10000) => addNotification('error', message, timeout),
    remove: (id: string) => {
      update((all) => all.filter((n) => n.id !== id));
    },
  };
};

export const notificationStore = createNotificationStore(); 