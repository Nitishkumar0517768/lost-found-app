import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Alert,
  Image,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useDrawer } from '../context/DrawerContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 320);

export default function DrawerMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user, logout, unreadCount } = useAuth();
  const { isOpen, closeDrawer } = useDrawer();

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const handleNavigate = (route) => {
    closeDrawer();
    setTimeout(() => {
      if (route === '/report') {
        router.push('/report');
      } else {
        router.replace(route);
      }
    }, 150);
  };

  const handleLogout = () => {
    closeDrawer();
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const navItems = [
    {
      title: 'Noticeboard',
      icon: 'newspaper-outline',
      activeIcon: 'newspaper',
      route: '/(tabs)',
      isActive: pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index',
    },
    {
      title: 'Report Item (+)',
      icon: 'add-circle-outline',
      activeIcon: 'add-circle',
      route: '/report',
      isHighlight: true,
      isActive: pathname === '/report',
    },
    {
      title: 'My Found Items',
      icon: 'archive-outline',
      activeIcon: 'archive',
      route: '/(tabs)/found',
      isActive: pathname === '/(tabs)/found' || pathname === '/found',
    },
    {
      title: 'Claims Received',
      icon: 'file-tray-full-outline',
      activeIcon: 'file-tray-full',
      route: '/(tabs)/claims',
      isActive: pathname === '/(tabs)/claims' || pathname === '/claims',
    },
    {
      title: 'Alerts & Notices',
      icon: 'notifications-outline',
      activeIcon: 'notifications',
      route: '/(tabs)/notifications',
      badge: unreadCount > 0 ? unreadCount : null,
      isActive: pathname === '/(tabs)/notifications' || pathname === '/notifications',
    },
    {
      title: 'Student Profile',
      icon: 'person-outline',
      activeIcon: 'person',
      route: '/(tabs)/profile',
      isActive: pathname === '/(tabs)/profile' || pathname === '/profile',
    },
  ];

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={closeDrawer}>
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Drawer Content */}
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
              paddingTop: insets.top > 0 ? insets.top + 8 : 24,
              paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 24,
            },
          ]}
        >
          {/* Header Area */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.brandRow}>
                <Ionicons name="school" size={22} color={Colors.marigold} />
                <Text style={styles.brandTitle}>CAMPUS L&F</Text>
              </View>
              <TouchableOpacity
                onPress={closeDrawer}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={Colors.stone} />
              </TouchableOpacity>
            </View>

            {/* Student Info Card */}
            <View style={styles.userCard}>
              <View style={styles.avatar}>
                {user?.profilePic ? (
                  <Image source={{ uri: user.profilePic }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.fullName || 'Student User'}
                </Text>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {user?.email || 'student@campus.edu'}
                </Text>
                {user?.collegeName && (
                  <View style={styles.collegeBadge}>
                    <Text style={styles.collegeBadgeText} numberOfLines={1}>
                      🏫 {user.collegeName}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Navigation Items */}
          <View style={styles.menuList}>
            {navItems.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={[
                  styles.navItem,
                  item.isActive && styles.navItemActive,
                  item.isHighlight && styles.navItemHighlight,
                ]}
                onPress={() => handleNavigate(item.route)}
                activeOpacity={0.7}
              >
                <View style={styles.navItemLeft}>
                  <Ionicons
                    name={item.isActive ? item.activeIcon : item.icon}
                    size={22}
                    color={
                      item.isHighlight
                        ? Colors.surface
                        : item.isActive
                        ? Colors.marigold
                        : Colors.ink
                    }
                  />
                  <Text
                    style={[
                      styles.navItemText,
                      item.isActive && styles.navItemTextActive,
                      item.isHighlight && styles.navItemTextHighlight,
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>

                {item.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer Area */}
          <View style={styles.footer}>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={20} color={Colors.rust} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>Campus Lost & Found • v1.0.0</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: Colors.surface,
    borderRightWidth: 2,
    borderRightColor: Colors.border,
    justifyContent: 'space-between',
    shadowColor: Colors.ink,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 14,
    fontFamily: 'serif',
    fontWeight: 'bold',
    color: Colors.ink,
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 4,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.paper,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.marigold,
    borderWidth: 1,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: Colors.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.ink,
  },
  userEmail: {
    fontSize: 11,
    color: Colors.stone,
    marginTop: 2,
  },
  collegeBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  collegeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.stone,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: Colors.paper,
    borderLeftWidth: 3,
    borderLeftColor: Colors.marigold,
  },
  navItemHighlight: {
    backgroundColor: Colors.marigold,
    borderWidth: 1,
    borderColor: Colors.ink,
    marginTop: 4,
    marginBottom: 8,
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
  navItemTextActive: {
    color: Colors.marigold,
    fontWeight: 'bold',
  },
  navItemTextHighlight: {
    color: Colors.surface,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: Colors.rust,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: Colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 20,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.rust,
  },
  versionText: {
    fontSize: 11,
    color: Colors.stone,
    marginTop: 8,
    textAlign: 'center',
  },
});
