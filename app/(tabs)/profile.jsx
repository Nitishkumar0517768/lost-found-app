import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import { Colors } from "../../constants/theme";

export default function ProfileScreen() {
  const { user, logout, updateProfile, refreshProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);

  // Editable Form Fields
  const [fullName, setFullName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePic, setProfilePic] = useState("");

  // Sync state when user changes or edit mode toggles
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setCollegeName(user.collegeName || "");
      setPhone(user.phone || "");
      setProfilePic(user.profilePic || "");
    }
  }, [user, isEditing]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  }, [refreshProfile]);

  const getInitials = (name) => {
    if (!name) return "ST";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handlePickFromCamera = async () => {
    setPhotoPickerVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera access is needed to take a profile photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const imageUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setProfilePic(imageUri);
        if (!isEditing) {
          await saveQuickPhoto(imageUri);
        }
      }
    } catch (e) {
      console.error("Camera error:", e);
      Alert.alert("Error", "Could not access camera.");
    }
  };

  const handlePickFromGallery = async () => {
    setPhotoPickerVisible(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Photo library access is needed to select a profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const imageUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setProfilePic(imageUri);
        if (!isEditing) {
          await saveQuickPhoto(imageUri);
        }
      }
    } catch (e) {
      console.error("Gallery error:", e);
      Alert.alert("Error", "Could not access gallery.");
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoPickerVisible(false);
    setProfilePic("");
    if (!isEditing) {
      await saveQuickPhoto("");
    }
  };

  const saveQuickPhoto = async (newPhotoUri) => {
    try {
      setSaving(true);
      await updateProfile({
        fullName: user.fullName,
        phone: user.phone,
        collegeName: user.collegeName,
        profilePic: newPhotoUri,
      });
      Alert.alert("Success", "Profile photo updated!");
    } catch (e) {
      console.error("Quick photo save failed:", e);
      Alert.alert("Error", "Failed to update profile picture.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!fullName.trim()) {
      Alert.alert("Validation", "Please enter your full name.");
      return;
    }
    if (!collegeName.trim()) {
      Alert.alert("Validation", "Please enter your college name.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Validation", "Please enter your phone number.");
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        fullName: fullName.trim(),
        collegeName: collegeName.trim(),
        phone: phone.trim(),
        profilePic: profilePic,
      });
      setIsEditing(false);
      Alert.alert("Profile Updated", "Your profile details have been saved successfully.");
    } catch (e) {
      console.error("Failed to update profile:", e);
      Alert.alert("Error", "Failed to save profile changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setFullName(user.fullName || "");
      setCollegeName(user.collegeName || "");
      setPhone(user.phone || "");
      setProfilePic(user.profilePic || "");
    }
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of Campus Lost & Found?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ]);
  };

  const emailDomain = user?.email ? user.email.split("@")[1] : "campus.edu";
  const memberDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Active Member";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.marigold]}
            tintColor={Colors.marigold}
          />
        }
      >
        {/* Profile Card Header */}
        <View style={styles.card}>
          {/* Avatar Section */}
          <View style={styles.avatarWrapper}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPhotoPickerVisible(true)}
              style={styles.avatarTouchable}
            >
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{getInitials(fullName || user?.fullName)}</Text>
                </View>
              )}

              {/* Camera Action Badge */}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={16} color={Colors.surface} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPhotoPickerVisible(true)}
              style={styles.changePhotoBtn}
            >
              <Text style={styles.changePhotoText}>
                {profilePic ? "Change Photo" : "+ Add Profile Photo"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* User Name & Status Tag */}
          {!isEditing ? (
            <View style={styles.nameHeaderArea}>
              <Text style={styles.displayName}>{user?.fullName || "Student"}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={14} color={Colors.forest} />
                <Text style={styles.verifiedText}>CAMPUS VERIFIED</Text>
              </View>
            </View>
          ) : (
            <View style={styles.editingBanner}>
              <Ionicons name="create" size={16} color={Colors.marigold} />
              <Text style={styles.editingBannerText}>Editing Profile Details</Text>
            </View>
          )}

          {/* Action Bar (Edit / Save / Cancel) */}
          <View style={styles.actionRow}>
            {!isEditing ? (
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setIsEditing(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil" size={16} color={Colors.ink} />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editActionsContainer}>
                <TouchableOpacity
                  style={[styles.btnCancel, saving && { opacity: 0.6 }]}
                  onPress={handleCancelEdit}
                  disabled={saving}
                >
                  <Text style={styles.btnCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnSave, saving && { opacity: 0.7 }]}
                  onPress={handleSaveChanges}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={Colors.surface} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done" size={16} color={Colors.surface} />
                      <Text style={styles.btnSaveText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* SECTION 1: College Affiliation (Highlighted prominently) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="school" size={20} color={Colors.marigold} />
              <Text style={styles.sectionTitle}>COLLEGE & CAMPUS</Text>
            </View>
            <View style={styles.officialPill}>
              <Text style={styles.officialPillText}>PRIMARY</Text>
            </View>
          </View>

          <View style={styles.fieldBox}>
            <Text style={styles.fieldLabel}>COLLEGE / UNIVERSITY NAME</Text>
            {!isEditing ? (
              <View style={styles.collegeValueRow}>
                <Text style={styles.collegeHighlightText}>
                  {user?.collegeName || "Not Provided"}
                </Text>
                <Ionicons name="business-outline" size={18} color={Colors.marigold} />
              </View>
            ) : (
              <TextInput
                style={styles.input}
                value={collegeName}
                onChangeText={setCollegeName}
                placeholder="e.g. Parul University"
                placeholderTextColor={Colors.stone}
                autoCapitalize="words"
              />
            )}
          </View>

          <View style={styles.fieldBox}>
            <Text style={styles.fieldLabel}>CAMPUS DOMAIN</Text>
            <View style={styles.domainRow}>
              <Ionicons name="globe-outline" size={16} color={Colors.stone} />
              <Text style={styles.domainText}>@{emailDomain}</Text>
            </View>
          </View>
        </View>

        {/* SECTION 2: Personal & Contact Information */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="person-circle" size={20} color={Colors.ink} />
              <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>
            </View>
          </View>

          {/* Full Name */}
          <View style={styles.fieldBox}>
            <Text style={styles.fieldLabel}>FULL NAME</Text>
            {!isEditing ? (
              <Text style={styles.fieldValue}>{user?.fullName || "—"}</Text>
            ) : (
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
                placeholderTextColor={Colors.stone}
                autoCapitalize="words"
              />
            )}
          </View>

          {/* Phone Number */}
          <View style={styles.fieldBox}>
            <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
            {!isEditing ? (
              <View style={styles.inlineValueRow}>
                <Ionicons name="call-outline" size={16} color={Colors.forest} />
                <Text style={styles.fieldValue}>{user?.phone || "—"}</Text>
              </View>
            ) : (
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. +91 9876543210"
                placeholderTextColor={Colors.stone}
                keyboardType="phone-pad"
              />
            )}
          </View>

          {/* Email (Read-only campus identity) */}
          <View style={styles.fieldBox}>
            <View style={styles.labelWithBadge}>
              <Text style={styles.fieldLabel}>CAMPUS EMAIL</Text>
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={10} color={Colors.stone} />
                <Text style={styles.lockBadgeText}>Fixed</Text>
              </View>
            </View>
            <View style={styles.inlineValueRow}>
              <Ionicons name="mail-outline" size={16} color={Colors.stone} />
              <Text style={styles.fieldValue}>{user?.email || "—"}</Text>
            </View>
            {isEditing && (
              <Text style={styles.helperText}>
                Campus email is tied to institutional login and cannot be altered.
              </Text>
            )}
          </View>
        </View>

        {/* SECTION 3: Account & Membership */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.stone} />
              <Text style={styles.sectionTitle}>MEMBERSHIP</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Account Role</Text>
            <Text style={styles.metaValue}>Student / Finder & Owner</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Registered Since</Text>
            <Text style={styles.metaValue}>{memberDate}</Text>
          </View>
        </View>

        {/* Log Out CTA */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.surface} />
          <Text style={styles.logoutButtonText}>SIGN OUT</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>Campus Lost & Found • Parul University Edition</Text>
      </ScrollView>

      {/* Photo Picker Modal */}
      <Modal
        visible={photoPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPhotoPickerVisible(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile Photo</Text>
              <TouchableOpacity onPress={() => setPhotoPickerVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.stone} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handlePickFromCamera}
              activeOpacity={0.7}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: Colors.paper }]}>
                <Ionicons name="camera" size={22} color={Colors.ink} />
              </View>
              <View style={styles.modalOptionTextWrapper}>
                <Text style={styles.modalOptionTitle}>Take Photo</Text>
                <Text style={styles.modalOptionSubtitle}>Use device camera to click a picture</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handlePickFromGallery}
              activeOpacity={0.7}
            >
              <View style={[styles.modalOptionIcon, { backgroundColor: Colors.paper }]}>
                <Ionicons name="images" size={22} color={Colors.marigold} />
              </View>
              <View style={styles.modalOptionTextWrapper}>
                <Text style={styles.modalOptionTitle}>Choose from Gallery</Text>
                <Text style={styles.modalOptionSubtitle}>Select an existing photo from library</Text>
              </View>
            </TouchableOpacity>

            {profilePic ? (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleRemovePhoto}
                activeOpacity={0.7}
              >
                <View style={[styles.modalOptionIcon, { backgroundColor: "#FCEBE6" }]}>
                  <Ionicons name="trash-outline" size={22} color={Colors.rust} />
                </View>
                <View style={styles.modalOptionTextWrapper}>
                  <Text style={[styles.modalOptionTitle, { color: Colors.rust }]}>
                    Remove Current Photo
                  </Text>
                  <Text style={styles.modalOptionSubtitle}>Revert to monogram initials avatar</Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setPhotoPickerVisible(false)}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: Colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 0,
    elevation: 3,
  },
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 12,
  },
  avatarTouchable: {
    position: "relative",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: Colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 2,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 46,
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 46,
    backgroundColor: Colors.marigold,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 34,
    fontWeight: "bold",
    color: Colors.surface,
    fontFamily: "serif",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.ink,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  changePhotoBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  changePhotoText: {
    fontSize: 12,
    color: Colors.marigold,
    fontWeight: "bold",
  },
  nameHeaderArea: {
    alignItems: "center",
    marginBottom: 14,
  },
  displayName: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.ink,
    fontFamily: "serif",
    textAlign: "center",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.forest,
    letterSpacing: 0.5,
  },
  editingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.paper,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editingBannerText: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.ink,
  },
  actionRow: {
    width: "100%",
    marginTop: 4,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.ink,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: Colors.ink,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 1,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.ink,
  },
  editActionsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btnCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.stone,
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: "bold",
    color: Colors.stone,
  },
  btnSave: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.forest,
    borderWidth: 1,
    borderColor: Colors.ink,
    paddingVertical: 10,
    borderRadius: 6,
    shadowColor: Colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 2,
  },
  btnSaveText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.surface,
  },

  // Sections
  sectionCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: Colors.paper,
    paddingBottom: 10,
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: Colors.ink,
    letterSpacing: 0.8,
  },
  officialPill: {
    backgroundColor: Colors.paper,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  officialPillText: {
    fontSize: 9,
    fontWeight: "bold",
    color: Colors.stone,
  },
  fieldBox: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.stone,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 15,
    color: Colors.ink,
    fontFamily: "monospace",
  },
  inlineValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  collegeValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.paper,
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: Colors.marigold,
  },
  collegeHighlightText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.ink,
    fontFamily: "serif",
    flex: 1,
  },
  domainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  domainText: {
    fontSize: 14,
    color: Colors.stone,
    fontFamily: "monospace",
  },
  labelWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.paper,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  lockBadgeText: {
    fontSize: 9,
    color: Colors.stone,
  },
  input: {
    backgroundColor: Colors.paper,
    borderWidth: 1.5,
    borderColor: Colors.marigold,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.ink,
    fontFamily: "monospace",
  },
  helperText: {
    fontSize: 11,
    color: Colors.stone,
    marginTop: 4,
    fontStyle: "italic",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.paper,
  },
  metaLabel: {
    fontSize: 13,
    color: Colors.stone,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.ink,
  },

  // Logout Button
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.rust,
    borderWidth: 1,
    borderColor: Colors.ink,
    borderRadius: 8,
    paddingVertical: 14,
    shadowColor: Colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 3,
    marginBottom: 16,
  },
  logoutButtonText: {
    color: Colors.surface,
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1.5,
  },
  footerNote: {
    fontSize: 11,
    color: Colors.stone,
    textAlign: "center",
    marginTop: 4,
  },

  // Photo Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: Colors.border,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.ink,
    fontFamily: "serif",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.paper,
  },
  modalOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalOptionTextWrapper: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: Colors.ink,
  },
  modalOptionSubtitle: {
    fontSize: 12,
    color: Colors.stone,
    marginTop: 2,
  },
  modalCancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.paper,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.ink,
  },
});
