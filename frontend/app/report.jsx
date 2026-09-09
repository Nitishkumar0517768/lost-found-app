import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import api from "../utils/api";
import { Colors } from "../constants/theme";
import CampusDatePicker from "../components/CampusDatePicker";
import CampusDropdown from "../components/CampusDropdown";

const CATEGORIES = [
  { label: "ID Card", value: "ID Card", icon: "card-outline" },
  { label: "Wallet", value: "Wallet", icon: "wallet-outline" },
  { label: "Phone", value: "Phone", icon: "phone-portrait-outline" },
  { label: "Bag", value: "Bag", icon: "bag-handle-outline" },
  { label: "Keys", value: "Keys", icon: "key-outline" },
  { label: "Electronics", value: "Electronics", icon: "laptop-outline" },
  { label: "Documents", value: "Documents", icon: "document-text-outline" },
  { label: "Other", value: "Other", icon: "cube-outline" },
];

const LOCATIONS = [
  { label: "Library", value: "Library", icon: "book-outline" },
  { label: "Canteen", value: "Canteen", icon: "restaurant-outline" },
  { label: "Parking", value: "Parking", icon: "car-outline" },
  { label: "Classroom", value: "Classroom", icon: "school-outline" },
  { label: "Other", value: "Other", icon: "location-outline" },
];

const TIMES = [
  { label: "Morning (8 AM - 12 PM)", value: "Morning", icon: "sunny-outline" },
  { label: "Afternoon (12 PM - 5 PM)", value: "Afternoon", icon: "partly-sunny-outline" },
  { label: "Evening (5 PM onwards)", value: "Evening", icon: "moon-outline" },
];

const HOLDING_LOCATIONS = [
  { label: "With Me", value: "with_me", icon: "person-outline" },
  { label: "Security Office", value: "security_office", icon: "shield-checkmark-outline" },
  { label: "College Office", value: "college_office", icon: "business-outline" },
];

export default function ReportScreen() {
  const router = useRouter();
  const [reportType, setReportType] = useState("lost"); // 'lost' | 'found'
  const [loading, setLoading] = useState(false);

  // Common Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(LOCATIONS[0].value);
  const [customLocation, setCustomLocation] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Lost Fields
  const [approxTime, setApproxTime] = useState("");

  // Found Fields
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [holdingLocation, setHoldingLocation] = useState(HOLDING_LOCATIONS[0].value);
  const [privateNotes, setPrivateNotes] = useState("");

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera access is needed to capture the found item.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.4,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const base64Data = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setImageUrl(base64Data);
        setImagePreview(asset.uri);
      }
    } catch (e) {
      console.error("Camera error:", e);
      Alert.alert("Error", "Could not open camera.");
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Photo library access is needed to select a picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.4,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const base64Data = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setImageUrl(base64Data);
        setImagePreview(asset.uri);
      }
    } catch (e) {
      console.error("Gallery error:", e);
      Alert.alert("Error", "Could not open gallery.");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !date) {
      Alert.alert("Required Fields", "Please enter title, description, and date.");
      return;
    }

    const finalLocation = location === "Other" ? (customLocation.trim() || "Other Campus Area") : location;

    setLoading(true);
    try {
      if (reportType === "lost") {
        await api.post("/lost-items", {
          title: title.trim(),
          description: description.trim(),
          category,
          location: finalLocation,
          dateLost: date,
          approxTime,
          imageUrl: imageUrl || undefined,
        });
        Alert.alert("Success", "Lost item reported successfully.");
      } else {
        if (!imageUrl) {
          Alert.alert(
            "Photo Required",
            "Please take a photo or choose an image for the found item."
          );
          setLoading(false);
          return;
        }

        await api.post("/found-items", {
          title: title.trim(),
          description: description.trim(),
          category,
          location: finalLocation,
          dateFound: date,
          imageUrl,
          holdingLocation,
          privateNotes: privateNotes.trim(),
        });
        Alert.alert("Success", "Found item reported successfully.");
      }
      router.replace("/(tabs)");
    } catch (error) {
      console.error(error);
      const err = error.response?.data?.error || "Could not save report.";
      Alert.alert("Error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: Colors.paper }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Type Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, reportType === "lost" && styles.toggleBtnActive]}
            onPress={() => setReportType("lost")}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleBtnText, reportType === "lost" && styles.toggleBtnTextActive]}>
              REPORT LOST ITEM
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, reportType === "found" && styles.toggleBtnActive]}
            onPress={() => setReportType("found")}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleBtnText, reportType === "found" && styles.toggleBtnTextActive]}>
              REPORT FOUND ITEM
            </Text>
          </TouchableOpacity>
        </View>

        {/* Noticeboard Form Board */}
        <View style={styles.board}>
          {/* Item Title */}
          <Text style={styles.label}>ITEM TITLE / NAME</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={
              reportType === "lost" ? "e.g. Lost my leather wallet" : "e.g. Found black wallet"
            }
            placeholderTextColor={Colors.stone}
          />

          {/* Category Dropdown */}
          <CampusDropdown
            label="CATEGORY"
            value={category}
            options={CATEGORIES}
            onSelect={setCategory}
            placeholder="Select category..."
          />

          {/* Description */}
          <Text style={styles.label}>
            {reportType === "lost"
              ? "DESCRIPTION (CONTENTS, DISTINGUISHING MARKS)"
              : "PUBLIC DESCRIPTION"}
          </Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            placeholder={
              reportType === "lost"
                ? "Describe brand, color, contents, unique keyrings..."
                : "General public details (e.g. Black leather wallet, found near library entrance)"
            }
            placeholderTextColor={Colors.stone}
          />

          {/* Location Dropdown */}
          <CampusDropdown
            label={reportType === "lost" ? "LAST SEEN LOCATION" : "LOCATION FOUND"}
            value={location}
            options={LOCATIONS}
            onSelect={setLocation}
            placeholder="Select location..."
          />

          {location === "Other" && (
            <TextInput
              style={styles.input}
              value={customLocation}
              onChangeText={setCustomLocation}
              placeholder="Specify other location details..."
              placeholderTextColor={Colors.stone}
            />
          )}

          {/* Date Picker */}
          <CampusDatePicker
            label={reportType === "lost" ? "DATE LOST" : "DATE FOUND"}
            value={date}
            onChange={setDate}
          />

          {/* Lost Item Specific: Approx Time */}
          {reportType === "lost" ? (
            <CampusDropdown
              label="APPROXIMATE TIME (OPTIONAL)"
              value={approxTime}
              options={[
                { label: "Any Time / Not Specified", value: "", icon: "time-outline" },
                ...TIMES,
              ]}
              onSelect={setApproxTime}
              placeholder="Select approximate time..."
            />
          ) : (
            <View>
              {/* Current Holding Location Dropdown */}
              <CampusDropdown
                label="CURRENT HOLDING LOCATION"
                value={holdingLocation}
                options={HOLDING_LOCATIONS}
                onSelect={setHoldingLocation}
                placeholder="Select holding location..."
              />

              {/* Photo Upload Section */}
              <Text style={styles.label}>ITEM PHOTO (CAMERA / GALLERY)</Text>
              <View style={styles.photoActionsRow}>
                <TouchableOpacity
                  style={styles.cameraBtn}
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cameraBtnText}>📸 Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.galleryBtn}
                  onPress={handlePickFromGallery}
                  activeOpacity={0.8}
                >
                  <Text style={styles.galleryBtnText}>🖼️ Choose Image</Text>
                </TouchableOpacity>
              </View>

              {imagePreview ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: imagePreview }} style={styles.previewImage} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => {
                      setImageUrl("");
                      setImagePreview("");
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeImageText}>✕ Remove Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Private Verification Notes */}
              <Text style={styles.label}>PRIVATE VERIFICATION NOTES (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                multiline
                numberOfLines={3}
                value={privateNotes}
                onChangeText={setPrivateNotes}
                placeholder="e.g. cash amount inside, ID name, serial numbers. Hidden from public listings."
                placeholderTextColor={Colors.stone}
              />
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.submitBtnText}>PIN TO NOTICEBOARD</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.paper,
    padding: 16,
    paddingBottom: 40,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    marginBottom: 16,
    overflow: "hidden",
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: Colors.ink,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.stone,
    letterSpacing: 0.5,
  },
  toggleBtnTextActive: {
    color: Colors.surface,
  },
  board: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    shadowColor: Colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.ink,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.paper,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 4,
    padding: 10,
    fontSize: 14,
    color: Colors.ink,
    marginBottom: 14,
  },
  textarea: {
    height: 80,
    textAlignVertical: "top",
  },
  photoActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  cameraBtn: {
    flex: 1,
    backgroundColor: Colors.marigold,
    borderWidth: 1,
    borderColor: Colors.ink,
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: "center",
  },
  cameraBtnText: {
    color: Colors.surface,
    fontWeight: "bold",
    fontSize: 13,
  },
  galleryBtn: {
    flex: 1,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: "center",
  },
  galleryBtnText: {
    color: Colors.ink,
    fontWeight: "bold",
    fontSize: 13,
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.paper,
  },
  removeImageBtn: {
    marginTop: 8,
    padding: 4,
  },
  removeImageText: {
    color: Colors.rust,
    fontSize: 13,
    fontWeight: "bold",
  },
  submitBtn: {
    backgroundColor: Colors.marigold,
    borderWidth: 1,
    borderColor: Colors.ink,
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: Colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 2,
  },
  submitBtnText: {
    color: Colors.surface,
    fontWeight: "bold",
    fontSize: 15,
    letterSpacing: 1.2,
  },
});
