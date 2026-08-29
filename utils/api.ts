import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Detect local server URL based on platform
// For Android emulator, localhost maps to 10.0.2.2. For iOS/Web, localhost works.
const getBaseUrl = () => {
  if (Platform.OS === "android") {
    // If running on actual Android device, replace with your local dev machine IP
    return "http://10.0.2.2:5000";
  }
  return "http://localhost:5000";
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync("user_jwt_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error reading JWT token from SecureStore:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
export { getBaseUrl };
