import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { getStorageItem } from "./storage";

const getBaseUrl = () => {
  if (Platform.OS === "web") {
    return process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";
  }

  // Automatically extract dev machine IP when running on Expo Go / dev client across various SDK versions
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return `http://${ip}:5000`;
    }
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Fallback to local Wi-Fi LAN IP
  return "http://192.168.1.149:5000";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use(
  async (config) => {
    const currentBaseUrl = getBaseUrl();
    config.baseURL = currentBaseUrl;
    console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${currentBaseUrl}${config.url}`);
    try {
      const token = await getStorageItem("user_jwt_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error reading JWT token from storage:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`[API RESPONSE SUCCESS] ${response.config.method?.toUpperCase()} ${response.config.url} (${response.status})`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.warn(`[API RESPONSE ERROR] ${error.config?.url}: Status ${error.response.status}`, error.response.data);
    } else if (error.request) {
      console.warn(`[API NETWORK ERROR] No response received from ${error.config?.baseURL}${error.config?.url}`);
    } else {
      console.warn(`[API ERROR] ${error.message}`);
    }
    return Promise.reject(error);
  }
);

export default api;
export { getBaseUrl };
