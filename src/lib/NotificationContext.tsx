import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import './NotificationContext.css';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(({ type, title, message, duration = 5000 }: Omit<Notification, 'id'>) => {
    const id = crypto.randomUUID();
    setNotifications((prev) => [...prev, { id, type, title, message, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map((notification) => (
          <div key={notification.id} className={`notification notification--${notification.type}`}>
            <div className="notification__icon">
              {notification.type === 'success' && <CheckCircle size={20} />}
              {notification.type === 'error' && <AlertCircle size={20} />}
              {notification.type === 'warning' && <AlertTriangle size={20} />}
              {notification.type === 'info' && <Info size={20} />}
            </div>
            <div className="notification__content">
              <h4 className="notification__title">{notification.title}</h4>
              <p className="notification__message">{notification.message}</p>
            </div>
            <button onClick={() => removeNotification(notification.id)} className="notification__close">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
