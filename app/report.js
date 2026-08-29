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
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import api from "../utils/api";
import { Colors } from "../constants/theme";

const CATEGORIES = ["ID Card", "Wallet", "Phone", "Bag", "Keys", "Electronics", "Documents", "Other"];
const LOCATIONS = ["Library", "Canteen", "Parking", "Classroom", "Other"];
const TIMES = ["Morning", "Afternoon", "Evening"];
const HOLDING_LOCATIONS = [
  { label: "With Me", value: "with_me" },
  { label: "Security Office", value: "security_office" },
  { label: "College Office", value: "college_office" },
];

export default function ReportScreen() {
  const router = useRouter();
  const [reportType, setReportType] = useState("lost");
  const [loading, setLoading] = useState(false);

  // Common Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(LOCATIONS[0]);
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
        quality: 0.6,
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
        quality: 0.6,
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
    if (!title || !description || !date) {
      Alert.alert("Required Fields", "Please enter title, description, and date.");
      return;
    }

    const finalLocation = location === "Other" ? customLocation || "Other" : location;

    setLoading(true);
    try {
      if (reportType === "lost") {
        await api.post("/lost-items", {
          title,
          description,
          category,
          location: finalLocation,
          dateLost: date,
          approxTime,
          imageUrl: imageUrl || undefined,
        });
        Alert.alert("Success", "Lost item reported successfully.");
      } else {
        if (!imageUrl) {
          Alert.alert("Photo Required", "Please take a photo or choose an image for the found item.");
          setLoading(false);
          return;
        }

        await api.post("/found-items", {
          title,
          description,
          category,
          location: finalLocation,
          dateFound: date,
          imageUrl,
          holdingLocation,
          privateNotes,
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
    <ScrollView contentContainerStyle={styles.container}>
      {/* Type Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, reportType === "lost" && styles.toggleBtnActive]}
          onPress={() => setReportType("lost")}
        >
          <Text style={[styles.toggleBtnText, reportType === "lost" && styles.toggleBtnTextActive]}>
            REPORT LOST ITEM
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, reportType === "found" && styles.toggleBtnActive]}
          onPress={() => setReportType("found")}
        >
          <Text style={[styles.toggleBtnText, reportType === "found" && styles.toggleBtnTextActive]}>
            REPORT FOUND ITEM
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.board}>
        {/* Title */}
        <Text style={styles.label}>Item Title / Name</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={reportType === "lost" ? "e.g. Lost my leather wallet" : "e.g. Found black wallet"}
          placeholderTextColor={Colors.stone}
        />

        {/* Category Selector */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.selectorGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.selectorChip, category === cat && styles.selectorChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.selectorChipText, category === cat && styles.selectorChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={styles.label}>
          {reportType === "lost" ? "Description (contents, distinguishing marks)" : "Public Description"}
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

        {/* Location Selector */}
        <Text style={styles.label}>{reportType === "lost" ? "Last Seen Location" : "Location Found"}</Text>
        <View style={styles.selectorGrid}>
          {LOCATIONS.map((loc) => (
            <TouchableOpacity
              key={loc}
              style={[styles.selectorChip, location === loc && styles.selectorChipActive]}
              onPress={() => setLocation(loc)}
            >
              <Text style={[styles.selectorChipText, location === loc && styles.selectorChipTextActive]}>
                {loc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
        <Text style={styles.label}>{reportType === "lost" ? "Date Lost" : "Date Found"}</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={Colors.stone}
        />

        {/* Report Type Specific Fields */}
        {reportType === "lost" ? (
          <View>
            <Text style={styles.label}>Approximate Time (Optional)</Text>
            <View style={styles.selectorGrid}>
              {TIMES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.selectorChip, approxTime === t && styles.selectorChipActive]}
                  onPress={() => setApproxTime(approxTime === t ? "" : t)}
                >
                  <Text style={[styles.selectorChipText, approxTime === t && styles.selectorChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.label}>Current Holding Location</Text>
            <View style={styles.selectorGrid}>
              {HOLDING_LOCATIONS.map((hl) => (
                <TouchableOpacity
                  key={hl.value}
                  style={[styles.selectorChip, holdingLocation === hl.value && styles.selectorChipActive]}
                  onPress={() => setHoldingLocation(hl.value)}
                >
                  <Text
                    style={[
                      styles.selectorChipText,
                      holdingLocation === hl.value && styles.selectorChipTextActive,
                    ]}
                  >
                    {hl.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Camera / Photo Section */}
            <Text style={styles.label}>Item Photo (Camera / Gallery)</Text>
            <View style={styles.photoActionsRow}>
              <TouchableOpacity style={styles.cameraBtn} onPress={handleTakePhoto}>
                <Text style={styles.cameraBtnText}>📸 Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.galleryBtn} onPress={handlePickFromGallery}>
                <Text style={styles.galleryBtnText}>🖼️ Choose Image</Text>
              </TouchableOpacity>
            </View>

            {imagePreview ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imagePreview }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => {
                    setImageUrl("");
                    setImagePreview("");
                  }}
                >
                  <Text style={styles.removeImageText}>✕ Remove Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TextInput
                style={styles.input}
                value={imageUrl}
                onChangeText={(t) => {
                  setImageUrl(t);
                  setImagePreview(t);
                }}
                placeholder="Or paste an image URL..."
                placeholderTextColor={Colors.stone}
              />
            )}

            <Text style={styles.label}>Private Verification Notes (Optional)</Text>
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

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <Text style={styles.submitBtnText}>PIN TO NOTICEBOARD</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  },
  toggleBtnTextActive: {
    color: Colors.surface,
  },
  board: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 20,
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
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    padding: 10,
    fontSize: 15,
    color: Colors.ink,
    marginBottom: 16,
  },
  textarea: {
    height: 80,
    textAlignVertical: "top",
  },
  selectorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  selectorChip: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  selectorChipActive: {
    backgroundColor: Colors.marigold,
    borderColor: Colors.ink,
  },
  selectorChipText: {
    color: Colors.stone,
    fontSize: 12,
  },
  selectorChipTextActive: {
    color: Colors.surface,
    fontWeight: "bold",
  },
  photoActionsRow: {
    flexDirection: "row",
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
    marginRight: 6,
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
    marginLeft: 6,
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
    marginTop: 6,
    padding: 4,
  },
  removeImageText: {
    color: Colors.rust,
    fontSize: 12,
    fontWeight: "bold",
  },
  submitBtn: {
    backgroundColor: Colors.marigold,
    borderWidth: 1,
    borderColor: Colors.ink,
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    shadowColor: Colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 2,
  },
  submitBtnText: {
    color: Colors.surface,
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1.5,
  },
});
