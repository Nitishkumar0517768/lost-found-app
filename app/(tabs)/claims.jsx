import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api, { getBaseUrl } from "../../utils/api";
import { Colors } from "../../constants/theme";

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  return `${getBaseUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function ClaimsScreen() {
  const router = useRouter();
  const [activeSegment, setActiveSegment] = useState("my"); // "my" (claims I filed) or "received" (claims sent to me)
  const [myClaims, setMyClaims] = useState([]);
  const [receivedClaims, setReceivedClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllClaims = useCallback(async () => {
    setLoading(true);
    try {
      const [myRes, receivedRes] = await Promise.all([
        api.get("/claims/my"),
        api.get("/claims/received"),
      ]);
      setMyClaims(myRes.data || []);
      setReceivedClaims(receivedRes.data || []);
    } catch (e) {
      console.error("Error fetching claims:", e);
      Alert.alert("Error", "Could not fetch claims.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllClaims();
  }, [fetchAllClaims]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllClaims();
  };

  const handleClaimAction = async (claimId, status) => {
    const actionText = status === "accepted" ? "ACCEPT" : "REJECT";
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${actionText.toLowerCase()} this claim proof?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: actionText,
          style: status === "accepted" ? "default" : "destructive",
          onPress: async () => {
            try {
              const res = await api.patch(`/claims/${claimId}`, { status });
              if (status === "accepted") {
                Alert.alert(
                  "Claim Accepted ✅",
                  `You have accepted the claim! The item has been removed from the noticeboard. Connect with the owner at:\n\nPhone: ${res.data.claimantPhone}`
                );
              } else {
                Alert.alert(
                  "Claim Rejected ❌",
                  "The claim proof has been rejected. The claimant has been notified in their alerts tab and the claim was removed from their claims tab."
                );
              }
              fetchAllClaims();
            } catch (error) {
              const err = error.response?.data?.error || "Could not update claim.";
              Alert.alert("Error", err);
            }
          },
        },
      ]
    );
  };

  // Render cards for Claims filed by current user (Claimant's View)
  const renderMyClaimCard = ({ item }) => {
    const isAccepted = item.status === "accepted";
    const finder = item.foundItemId?.userId;
    const itemImage = resolveImageUrl(item.foundItemId?.imageUrl);

    return (
      <View style={styles.card}>
        {/* Top: Found Item Thumbnail, Title & Status */}
        <View style={styles.itemHeaderRow}>
          {itemImage ? (
            <Image
              source={{ uri: itemImage }}
              style={styles.itemThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.itemThumbPlaceholder}>
              <Ionicons name="cube-outline" size={24} color={Colors.stone} />
            </View>
          )}

          <View style={styles.itemHeaderInfo}>
            <View style={styles.badgeRow}>
              {item.foundItemId?.category && (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>
                    {item.foundItemId.category}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.statusPill,
                  isAccepted ? styles.statusPillAccepted : styles.statusPillPending,
                ]}
              >
                <Ionicons
                  name={isAccepted ? "checkmark-circle" : "time"}
                  size={12}
                  color={isAccepted ? Colors.forest : Colors.ink}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    isAccepted && { color: Colors.forest },
                  ]}
                >
                  {isAccepted ? "CLAIM ACCEPTED" : "PENDING"}
                </Text>
              </View>
            </View>

            <Text style={styles.cardItemTitle} numberOfLines={2}>
              {item.foundItemId?.title || "Found Item"}
            </Text>

            <View style={styles.itemMetaLine}>
              <Text style={styles.itemMetaText}>
                📍 {item.foundItemId?.location || "Campus"}
              </Text>
              {item.foundItemId?.dateFound && (
                <Text style={styles.itemMetaText}>
                  📅 {new Date(item.foundItemId.dateFound).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Submitted Proof */}
        <View style={styles.proofCard}>
          <View style={styles.proofHeaderRow}>
            <Ionicons name="document-text-outline" size={14} color={Colors.ink} />
            <Text style={styles.proofLabel}>Your Submitted Proof</Text>
          </View>
          <Text style={styles.proofBody}>"{item.proofDetails}"</Text>
        </View>

        {/* If accepted, show finder's contact card */}
        {isAccepted && finder ? (
          <View style={styles.acceptedContactCard}>
            <View style={styles.acceptedContactHeader}>
              <Ionicons name="checkmark-done-circle" size={16} color={Colors.forest} />
              <Text style={styles.acceptedContactTitle}>
                Proof Accepted! Connect with Finder to Collect:
              </Text>
            </View>

            <View style={styles.contactDetailsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactPersonName}>👤 {finder.fullName}</Text>
                {finder.phone && (
                  <Text style={styles.contactPersonPhone}>📞 {finder.phone}</Text>
                )}
                {finder.email && (
                  <Text style={styles.contactPersonEmail}>✉️ {finder.email}</Text>
                )}
              </View>

              <View style={styles.contactActionButtons}>
                {finder.phone ? (
                  <TouchableOpacity
                    style={styles.actionCallBtn}
                    onPress={() => Linking.openURL(`tel:${finder.phone}`)}
                  >
                    <Ionicons name="call" size={13} color={Colors.surface} />
                    <Text style={styles.actionCallText}>Call</Text>
                  </TouchableOpacity>
                ) : null}
                {finder.email ? (
                  <TouchableOpacity
                    style={styles.actionEmailBtn}
                    onPress={() => Linking.openURL(`mailto:${finder.email}`)}
                  >
                    <Ionicons name="mail" size={13} color={Colors.ink} />
                    <Text style={styles.actionEmailText}>Email</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.pendingNoticeBanner}>
            <Ionicons name="time-outline" size={15} color={Colors.stone} />
            <Text style={styles.pendingNoticeText}>
              Waiting for the finder to review your proof. You will get an alert once accepted or rejected.
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render cards for Claims received by current user (Finder's View)
  const renderReceivedClaimCard = ({ item }) => {
    const isPending = item.status === "pending";
    const isAccepted = item.status === "accepted";
    const itemImage = resolveImageUrl(item.foundItemId?.imageUrl);
    const claimantName = item.claimantId?.fullName || "Student";
    const claimantInitial = claimantName.charAt(0).toUpperCase();

    return (
      <View style={styles.card}>
        {/* Item Header with Image, Category, Title & Status */}
        <View style={styles.itemHeaderRow}>
          {itemImage ? (
            <Image
              source={{ uri: itemImage }}
              style={styles.itemThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.itemThumbPlaceholder}>
              <Ionicons name="cube-outline" size={24} color={Colors.stone} />
            </View>
          )}

          <View style={styles.itemHeaderInfo}>
            <View style={styles.badgeRow}>
              {item.foundItemId?.category && (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>
                    {item.foundItemId.category}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.statusPill,
                  isAccepted
                    ? styles.statusPillAccepted
                    : item.status === "rejected"
                    ? styles.statusPillRejected
                    : styles.statusPillPending,
                ]}
              >
                <Ionicons
                  name={
                    isAccepted
                      ? "checkmark-circle"
                      : item.status === "rejected"
                      ? "close-circle"
                      : "time"
                  }
                  size={12}
                  color={
                    isAccepted
                      ? Colors.forest
                      : item.status === "rejected"
                      ? Colors.rust
                      : Colors.ink
                  }
                />
                <Text
                  style={[
                    styles.statusPillText,
                    isAccepted && { color: Colors.forest },
                    item.status === "rejected" && { color: Colors.rust },
                  ]}
                >
                  {item.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.cardItemTitle} numberOfLines={2}>
              {item.foundItemId?.title || "Your Found Item"}
            </Text>

            <View style={styles.itemMetaLine}>
              <Text style={styles.itemMetaText}>
                📍 {item.foundItemId?.location || "Campus"}
              </Text>
              {item.foundItemId?.dateFound && (
                <Text style={styles.itemMetaText}>
                  📅 {new Date(item.foundItemId.dateFound).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Claimant Info Badge */}
        <View style={styles.claimantHeader}>
          <View style={styles.claimantAvatar}>
            <Text style={styles.claimantAvatarText}>{claimantInitial}</Text>
          </View>
          <View style={styles.claimantInfo}>
            <Text style={styles.claimantName}>{claimantName}</Text>
            <Text style={styles.claimantSub}>
              Claimant {item.createdAt ? `• Filed ${new Date(item.createdAt).toLocaleDateString()}` : ""}
            </Text>
          </View>
        </View>

        {/* Submitted Proof Card */}
        <View style={styles.proofCard}>
          <View style={styles.proofHeaderRow}>
            <Ionicons name="document-text-outline" size={14} color={Colors.ink} />
            <Text style={styles.proofLabel}>Claimant's Submitted Proof</Text>
          </View>
          <Text style={styles.proofBody}>"{item.proofDetails}"</Text>
        </View>

        {/* Finder's Secret / Private Note to help verify */}
        {item.foundItemId?.privateNotes ? (
          <View style={styles.privateNotesCard}>
            <View style={styles.privateNotesHeader}>
              <Ionicons name="lock-closed" size={12} color="#856404" />
              <Text style={styles.privateNotesLabel}>
                Your Private Note (Verification secret only you see)
              </Text>
            </View>
            <Text style={styles.privateNotesText}>
              "{item.foundItemId.privateNotes}"
            </Text>
          </View>
        ) : null}

        {/* If Accepted: Contact Claimant Card with Direct Call & Email buttons */}
        {isAccepted && (
          <View style={styles.acceptedContactCard}>
            <View style={styles.acceptedContactHeader}>
              <Ionicons name="checkmark-done-circle" size={16} color={Colors.forest} />
              <Text style={styles.acceptedContactTitle}>
                Claim Approved • Connect to Return Item:
              </Text>
            </View>

            <View style={styles.contactDetailsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactPersonName}>👤 {claimantName}</Text>
                {item.claimantId?.phone && (
                  <Text style={styles.contactPersonPhone}>
                    📞 {item.claimantId.phone}
                  </Text>
                )}
                {item.claimantId?.email && (
                  <Text style={styles.contactPersonEmail}>
                    ✉️ {item.claimantId.email}
                  </Text>
                )}
              </View>

              <View style={styles.contactActionButtons}>
                {item.claimantId?.phone ? (
                  <TouchableOpacity
                    style={styles.actionCallBtn}
                    onPress={() => Linking.openURL(`tel:${item.claimantId.phone}`)}
                  >
                    <Ionicons name="call" size={13} color={Colors.surface} />
                    <Text style={styles.actionCallText}>Call</Text>
                  </TouchableOpacity>
                ) : null}
                {item.claimantId?.email ? (
                  <TouchableOpacity
                    style={styles.actionEmailBtn}
                    onPress={() => Linking.openURL(`mailto:${item.claimantId.email}`)}
                  >
                    <Ionicons name="mail" size={13} color={Colors.ink} />
                    <Text style={styles.actionEmailText}>Email</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        )}

        {/* If Pending: Decision Action Buttons (Reject / Accept) */}
        {isPending && (
          <View style={styles.decisionRow}>
            <TouchableOpacity
              style={styles.btnRejectNew}
              onPress={() => handleClaimAction(item._id, "rejected")}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={16} color={Colors.rust} />
              <Text style={styles.btnRejectText}>REJECT</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnAcceptNew}
              onPress={() => handleClaimAction(item._id, "accepted")}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={16} color={Colors.surface} />
              <Text style={styles.btnAcceptText}>ACCEPT CLAIM</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const activeClaimsList = activeSegment === "my" ? myClaims : receivedClaims;
  const pendingReceivedCount = receivedClaims.filter((c) => c.status === "pending").length;

  return (
    <View style={styles.container}>
      {/* Top Segmented Tabs: My Claims vs Received Claims */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === "my" && styles.segmentBtnActive]}
          onPress={() => setActiveSegment("my")}
          activeOpacity={0.7}
        >
          <Ionicons
            name="paper-plane-outline"
            size={16}
            color={activeSegment === "my" ? Colors.surface : Colors.ink}
          />
          <Text
            style={[styles.segmentText, activeSegment === "my" && styles.segmentTextActive]}
          >
            My Filed Claims ({myClaims.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSegment === "received" && styles.segmentBtnActive]}
          onPress={() => setActiveSegment("received")}
          activeOpacity={0.7}
        >
          <Ionicons
            name="file-tray-full-outline"
            size={16}
            color={activeSegment === "received" ? Colors.surface : Colors.ink}
          />
          <Text
            style={[
              styles.segmentText,
              activeSegment === "received" && styles.segmentTextActive,
            ]}
          >
            Received Claims ({receivedClaims.length})
          </Text>
          {pendingReceivedCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingReceivedCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.marigold} />
        </View>
      ) : (
        <FlatList
          data={activeClaimsList}
          renderItem={activeSegment === "my" ? renderMyClaimCard : renderReceivedClaimCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.marigold]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={activeSegment === "my" ? "shield-checkmark-outline" : "file-tray-outline"}
                size={54}
                color={Colors.stone}
              />
              <Text style={styles.emptyTitle}>
                {activeSegment === "my" ? "No Active Claims Filed" : "No Claims Received"}
              </Text>
              <Text style={styles.emptyText}>
                {activeSegment === "my"
                  ? "When you find a lost item on the Noticeboard and click 'CLAIM', your pending claim will appear here."
                  : "When another student submits a claim on items you found, their proof will appear here for your review."}
              </Text>

              {activeSegment === "my" && (
                <TouchableOpacity
                  style={styles.browseNoticeboardBtn}
                  onPress={() => router.push("/(tabs)")}
                >
                  <Text style={styles.browseNoticeboardText}>Browse Noticeboard</Text>
                </TouchableOpacity>
              )}
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
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    padding: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: Colors.ink,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.ink,
  },
  segmentTextActive: {
    color: Colors.surface,
  },
  pendingBadge: {
    backgroundColor: Colors.rust,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 2,
  },
  pendingBadgeText: {
    color: Colors.surface,
    fontSize: 10,
    fontWeight: "bold",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeaderRow: {
    flexDirection: "row",
    gap: 12,
  },
  itemThumb: {
    width: 68,
    height: 68,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
  },
  itemThumbPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
    justifyContent: "center",
    alignItems: "center",
  },
  itemHeaderInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  categoryPill: {
    backgroundColor: Colors.paper,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.ink,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusPillPending: {
    backgroundColor: "#FEF9E7",
    borderColor: Colors.marigold,
  },
  statusPillAccepted: {
    backgroundColor: "#EAFAF1",
    borderColor: "#A9DFBF",
  },
  statusPillRejected: {
    backgroundColor: "#FDEDEC",
    borderColor: "#F5B7B1",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.ink,
    letterSpacing: 0.3,
  },
  cardItemTitle: {
    fontSize: 15,
    fontFamily: "serif",
    fontWeight: "bold",
    color: Colors.ink,
    lineHeight: 20,
    marginBottom: 4,
  },
  itemMetaLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  itemMetaText: {
    fontSize: 11,
    color: Colors.stone,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  claimantHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  claimantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.ink,
    justifyContent: "center",
    alignItems: "center",
  },
  claimantAvatarText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: "bold",
  },
  claimantInfo: {
    flex: 1,
  },
  claimantName: {
    fontSize: 13,
    fontWeight: "bold",
    color: Colors.ink,
  },
  claimantSub: {
    fontSize: 11,
    color: Colors.stone,
    marginTop: 1,
  },
  proofCard: {
    backgroundColor: "#FAF7EE",
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.marigold,
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  proofHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  proofLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.ink,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  proofBody: {
    fontSize: 13,
    fontStyle: "italic",
    color: Colors.ink,
    lineHeight: 18,
  },
  privateNotesCard: {
    backgroundColor: "#FEFDE8",
    borderWidth: 1,
    borderColor: "#F7DC6F",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  privateNotesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  privateNotesLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#856404",
    textTransform: "uppercase",
  },
  privateNotesText: {
    fontSize: 12,
    color: "#533f03",
    fontStyle: "italic",
  },
  acceptedContactCard: {
    backgroundColor: "#E8F8F5",
    borderWidth: 1,
    borderColor: "#A3E4D7",
    borderRadius: 6,
    padding: 10,
    marginTop: 2,
  },
  acceptedContactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#A3E4D7",
    paddingBottom: 6,
  },
  acceptedContactTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.forest,
  },
  contactDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  contactPersonName: {
    fontSize: 13,
    fontWeight: "bold",
    color: Colors.ink,
  },
  contactPersonPhone: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.ink,
    marginTop: 2,
  },
  contactPersonEmail: {
    fontSize: 11,
    color: Colors.stone,
    marginTop: 1,
  },
  contactActionButtons: {
    flexDirection: "row",
    gap: 6,
  },
  actionCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.forest,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  actionCallText: {
    color: Colors.surface,
    fontSize: 11,
    fontWeight: "bold",
  },
  actionEmailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  actionEmailText: {
    color: Colors.ink,
    fontSize: 11,
    fontWeight: "bold",
  },
  pendingNoticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.paper,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  pendingNoticeText: {
    fontSize: 11,
    color: Colors.stone,
    flex: 1,
    lineHeight: 15,
  },
  decisionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  btnRejectNew: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.rust,
    backgroundColor: "#FDEDEC",
  },
  btnRejectText: {
    color: Colors.rust,
    fontWeight: "bold",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  btnAcceptNew: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: Colors.forest,
    borderWidth: 1.5,
    borderColor: "#274830",
  },
  btnAcceptText: {
    color: Colors.surface,
    fontWeight: "bold",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  empty: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "serif",
    fontWeight: "bold",
    color: Colors.ink,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    color: Colors.stone,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  browseNoticeboardBtn: {
    marginTop: 16,
    backgroundColor: Colors.marigold,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.ink,
  },
  browseNoticeboardText: {
    color: Colors.surface,
    fontWeight: "bold",
    fontSize: 13,
  },
});
