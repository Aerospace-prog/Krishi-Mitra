import { Link } from 'expo-router';
import { View, Text } from '@/components/Themed';
import { StyleSheet, Pressable } from 'react-native';

export default function Landing() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Krishi Mitra</Text>
      <Text style={styles.subtitle}>AI-powered crop recommendations for Indian farmers</Text>
      <View style={{ height: 24 }} />
      <Link href="/(tabs)" asChild>
        <Pressable style={styles.primary}><Text style={styles.primaryText}>Try Demo</Text></Pressable>
      </Link>
      <View style={{ height: 12 }} />
      <Link href="/(public)/sign-in" asChild>
        <Pressable style={styles.secondary}><Text style={styles.secondaryText}>Sign In</Text></Pressable>
      </Link>
      <View style={{ height: 12 }} />
      <Link href="/(public)/sign-up" asChild>
        <Pressable style={styles.secondary}><Text style={styles.secondaryText}>Create Account</Text></Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { fontSize: 16, opacity: 0.7, textAlign: 'center', marginTop: 8 },
  primary: { backgroundColor: '#2e7d32', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondary: { borderColor: '#2e7d32', borderWidth: 1, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  secondaryText: { color: '#2e7d32', fontWeight: '700' },
});


