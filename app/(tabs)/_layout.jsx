import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useDrawer } from '../../context/DrawerContext';
import HeaderProfileButton from '../../components/HeaderProfileButton';

export default function TabLayout() {
  const router = useRouter();
  const { unreadCount } = useAuth();
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.marigold,
        tabBarInactiveTintColor: Colors.stone,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 2,
          borderTopColor: Colors.border,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: 'bold',
        },
        headerStyle: {
          backgroundColor: Colors.paper,
          borderBottomWidth: 2,
          borderBottomColor: Colors.border,
        },
        headerTintColor: Colors.ink,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={openDrawer}
            style={{ marginLeft: 16, padding: 4 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu" size={26} color={Colors.ink} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={{ marginRight: 16 }}>
            <HeaderProfileButton />
          </View>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Noticeboard',
          tabBarLabel: 'Noticeboard',
          headerShown: true,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'newspaper' : 'newspaper-outline'}
              size={size || 22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="found"
        options={{
          title: 'My Found Items',
          tabBarLabel: 'Found',
          headerShown: true,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'archive' : 'archive-outline'}
              size={size || 22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="claims"
        options={{
          title: 'Claims Received',
          tabBarLabel: 'Claims',
          headerShown: true,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'file-tray-full' : 'file-tray-full-outline'}
              size={size || 22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarLabel: 'Alerts',
          headerShown: true,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.rust,
            color: Colors.surface,
          },
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={size || 22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Student Profile',
          tabBarLabel: 'Profile',
          headerShown: true,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size || 22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
