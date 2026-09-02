import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/theme';

export default function HeaderProfileButton({ style, size = 36 }) {
  const router = useRouter();
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);

  // Reset image error state whenever user profilePic changes
  useEffect(() => {
    setImageError(false);
  }, [user?.profilePic]);

  const getFirstLetter = () => {
    const name = user?.fullName || user?.name || user?.email || 'U';
    const trimmed = name.trim();
    return trimmed.length > 0 ? trimmed[0].toUpperCase() : 'U';
  };

  const hasValidPicture = Boolean(
    user?.profilePic &&
    typeof user.profilePic === 'string' &&
    user.profilePic.trim().length > 0 &&
    !imageError
  );

  const handlePress = () => {
    router.push('/(tabs)/profile');
  };

  const firstLetter = getFirstLetter();

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel="Student Profile"
      accessibilityRole="button"
    >
      {hasValidPicture ? (
        <Image
          source={{ uri: user.profilePic }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <Text style={[styles.letter, { fontSize: Math.round(size * 0.44) }]}>
          {firstLetter}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.marigold,
    borderWidth: 1.5,
    borderColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  letter: {
    color: Colors.surface,
    fontWeight: 'bold',
    fontFamily: 'serif',
    includeFontPadding: false,
    textAlign: 'center',
  },
});
