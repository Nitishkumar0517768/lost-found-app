import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../utils/api";
import { Colors } from "../../constants/theme";

export default function MyFoundItemsScreen() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyFoundItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/found-items/my");
      setItems(res.data || []);
    } catch (e) {
      console.error("Error fetching my found items:", e);
      Alert.alert("Error", "Could not fetch your found items.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyFoundItems();
  }, [fetchMyFoundItems]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyFoundItems();
  };

  const handleRemoveItem = (itemId, title) => {
    Alert.alert(
      "Remove Found Item",
      `Are you sure you want to remove "${title}" from your found items list? Any associated claims will also be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/found-items/${itemId}`);
              Alert.alert("Item Removed", "The found item notice has been removed.");
              fetchMyFoundItems();
            } catch (err) {
              const errMsg = err.response?.data?.error || "Could not remove found item.";
              Alert.alert("Error", errMsg);
            }
          },
        },
      ]
    );
  };

  const renderFoundItem = ({ item }) => {
    const isReturned = item.status === "returned";
    const isClaimRequested = item.status === "claim_requested";

    const getHoldingLabel = (val) => {
      switch (val) {
        case "with_me":
          return "In Finder's Custody";
        case "security_office":
          return "Security Desk";
        case "college_office":
          return "Student Affairs Office";
        default:
          return val ? val.replace("_", " ") : "On Campus";
      }
    };

    return (
      <View style={styles.card}>
        {/* Top Meta Bar */}
        <View style={styles.cardTopRow}>
          <View style={styles.categoryBadge}>
            <Ionicons name="pricetag-outline" size={12} color={Colors.ink} />
            <Text style={styles.categoryBadgeText}>{item.category || "Item"}</Text>
          </View>

          {/* Status Badge */}
          {isReturned ? (
            <View style={styles.badgeReturned}>
              <Ionicons name="checkmark-done-circle" size={13} color="#FFF" />
              <Text style={styles.badgeText}>CLAIM APPROVED • RETURNED</Text>
            </View>
          ) : isClaimRequested ? (
            <View style={styles.badgeClaimed}>
              <Ionicons name="alert-circle" size={13} color="#FFF" />
              <Text style={styles.badgeText}>
                {item.pendingClaimsCount ? `${item.pendingClaimsCount} CLAIM(S) PENDING` : "CLAIM REQUESTED"}
              </Text>
            </View>
          ) : (
            <View style={styles.badgeActive}>
              <Ionicons name="radio-button-on" size={10} color={Colors.forest} />
              <Text style={styles.badgeTextActive}>ACTIVE ON BOARD</Text>
            </View>
          )}
        </View>

        {/* Content Row */}
        <View style={styles.contentRow}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="cube-outline" size={32} color={Colors.stone} />
            </View>
          )}

          <View style={styles.itemDetails}>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.itemDesc} numberOfLines={2}>
              {item.description}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={13} color={Colors.rust} />
                <Text style={styles.metaText}>{item.location}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={Colors.stone} />
                <Text style={styles.metaText}>
                  {new Date(item.dateFound).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </View>

            {item.holdingLocation && (
              <View style={styles.holdingRow}>
                <Ionicons name="shield-checkmark-outline" size={13} color={Colors.forest} />
                <Text style={styles.holdingText}>{getHoldingLabel(item.holdingLocation)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {isClaimRequested && (
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => router.push("/(tabs)/claims")}
              activeOpacity={0.8}
            >
              <Ionicons name="file-tray-full" size={16} color={Colors.surface} />
              <Text style={styles.reviewBtnText}>Review Claims</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.deleteBtn, isClaimRequested && { flex: 0.8 }]}
            onPress={() => handleRemoveItem(item._id, item.title)}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={15} color={Colors.rust} />
            <Text style={styles.deleteBtnText}>Remove Notice</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.marigold} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="archive-outline" size={48} color={Colors.stone} />
          </View>
          <Text style={styles.emptyTitle}>No Found Items Reported</Text>
          <Text style={styles.emptySubtitle}>
            Found an item on campus? Post a notice so the owner can securely verify their ownership and claim it.
          </Text>
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() => router.push("/report")}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle" size={18} color={Colors.surface} />
            <Text style={styles.reportBtnText}>POST FOUND ITEM NOTICE</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={renderFoundItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.marigold]} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    shadowColor: Colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.paper,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.ink,
    textTransform: "uppercase",
  },
  badgeReturned: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.forest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeClaimed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.marigold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeActive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EAF2EC",
    borderWidth: 1,
    borderColor: "#C3DAC7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    color: Colors.surface,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  badgeTextActive: {
    color: Colors.forest,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  contentRow: {
    flexDirection: "row",
    gap: 12,
  },
  itemImage: {
    width: 86,
    height: 86,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
  },
  imagePlaceholder: {
    width: 86,
    height: 86,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
    justifyContent: "center",
    alignItems: "center",
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontFamily: "serif",
    fontWeight: "bold",
    color: Colors.ink,
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 12,
    color: Colors.stone,
    marginBottom: 8,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.ink,
    fontWeight: "600",
  },
  holdingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  holdingText: {
    fontSize: 11,
    color: Colors.forest,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1.5,
    borderTopColor: Colors.paper,
  },
  reviewBtn: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.marigold,
    paddingVertical: 9,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.ink,
  },
  reviewBtnText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: "bold",
  },
  deleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FDF2E9",
    paddingVertical: 9,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.rust,
  },
  deleteBtnText: {
    color: Colors.rust,
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "serif",
    fontWeight: "bold",
    color: Colors.ink,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.stone,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 22,
  },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.marigold,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    shadowColor: Colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 2,
  },
  reportBtnText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
