import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { unreadCount } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.marigold,
        tabBarInactiveTintColor: Colors.stone,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 2,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
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
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Noticeboard',
          tabBarLabel: 'Noticeboard',
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="claims"
        options={{
          title: 'Claims Received',
          tabBarLabel: 'Claims',
          headerShown: true,
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
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Student Profile',
          tabBarLabel: 'Profile',
          headerShown: true,
        }}
      />
    </Tabs>
  );
}
