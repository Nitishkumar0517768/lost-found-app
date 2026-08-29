let io;
const userSockets = new Map(); // userId -> set of socketIds

const init = (socketIoInstance) => {
  io = socketIoInstance;

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room based on userId for targeted messaging
    socket.on("register", (userId) => {
      if (userId) {
        socket.join(userId);
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);
        console.log(`User ${userId} registered socket ${socket.id}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      for (const [userId, sockets] of userSockets.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSockets.delete(userId);
          }
          break;
        }
      }
    });
  });
};

const sendNotification = (userId, notification) => {
  if (io) {
    io.to(userId.toString()).emit("notification", notification);
    console.log(`Real-time notification emitted to user ${userId}`);
  }
};

module.exports = {
  init,
  sendNotification,
};
