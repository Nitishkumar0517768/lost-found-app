import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../constants/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setErrorMessage("");
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Login error:", error);
      const errMsg =
        error.response?.data?.error ||
        error.message ||
        "Login failed. Please check your credentials and ensure backend is running.";
      setErrorMessage(errMsg);
      Alert.alert("Login Failed", errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerSerif}>Campus</Text>
          <Text style={styles.subheaderSerif}>Lost & Found</Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Text style={styles.label}>College Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrorMessage("");
            }}
            placeholder="e.g. name@paruluniversity.ac.in"
            placeholderTextColor={Colors.stone}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrorMessage("");
            }}
            placeholder="••••••••"
            placeholderTextColor={Colors.stone}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.buttonText}>PIN TO BOARD</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signupPrompt}>
            <Text style={styles.promptText}>New student? </Text>
            <Link href="/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.signupText}>Create account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
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
    padding: 24,
    borderRadius: 8,
    shadowColor: Colors.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 4,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  headerSerif: {
    fontSize: 32,
    fontFamily: "serif",
    fontWeight: "bold",
    color: Colors.ink,
    textAlign: "center",
  },
  subheaderSerif: {
    fontSize: 24,
    fontFamily: "serif",
    fontStyle: "italic",
    color: Colors.marigold,
    textAlign: "center",
    marginTop: -4,
  },
  errorBox: {
    backgroundColor: "#FADBD8",
    borderWidth: 1,
    borderColor: Colors.rust,
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.rust,
    fontSize: 13,
    fontWeight: "bold",
  },
  form: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.ink,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    color: Colors.ink,
    marginBottom: 18,
    fontFamily: "monospace",
  },
  button: {
    backgroundColor: Colors.marigold,
    borderWidth: 1,
    borderColor: Colors.ink,
    borderRadius: 4,
    padding: 14,
    alignItems: "center",
    marginTop: 6,
    shadowColor: Colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 2,
  },
  buttonText: {
    color: Colors.surface,
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1.5,
  },
  signupPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  promptText: {
    color: Colors.stone,
    fontSize: 14,
  },
  signupText: {
    color: Colors.rust,
    fontWeight: "bold",
    fontSize: 14,
  },
});
