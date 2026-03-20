import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import OverdueAlert from '../components/OverdueAlert';
import '../components/NotificationToast.css';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  return ctx || { notifications: [], unreadCount: 0, refresh: () => {} };
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState(null);
  const [overdueAlert, setOverdueAlert] = useState(null);
  const lastUnreadRef = useRef(-1);

  const refresh = useCallback(async () => {
    if (!user) return [];
    try {
      const { data } = await api.get('/notifications');
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      return list;
    } catch (err) {
      setNotifications([]);
      return [];
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setToast(null);
      setOverdueAlert(null);
      lastUnreadRef.current = -1;
      return;
    }

    const poll = async () => {
      const data = await refresh();
      const unread = (data || []).filter(n => !n.read).length;
      const prev = lastUnreadRef.current;
      const hasNew = prev >= 0 ? unread > prev : unread > 0;
      lastUnreadRef.current = unread;

      if (hasNew) {
        const overdueFirst = data?.find(n => !n.read && n.type === 'overdue');
        const newest = overdueFirst || data?.find(n => !n.read);
        if (newest) {
          if (newest.type === 'overdue') {
            setOverdueAlert({ message: newest.message, id: newest._id });
            setToast(null);
          } else {
            setToast({ message: newest.message, id: newest._id });
            setOverdueAlert(null);
            setTimeout(() => setToast(null), 6000);
          }
          const soundOn = localStorage.getItem('crm_notif_sound') !== 'false';
          if (soundOn && typeof window !== 'undefined' && window.Notification?.permission === 'granted') {
            try {
              new window.Notification('CRM Notification', { body: newest.message });
            } catch (err) {
              // ignore
            }
          }
        }
      }
    };

    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, [user, refresh]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refresh }}>
      {children}
      {overdueAlert && (
        <OverdueAlert
          notification={overdueAlert}
          onDismiss={() => setOverdueAlert(null)}
        />
      )}
      {toast && (
        <div className="notification-toast" role="alert">
          <strong>Notification</strong>
          <p>{toast.message}</p>
          <button onClick={() => setToast(null)} className="toast-close">×</button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
