import { createContext, useContext, type ReactNode, useState, useCallback } from 'react';

export interface Notification {
  id: string
  text: string
  type: string
  expiring: boolean
  open: boolean
}

interface NotificationContextProps {
  notifications: Notification[]
  addNotif: (text: string, alertType: string, expires?: number) => void
  removeNotif: (id: string) => void
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider',
    );
  }
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotif = useCallback((id: string) => {
    setNotifications((old) => {
      const toCloseNotif = old.findIndex((notif) => notif.id === id);

      if (toCloseNotif !== -1) {
        old[toCloseNotif].open = false;
      }
      return [...old];
    });

    setTimeout(() => {
      setNotifications((old) => old.filter((notif) => notif.id !== id));
    }, 200);
  }, []);

  const addNotif = useCallback(
    (content: string, alertType: string, expires: number = 7) => {
      const newNotif = {
        id:       Math.random().toString(16).slice(2),
        text:     content,
        type:     alertType,
        expiring: expires > 0,
        open:     true,
      };

      setNotifications((old) => {
        if (old.filter((notif) => notif.expiring).length >= 5) {
          return [
            ...old.filter(
              (notif) => notif.id !== old.find((n) => n.expiring)?.id,
            ),
            newNotif,
          ];
        }
        return [...old, newNotif];
      });

      if (expires) {
        setTimeout(() => {
          removeNotif(newNotif.id);
        }, 1000 * expires);
      }
    },
    [removeNotif],
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotif,
        removeNotif,
      }}>
      {children}
    </NotificationContext.Provider>
  );
}
