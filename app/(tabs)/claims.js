import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import api from "../../utils/api";
import { Colors } from "../../constants/theme";

export default function ClaimsScreen() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await api.get("/claims/received");
      setClaims(res.data || []);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not fetch claims.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleClaimAction = async (claimId, status) => {
    const actionText = status === "accepted" ? "ACCEPT" : "REJECT";
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${status} this claim?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionText,
          onPress: async () => {
            try {
              const res = await api.patch(`/claims/${claimId}`, { status });
              if (status === "accepted") {
                Alert.alert(
                  "Claim Accepted ✅",
                  `You have accepted the claim. Connect with the owner at:\nPhone: ${res.data.claimantPhone}`
                );
              } else {
                Alert.alert("Claim Rejected ❌", "Claim has been successfully rejected.");
              }
              fetchClaims();
            } catch (error) {
              const err = error.response?.data?.error || `Could not update claim.`;
              Alert.alert("Error", err);
            }
          },
        },
      ]
    );
  };

  const renderClaimCard = ({ item }) => {
    const isPending = item.status === "pending";

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.itemTitle}>{item.foundItemId?.title}</Text>
          <View
            style={[
              styles.badge,
              item.status === "accepted"
                ? styles.badgeAccepted
                : item.status === "rejected"
                ? styles.badgeRejected
                : styles.badgePending,
            ]}
          >
            <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.details}>
          <Text style={styles.label}>Claimant</Text>
          <Text style={styles.value}>{item.claimantId?.fullName}</Text>

          <Text style={styles.label}>Submitted Proof</Text>
          <Text style={styles.proofText}>"{item.proofDetails}"</Text>

          {item.status === "accepted" && (
            <View style={styles.contactContainer}>
              <Text style={styles.contactLabel}>📞 Claimant Contact</Text>
              <Text style={styles.contactValue}>{item.claimantId?.phone}</Text>
              <Text style={styles.contactEmail}>{item.claimantId?.email}</Text>
            </View>
          )}
        </View>

        {isPending && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnReject]}
              onPress={() => handleClaimAction(item._id, "rejected")}
            >
              <Text style={styles.btnText}>REJECT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnAccept]}
              onPress={() => handleClaimAction(item._id, "accepted")}
            >
              <Text style={styles.btnText}>ACCEPT</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading && claims.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.marigold} />
        </View>
      ) : (
        <FlatList
          data={claims}
          renderItem={renderClaimCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchClaims}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>You haven't received any claim requests yet.</Text>
            </View>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 0,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: "serif",
    fontWeight: "bold",
    color: Colors.ink,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgePending: {
    backgroundColor: "#FCEFD5",
  },
  badgeAccepted: {
    backgroundColor: "#E2EBE5",
  },
  badgeRejected: {
    backgroundColor: "#FADBD8",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.paper,
    marginVertical: 12,
  },
  details: {
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.stone,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: Colors.ink,
    marginBottom: 12,
  },
  proofText: {
    fontSize: 14,
    fontStyle: "italic",
    color: Colors.ink,
    backgroundColor: Colors.paper,
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  contactContainer: {
    backgroundColor: "#EBF5FB",
    borderWidth: 1,
    borderColor: "#AED6F1",
    padding: 12,
    borderRadius: 4,
    marginTop: 4,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2E86C1",
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.ink,
  },
  contactEmail: {
    fontSize: 12,
    color: Colors.stone,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  btn: {
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: Colors.ink,
  },
  btnReject: {
    backgroundColor: Colors.rust,
  },
  btnAccept: {
    backgroundColor: Colors.forest,
  },
  btnText: {
    color: Colors.surface,
    fontWeight: "bold",
    fontSize: 12,
    letterSpacing: 0.5,
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
