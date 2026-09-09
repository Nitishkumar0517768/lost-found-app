import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { DrawerProvider } from '../context/DrawerContext';
import DrawerMenu from '../components/DrawerMenu';
import { Colors } from '../constants/theme';
import HeaderProfileButton from '../components/HeaderProfileButton';
import 'react-native-reanimated';

function RootLayoutContent() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.marigold} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen 
        name="report" 
        options={{ 
          title: 'Report Item',
          headerStyle: { backgroundColor: Colors.paper },
          headerTintColor: Colors.ink,
          headerTitleStyle: { fontWeight: 'bold' },
          headerRight: () => (
            <View style={{ marginRight: 16 }}>
              <HeaderProfileButton />
            </View>
          ),
        }} 
      />
    </Stack>
  );
}


export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DrawerProvider>
          <RootLayoutContent />
          <DrawerMenu />
          <StatusBar style="dark" />
        </DrawerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
