import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
      setOnlineUsers(new Set());
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const s = io(window.location.origin, {
      path: '/socket.io',
      auth: { token },
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 10000
    });

    socketRef.current = s;
    setSocket(s);

    s.on('online_list', ({ userIds }) => {
      setOnlineUsers(new Set((userIds || []).map(id => String(id))));
    });

    s.on('user_online', ({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, String(userId)]));
    });

    s.on('user_offline', ({ userId }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(String(userId));
        return next;
      });
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
