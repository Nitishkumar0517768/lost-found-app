import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Colors } from "../../constants/theme";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>🎒</Text>
        </View>

        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.college}>{user?.collegeName}</Text>

        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{user?.phone}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={logout}>
          <Text style={styles.buttonText}>LOG OUT</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.paper,
    justifyContent: "center",
    padding: 20,
  },
  board: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 24,
    alignItems: "center",
    shadowColor: Colors.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 4,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.paper,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarText: {
    fontSize: 40,
  },
  name: {
    fontSize: 22,
    fontFamily: "serif",
    fontWeight: "bold",
    color: Colors.ink,
    textAlign: "center",
  },
  college: {
    fontSize: 14,
    color: Colors.marigold,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 24,
  },
  infoList: {
    width: "100%",
    marginBottom: 30,
  },
  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.paper,
    paddingVertical: 12,
    width: "100%",
  },
  label: {
    fontSize: 11,
    fontWeight: "bold",
    color: Colors.stone,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    color: Colors.ink,
    fontFamily: "monospace",
  },
  button: {
    backgroundColor: Colors.rust,
    borderWidth: 1,
    borderColor: Colors.ink,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: "center",
    shadowColor: Colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 2,
  },
  buttonText: {
    color: Colors.surface,
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1.5,
  },
});
