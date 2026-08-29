import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const setStorageItem = async (key, value) => {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn("localStorage set error", e);
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.warn("SecureStore set error", e);
  }
};

export const getStorageItem = async (key) => {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      return null;
    }
    return null;
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    return null;
  }
};

export const deleteStorageItem = async (key) => {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {}
};
