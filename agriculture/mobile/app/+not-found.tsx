import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useUser } from '@clerk/clerk-expo';

export default function NotFoundScreen() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Handle OAuth callbacks and redirects
    if (isLoaded) {
      if (isSignedIn) {
        // If user is signed in, redirect to home
        router.replace('/(tabs)/home');
      } else {
        // If not signed in, redirect to landing page
        router.replace('/');
      }
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading while processing
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    color: '#666',
  },
});
