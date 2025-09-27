import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, SafeAreaView, Modal, Image, Alert, ImageBackground } from 'react-native';
import * as Location from 'expo-location';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

type RecommendationResponse = {
  crop_recommendation: string;
  advice: string;
  live_data_used: Record<string, any>;
  location_info: { state?: string };
};

export default function HomeScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

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
    
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Krishi Mitra</Text>
        <View style={styles.headerIcons}>
          <Pressable 
            style={styles.iconButton}
            onPress={() => setShowNotifications(true)}
          >
            <Ionicons name="notifications" size={20} color="#fff" />
          </Pressable>
          <Pressable 
            style={styles.profileButton}
            onPress={() => setShowProfile(true)}
          >
            {user?.imageUrl ? (
              <Image 
                source={{ uri: user.imageUrl }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImageFallback}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Welcome Section with Background */}
        <ImageBackground 
          source={require('@/assets/images/farm-field-bg.jpg')}
          style={styles.welcomeSection}
          imageStyle={styles.welcomeBackgroundImage}
        >
          {/* <View style={styles.welcomeOverlay}> */}
            <Text style={styles.welcomeText}>Welcome, {user?.firstName || 'Suresh'}! 🌱</Text>
          {/* </View> */}
        </ImageBackground>

        {/* Cards Grid */}
        <View style={styles.cardsContainer}>
          {/* Weather Card */}
          <View style={styles.weatherCard}>
            <Text style={styles.cardTitle}>Weather</Text>
            <View style={styles.weatherContent}>
              <View style={styles.weatherIcon}>
                <Ionicons name="sunny" size={32} color="#FFD700" />
                <Ionicons name="cloud" size={20} color="#fff" style={styles.cloudIcon} />
              </View>
              <Text style={styles.weatherLocation}>Bengaluru, 28°</Text>
              <Text style={styles.weatherDesc}>Mostly sunny</Text>
              <Ionicons name="notifications-outline" size={16} color="#4CAF50" style={styles.weatherNotification} />
            </View>
          </View>

          {/* Market Pulse Card */}
          <View style={styles.marketCard}>
            <Text style={styles.cardTitle}>Market Pulse</Text>
            <View style={styles.marketContent}>
              <View style={styles.marketCircle}>
                <Text style={styles.marketPercentage}>72%</Text>
              </View>
              <View style={styles.marketChart}>
                <Ionicons name="trending-up" size={60} color="#4CAF50" />
              </View>
              <View style={styles.marketInfo}>
                <Text style={styles.marketCrop}>Tomato</Text>
                <Text style={styles.marketCrop}>Demand</Text>
                <Text style={styles.marketPrice}>₹38/kg</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Second Row Cards */}
        <View style={styles.cardsContainer}>
          {/* Farm Status Card */}
          <View style={styles.farmCard}>
            <Text style={styles.cardTitle}>My Farm Status</Text>
            <Text style={styles.farmHealth}>Soil Health:</Text>
            <Text style={styles.farmHealthStatus}>Excellent</Text>
            <Text style={styles.farmCrop}>Last Crop: Rice</Text>
            <View style={styles.farmPlantIcon}>
              <Ionicons name="leaf" size={40} color="#4CAF50" />
            </View>
          </View>

          {/* Quick Market Prices */}
          <View style={styles.pricesCard}>
            <Text style={styles.cardTitle}>Quick Market Prices</Text>
            <View style={styles.priceContent}>
              <Text style={styles.priceItem}>Potato: ₹15/kg</Text>
              <View style={styles.priceIndicator}>
                <Ionicons name="arrow-up" size={20} color="#4CAF50" />
                <Text style={styles.priceChange}>5%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Analyze My Farm Button */}
        <Pressable style={styles.analyzeButton} onPress={requestAndFetch} disabled={loading}>
          <Text style={styles.analyzeButtonText}>
            {loading ? 'Analyzing...' : 'Analyze My Farm'}
          </Text>
          {loading && <ActivityIndicator color="#fff" style={{ marginLeft: 8 }} />}
        </Pressable>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Recommendation Results */}
        {recommendation && (
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>Farm Analysis Results</Text>
            <View style={styles.recommendationContent}>
              <View style={styles.recommendationItem}>
                <Text style={styles.recommendationLabel}>Recommended Crop</Text>
                <Text style={styles.recommendationValue}>{recommendation.crop_recommendation}</Text>
              </View>
              
              <View style={styles.recommendationItem}>
                <Text style={styles.recommendationLabel}>AI Advice</Text>
                <Text style={styles.recommendationAdvice}>{recommendation.advice}</Text>
              </View>
              
              <View style={styles.recommendationItem}>
                <Text style={styles.recommendationLabel}>Location</Text>
                <Text style={styles.recommendationText}>{recommendation.location_info?.state || 'Unknown'}</Text>
              </View>
              
              <View style={styles.recommendationItem}>
                <Text style={styles.recommendationLabel}>Environmental Data</Text>
                <View style={styles.environmentalData}>
                  <Text style={styles.dataItem}>🌡️ Temperature: {String(recommendation.live_data_used?.temperature)}°C</Text>
                  <Text style={styles.dataItem}>💧 Humidity: {String(recommendation.live_data_used?.humidity)}%</Text>
                  <Text style={styles.dataItem}>🧪 pH: {String(recommendation.live_data_used?.ph)}</Text>
                  <Text style={styles.dataItem}>🌱 Nitrogen: {String(recommendation.live_data_used?.N)} kg/ha</Text>
                  <Text style={styles.dataItem}>🌧️ Rainfall: {String(recommendation.live_data_used?.rainfall_mm_monthly_avg)} mm/month</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Chat Button */}
        <View style={styles.chatButtonContainer}>
          <Pressable style={styles.chatButton}>
            <Ionicons name="chatbubbles" size={24} color="#fff" />
          </Pressable>
        </View>
      </ScrollView>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <Pressable onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>
            <ScrollView style={styles.notificationList}>
              <Text style={styles.notificationText}>All notifications will be here</Text>
              <View style={styles.notificationItem}>
                <Ionicons name="information-circle" size={20} color="#4CAF50" />
                <Text style={styles.notificationItemText}>Welcome to Krishi Mitra!</Text>
              </View>
              <View style={styles.notificationItem}>
                <Ionicons name="leaf" size={20} color="#4CAF50" />
                <Text style={styles.notificationItemText}>Your farm analysis is ready</Text>
              </View>
              <View style={styles.notificationItem}>
                <Ionicons name="trending-up" size={20} color="#4CAF50" />
                <Text style={styles.notificationItemText}>Market prices updated</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal
        visible={showProfile}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profile</Text>
              <Pressable onPress={() => setShowProfile(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>
            
            <View style={styles.profileInfo}>
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={styles.profileModalImage} />
              ) : (
                <View style={styles.profileModalImageFallback}>
                  <Ionicons name="person" size={40} color="#fff" />
                </View>
              )}
              <Text style={styles.profileName}>{user?.fullName || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.primaryEmailAddress?.emailAddress}</Text>
            </View>

            <View style={styles.profileOptions}>
              <Pressable style={styles.profileOption}>
                <Ionicons name="time" size={20} color="#4CAF50" />
                <Text style={styles.profileOptionText}>History</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </Pressable>
              
              <Pressable style={styles.profileOption}>
                <Ionicons name="settings" size={20} color="#4CAF50" />
                <Text style={styles.profileOptionText}>Settings</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </Pressable>
              
              <Pressable style={styles.profileOption} onPress={handleLogout}>
                <Ionicons name="log-out" size={20} color="#f44336" />
                <Text style={[styles.profileOptionText, { color: '#f44336' }]}>Logout</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2d3748',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
    backgroundColor: '#2d3748',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2d3748'
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    padding: 0,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  profileImageFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#2d3748',
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    minHeight: 120,
    justifyContent: 'center',
  },
  welcomeBackgroundImage: {
    borderRadius: 0,
    opacity: 0.8,
  },
  // welcomeOverlay: {
  //   backgroundColor: 'rgba(0, 0, 0, 0.4)',
  //   paddingHorizontal: 20,
  //   paddingVertical: 20,
  //   borderRadius: 12,
  // },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
    marginTop: 20,
  },
  weatherCard: {
    flex: 1,
    backgroundColor: '#4a5568',
    borderRadius: 12,
    padding: 16,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#718096',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  weatherContent: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#4a5568',
  },
  weatherIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#4a5568',
  },
  cloudIcon: {
    marginLeft: -10,
    marginTop: 5,
  },
  weatherLocation: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  weatherDesc: {
    color: '#a0aec0',
    fontSize: 14,
  },
  weatherNotification: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  marketCard: {
    flex: 1,
    backgroundColor: '#4a5568',
    borderRadius: 12,
    padding: 16,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#718096',
  },
  marketContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marketCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  marketPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  marketChart: {
    flex: 1,
    alignItems: 'center',
  },
  marketInfo: {
    alignItems: 'flex-end',
  },
  marketCrop: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  marketPrice: {
    color: '#a0aec0',
    fontSize: 12,
    marginTop: 4,
  },
  farmCard: {
    flex: 1,
    backgroundColor: '#4a5568',
    borderRadius: 12,
    padding: 16,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#718096',
    position: 'relative',
  },
  farmHealth: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  farmHealthStatus: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  farmCrop: {
    color: '#a0aec0',
    fontSize: 12,
  },
  farmPlantIcon: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  pricesCard: {
    flex: 1,
    backgroundColor: '#4a5568',
    borderRadius: 12,
    padding: 16,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#718096',
  },
  priceContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  priceItem: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  priceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceChange: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  analyzeButton: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 60,
    marginVertical: 30,
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#742a2a',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#feb2b2',
    textAlign: 'center',
    fontSize: 14,
  },
  recommendationCard: {
    backgroundColor: '#e2e8f0',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  recommendationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
    textAlign: 'center',
  },
  recommendationContent: {
    gap: 16,
  },
  recommendationItem: {
    gap: 8,
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    textTransform: 'uppercase',
  },
  recommendationValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  recommendationAdvice: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
  recommendationText: {
    fontSize: 14,
    color: '#4a5568',
  },
  environmentalData: {
    gap: 8,
  },
  dataItem: {
    fontSize: 12,
    color: '#718096',
    lineHeight: 18,
  },
  chatButtonContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
  },
  chatButton: {
    backgroundColor: '#4CAF50',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notificationModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  profileModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  // Notification styles
  notificationList: {
    maxHeight: 300,
  },
  notificationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  notificationItemText: {
    fontSize: 14,
    color: '#2d3748',
    flex: 1,
  },
  // Profile styles
  profileInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileModalImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileModalImageFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  profileOptions: {
    gap: 8,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    gap: 12,
  },
  profileOptionText: {
    fontSize: 16,
    color: '#2d3748',
    flex: 1,
  },
});
