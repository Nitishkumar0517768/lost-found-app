import { Platform } from 'react-native';

export const Colors = {
  // Noticeboard palette
  paper: '#F6F1E4',
  surface: '#FFFDF7',
  ink: '#2B2620',
  marigold: '#E8A33D',
  rust: '#C1502E',
  forest: '#3F6B4A',
  stone: '#8A8175',
  border: '#D4CBB5',

  light: {
    text: '#2B2620',        // Ink
    background: '#F6F1E4',  // Paper
    tint: '#E8A33D',        // Marigold
    icon: '#8A8175',        // Stone
    tabIconDefault: '#8A8175',
    tabIconSelected: '#E8A33D',
  },
  dark: {
    text: '#F6F1E4',
    background: '#2B2620',
    tint: '#E8A33D',
    icon: '#8A8175',
    tabIconDefault: '#8A8175',
    tabIconSelected: '#E8A33D',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'Inter',
    serif: 'Fraunces',
    mono: 'IBM Plex Mono',
  },
  android: {
    sans: 'sans-serif',
    serif: 'serif',
    mono: 'monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    mono: 'monospace',
  },
});
