import React, { createContext, useState, useEffect, useContext } from "react";
import * as SecureStore from "expo-secure-store";
import api from "../utils/api";
import { initSocket, disconnectSocket } from "../utils/socket";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const socket = initSocket(user.id, (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((c) => c + 1);
      });

      fetchNotifications();

      return () => {
        disconnectSocket();
      };
    }
  }, [user]);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync("user_jwt_token");
      const storedUserData = await SecureStore.getItemAsync("user_data");
      if (storedToken && storedUserData) {
        setToken(storedToken);
        setUser(JSON.parse(storedUserData));
      }
    } catch (e) {
      console.error("Failed to load stored auth details", e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token: jwtToken, user: userData } = res.data;

    await SecureStore.setItemAsync("user_jwt_token", jwtToken);
    await SecureStore.setItemAsync("user_data", JSON.stringify(userData));

    setToken(jwtToken);
    setUser(userData);
  };

  const signup = async (fullName, email, password, phone, collegeName) => {
    const res = await api.post("/auth/signup", { fullName, email, password, phone, collegeName });
    const { token: jwtToken, user: userData } = res.data;

    await SecureStore.setItemAsync("user_jwt_token", jwtToken);
    await SecureStore.setItemAsync("user_data", JSON.stringify(userData));

    setToken(jwtToken);
    setUser(userData);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("user_jwt_token");
    await SecureStore.deleteItemAsync("user_data");
    setToken(null);
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
    disconnectSocket();
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.isRead).length);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
