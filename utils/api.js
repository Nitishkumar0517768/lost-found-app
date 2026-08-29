import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { getStorageItem } from "./storage";

const getBaseUrl = () => {
  if (Platform.OS === "web") {
    return "http://localhost:5000";
  }
  // Automatically extract dev machine IP when running on Expo Go
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  const ip = hostUri ? hostUri.split(":")[0] : "192.168.1.149";
  return `http://${ip}:5000`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
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

export default api;
export { getBaseUrl };
