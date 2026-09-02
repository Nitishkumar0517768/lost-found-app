import { Link } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../constants/theme';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Noticeboard Info</Text>
      <Link href="/" dismissTo style={styles.link}>
        <Text style={styles.linkText}>Return to Noticeboard</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.paper,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.ink,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    color: Colors.marigold,
    fontWeight: 'bold',
  },
});
