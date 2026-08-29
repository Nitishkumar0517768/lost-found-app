import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import api, { getBaseUrl } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { Colors } from "../../constants/theme";

const CATEGORIES = ["All", "ID Card", "Wallet", "Phone", "Bag", "Keys", "Electronics", "Documents", "Other"];
const LOCATIONS = ["All", "Library", "Canteen", "Parking", "Classroom", "Other"];

export default function NoticeboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Screen state
  const [activeTab, setActiveTab] = useState("lost");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [location, setLocation] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  // Modal States
  const [selectedItem, setSelectedItem] = useState(null);
  const [claimModalVisible, setClaimModalVisible] = useState(false);
  const [proofDetails, setProofDetails] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);

  const fetchItems = async (isRefresh = false) => {
    setLoading(true);
    try {
      const endpoint = activeTab === "lost" ? "/lost-items" : "/found-items";
      const params = {};
      if (search) params.search = search;
      if (category !== "All") params.category = category;
      if (location !== "All") params.location = location;
      if (dateFilter) params.dateFilter = dateFilter;

      const res = await api.get(endpoint, { params });
      setItems(res.data.items || []);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not fetch items from noticeboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab, category, location, dateFilter]);

  const handleSearch = () => {
    fetchItems();
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems(true);
  };

  const handleClaimSubmit = async () => {
    if (!proofDetails) {
      Alert.alert("Required", "Please provide proof details to claim this item.");
      return;
    }

    setClaimLoading(true);
    try {
      await api.post("/claims", {
        foundItemId: selectedItem._id,
        proofDetails,
      });
      Alert.alert("Claim Filed", "The finder has been notified. You will get an alert once they review your proof.");
      setClaimModalVisible(false);
      setSelectedItem(null);
      setProofDetails("");
      fetchItems();
    } catch (error) {
      const err = error.response?.data?.error || "Could not submit claim.";
      Alert.alert("Error", err);
    } finally {
      setClaimLoading(false);
    }
  };

  const renderItemCard = ({ item }) => {
    const isReturned = item.status === "returned";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardCategory}>{item.category}</Text>
          {isReturned ? (
            <View style={styles.stampBadge}>
              <Text style={styles.stampText}>RETURNED</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, activeTab === "lost" ? styles.lostBadge : styles.foundBadge]}>
              <Text style={styles.statusBadgeText}>
                {activeTab === "lost" ? "LOST" : "FOUND"}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>📍 {item.location}</Text>
          <Text style={styles.metaText}>
            📅 {new Date(item.dateLost || item.dateFound).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.finderText}>
            Reported by: {item.userId?.fullName || "Student"}
          </Text>

          {activeTab === "found" && !isReturned && item.userId?._id !== user?.id && (
            <TouchableOpacity
              style={styles.claimButton}
              onPress={() => {
                setSelectedItem(item);
                setClaimModalVisible(true);
              }}
            >
              <Text style={styles.claimButtonText}>CLAIM</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search and Filters Header */}
      <View style={styles.header}>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search noticeboard..."
            placeholderTextColor={Colors.stone}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>GO</Text>
          </TouchableOpacity>
        </View>

        {/* Categories Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, category === cat && styles.filterChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.filterChipText, category === cat && styles.filterChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Locations & Dates Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollSub}>
          {LOCATIONS.map((loc) => (
            <TouchableOpacity
              key={loc}
              style={[styles.subFilterChip, location === loc && styles.subFilterChipActive]}
              onPress={() => setLocation(loc)}
            >
              <Text style={[styles.subFilterText, location === loc && styles.subFilterTextActive]}>
                📍 {loc}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.divider} />
          {["All Dates", "Today", "This Week"].map((date) => {
            const isSel = (date === "All Dates" && !dateFilter) || dateFilter === date;
            return (
              <TouchableOpacity
                key={date}
                style={[styles.subFilterChip, isSel && styles.subFilterChipActive]}
                onPress={() => setDateFilter(date === "All Dates" ? "" : date)}
              >
                <Text style={[styles.subFilterText, isSel && styles.subFilterTextActive]}>
                  🕒 {date}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "lost" && styles.tabButtonActive]}
          onPress={() => {
            setActiveTab("lost");
            setItems([]);
          }}
        >
          <Text style={[styles.tabButtonText, activeTab === "lost" && styles.tabButtonTextActive]}>
            LOST ITEMS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "found" && styles.tabButtonActive]}
          onPress={() => {
            setActiveTab("found");
            setItems([]);
          }}
        >
          <Text style={[styles.tabButtonText, activeTab === "found" && styles.tabButtonTextActive]}>
            FOUND ITEMS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Listings */}
      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.marigold} />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItemCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nothing pinned on the board here yet.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push("/report")}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Claim Modal */}
      <Modal visible={claimModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>File Ownership Claim</Text>
            <Text style={styles.modalSub}>
              Submit proof details for: "{selectedItem?.title}"
            </Text>

            <Text style={styles.modalLabel}>Proof of ownership</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={4}
              value={proofDetails}
              onChangeText={setProofDetails}
              placeholder="Describe unique features, markings, or exact contents inside not shown in the public listing..."
              placeholderTextColor={Colors.stone}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setClaimModalVisible(false);
                  setSelectedItem(null);
                  setProofDetails("");
                }}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSubmit]}
                onPress={handleClaimSubmit}
                disabled={claimLoading}
              >
                {claimLoading ? (
                  <ActivityIndicator color={Colors.surface} />
                ) : (
                  <Text style={styles.modalBtnSubmitText}>Submit Claim</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  searchBarContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: "monospace",
    color: Colors.ink,
  },
  searchButton: {
    backgroundColor: Colors.marigold,
    borderWidth: 1,
    borderColor: Colors.ink,
    borderRadius: 4,
    marginLeft: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  searchButtonText: {
    color: Colors.surface,
    fontWeight: "bold",
  },
  filterScroll: {
    flexGrow: 0,
    marginBottom: 8,
  },
  filterScrollSub: {
    flexGrow: 0,
  },
  filterChip: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.marigold,
    borderColor: Colors.ink,
  },
  filterChipText: {
    color: Colors.stone,
    fontSize: 12,
  },
  filterChipTextActive: {
    color: Colors.surface,
    fontWeight: "bold",
  },
  subFilterChip: {
    backgroundColor: Colors.paper,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subFilterChipActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  subFilterText: {
    color: Colors.stone,
    fontSize: 11,
  },
  subFilterTextActive: {
    color: Colors.surface,
    fontWeight: "bold",
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.marigold,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.stone,
  },
  tabButtonTextActive: {
    color: Colors.marigold,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 0,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.stone,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lostBadge: {
    backgroundColor: "#FCEFD5",
  },
  foundBadge: {
    backgroundColor: "#E2EBE5",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.ink,
  },
  stampBadge: {
    borderWidth: 2,
    borderColor: Colors.forest,
    paddingHorizontal: 6,
    paddingVertical: 1,
    transform: [{ rotate: "-4deg" }],
  },
  stampText: {
    fontFamily: "monospace",
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.forest,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "serif",
    fontWeight: "bold",
    color: Colors.ink,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.ink,
    opacity: 0.8,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: Colors.stone,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.paper,
    paddingTop: 8,
  },
  finderText: {
    fontSize: 11,
    color: Colors.stone,
  },
  claimButton: {
    backgroundColor: Colors.marigold,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.ink,
  },
  claimButtonText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.stone,
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.marigold,
    borderWidth: 2,
    borderColor: Colors.ink,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 5,
  },
  fabText: {
    color: Colors.surface,
    fontSize: 32,
    fontWeight: "bold",
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "serif",
    fontWeight: "bold",
    color: Colors.ink,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 14,
    color: Colors.stone,
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.ink,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  modalInput: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    padding: 10,
    height: 100,
    textAlignVertical: "top",
    color: Colors.ink,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalBtn: {
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginLeft: 8,
    borderWidth: 1,
  },
  modalBtnCancel: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  modalBtnCancelText: {
    color: Colors.stone,
    fontWeight: "bold",
  },
  modalBtnSubmit: {
    backgroundColor: Colors.marigold,
    borderColor: Colors.ink,
  },
  modalBtnSubmitText: {
    color: Colors.surface,
    fontWeight: "bold",
  },
});
