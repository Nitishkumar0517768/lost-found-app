import React, { useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { Colors } from "../../constants/theme";

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, loading, fetchNotifications, markAsRead } = useAuth();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationPress = async (item) => {
    if (!item.isRead) {
      await markAsRead(item._id);
    }
    if (item.type === "claim_request" || item.type === "claim_accepted") {
      router.push("/(tabs)/claims");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "claim_request":
        return "❓";
      case "claim_accepted":
        return "✅";
      case "claim_rejected":
        return "❌";
      default:
        return "🔔";
    }
  };

  const renderNotificationCard = ({ item }) => {
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getIcon(item.type)}</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, !item.isRead && styles.unreadText]}>{item.title}</Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.body}>{item.body}</Text>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString()} at{" "}
            {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotificationCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchNotifications}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No alerts at the moment.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  unreadCard: {
    borderColor: Colors.marigold,
    borderLeftWidth: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.paper,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.ink,
  },
  unreadText: {
    fontWeight: "bold",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.marigold,
  },
  body: {
    fontSize: 13,
    color: Colors.ink,
    opacity: 0.8,
    marginBottom: 6,
  },
  date: {
    fontSize: 10,
    color: Colors.stone,
  },
  empty: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.stone,
    fontSize: 14,
  },
});
