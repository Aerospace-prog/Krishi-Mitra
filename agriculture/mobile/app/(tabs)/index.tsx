import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { Text, View } from '@/components/Themed';

type RecommendationResponse = {
  crop_recommendation: string;
  advice: string;
  live_data_used: Record<string, any>;
  location_info: { state?: string };
};

export default function TabOneScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);

  async function requestAndFetch() {
    setError(null);
    setLoading(true);
    setRecommendation(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const latitude = loc.coords.latitude;
      const longitude = loc.coords.longitude;

      let baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
      // Android emulator cannot reach localhost; use 10.0.2.2
      if (Platform.OS === 'android') {
        if (baseUrl.includes('127.0.0.1')) baseUrl = baseUrl.replace('127.0.0.1', '10.0.2.2');
        if (baseUrl.includes('localhost')) baseUrl = baseUrl.replace('localhost', '10.0.2.2');
      }
      const res = await fetch(`${baseUrl}/v1/recommendations/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude })
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`API error: ${res.status} ${msg}`);
      }
      const data = (await res.json()) as RecommendationResponse;
      setRecommendation(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Recommend</Text>
      <Text style={styles.subtitle}>Get crop recommendations for your current location</Text>
      <View style={{ height: 16 }} />
      <Pressable style={styles.button} onPress={requestAndFetch} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Fetching…' : 'Recommend Crop'}</Text>
      </Pressable>
      <View style={{ height: 16 }} />
      {loading && <ActivityIndicator />}
      {error && <Text style={styles.error}>{error}</Text>}
      {recommendation && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recommended Crop</Text>
          <Text style={styles.cardValue}>{recommendation.crop_recommendation}</Text>
          <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
          <Text style={styles.cardTitle}>AI Advice</Text>
          <Text>{recommendation.advice}</Text>
          <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
          <Text style={styles.cardTitle}>Location</Text>
          <Text>{recommendation.location_info?.state || 'Unknown'}</Text>
          <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
          <Text style={styles.cardTitle}>Environmental Data</Text>
          <Text>Temperature: {String(recommendation.live_data_used?.temperature)} °C</Text>
          <Text>Humidity: {String(recommendation.live_data_used?.humidity)} %</Text>
          <Text>pH: {String(recommendation.live_data_used?.ph)}</Text>
          <Text>N: {String(recommendation.live_data_used?.N)} kg/ha</Text>
          <Text>Rainfall: {String(recommendation.live_data_used?.rainfall_mm_monthly_avg)} mm/month</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'flex-start', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 16, opacity: 0.7, textAlign: 'center' },
  separator: { marginVertical: 16, height: 1, width: '100%' },
  button: { backgroundColor: '#2e7d32', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#c62828' },
  card: { width: '100%', gap: 8 },
  cardTitle: { fontWeight: '700', marginTop: 8 },
  cardValue: { fontSize: 18, fontWeight: '700' },
});
