import { io } from "socket.io-client";
import { getBaseUrl } from "./api";

let socket = null;

export const initSocket = (userId, onNotificationReceived) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(getBaseUrl());

  socket.on("connect", () => {
    console.log("Connected to Socket.io server");
    socket?.emit("register", userId);
  });

  socket.on("notification", (notification) => {
    console.log("New real-time notification:", notification);
    onNotificationReceived(notification);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from Socket.io server");
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
