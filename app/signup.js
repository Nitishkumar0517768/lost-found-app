import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../constants/theme";

export default function SignupScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { signup } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    setErrorMessage("");
    if (!fullName || !email || !password || !phone || !collegeName) {
      setErrorMessage("Please fill in all required fields.");
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      await signup(fullName.trim(), email.trim(), password, phone.trim(), collegeName.trim());
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Signup error:", error);
      const errMsg = error.response?.data?.error || error.message || "Registration failed. Please check details.";
      setErrorMessage(errMsg);
      Alert.alert("Signup Failed", errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.board}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerSerif}>Register</Text>
          <Text style={styles.subheader}>Create your student account</Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={(t) => {
              setFullName(t);
              setErrorMessage("");
            }}
            placeholder="e.g. John Doe"
            placeholderTextColor={Colors.stone}
          />

          <Text style={styles.label}>College Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
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
            onChangeText={(t) => {
              setPassword(t);
              setErrorMessage("");
            }}
            placeholder="••••••••"
            placeholderTextColor={Colors.stone}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              setErrorMessage("");
            }}
            placeholder="e.g. +91 9876543210"
            placeholderTextColor={Colors.stone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>College Name</Text>
          <TextInput
            style={styles.input}
            value={collegeName}
            onChangeText={(t) => {
              setCollegeName(t);
              setErrorMessage("");
            }}
            placeholder="e.g. Parul University"
            placeholderTextColor={Colors.stone}
          />

          <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.buttonText}>REGISTER NOW</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginPrompt}>
            <Text style={styles.promptText}>Already registered? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginText}>Log In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.paper,
    justifyContent: "center",
    padding: 20,
    paddingVertical: 40,
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
    fontSize: 28,
    fontFamily: "serif",
    fontWeight: "bold",
    color: Colors.ink,
  },
  subheader: {
    fontSize: 14,
    color: Colors.stone,
    textAlign: "center",
    marginTop: 4,
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
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.ink,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
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
  button: {
    backgroundColor: Colors.marigold,
    borderWidth: 1,
    borderColor: Colors.ink,
    borderRadius: 4,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
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
  loginPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  promptText: {
    color: Colors.stone,
    fontSize: 14,
  },
  loginText: {
    color: Colors.rust,
    fontWeight: "bold",
    fontSize: 14,
  },
});
