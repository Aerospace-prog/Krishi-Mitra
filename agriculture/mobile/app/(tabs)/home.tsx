import { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, SafeAreaView, Modal, Image, Alert, ImageBackground, Animated, TouchableOpacity } from 'react-native';
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

type HistoryItem = {
  id: string;
  date: string;
  time: string;
  crop_recommendation: string;
  advice: string;
  location: string;
  weather: string;
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
  const [showHistory, setShowHistory] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<HistoryItem[]>([]);
  
  // Handle chat button press
  const handleChatPress = () => {
    Alert.alert('Chat', 'Chat feature coming soon!');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/(auth)');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const saveToHistory = (recommendation: RecommendationResponse) => {
    const now = new Date();
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      crop_recommendation: recommendation.crop_recommendation,
      advice: recommendation.advice,
      location: recommendation.location_info?.state || 'Unknown',
      weather: 'Mostly sunny, 28°C' // You can make this dynamic based on actual weather data
    };
    
    setAnalysisHistory(prev => [historyItem, ...prev]);
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
      // Save to history
      saveToHistory(data);
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

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
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

        {/* Weather Card - Full Width */}
        <View style={styles.fullWidthCardContainer}>
          <View style={styles.weatherCardFull}>
            <Text style={styles.cardTitle}>Weather</Text>
            <View style={styles.weatherContentFull}>
              <View style={styles.weatherLeftSection}>
                <View style={styles.weatherIcon}>
                  <Ionicons name="sunny" size={40} color="#FFD700" />
                  <Ionicons name="cloud" size={24} color="#fff" style={styles.cloudIcon} />
                </View>
                <View style={styles.weatherInfo}>
                  <Text style={styles.weatherLocation}>Bengaluru, 28°</Text>
                  <Text style={styles.weatherDesc}>Mostly sunny</Text>
                </View>
              </View>
              <View style={styles.weatherRightSection}>
                <Ionicons name="notifications-outline" size={20} color="#4CAF50" />
                <Text style={styles.weatherDetails}>Humidity: 65%</Text>
                <Text style={styles.weatherDetails}>Wind: 12 km/h</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Market Prices Card - Full Width */}
        <View style={styles.fullWidthCardContainer}>
          <View style={styles.pricesCardFull}>
            <Text style={styles.cardTitle}>Quick Market Prices</Text>
            <View style={styles.priceContentFull}>
              <View style={styles.priceRow}>
                <View style={styles.priceItemContainer}>
                  <Text style={styles.priceItemName}>Potato</Text>
                  <Text style={styles.priceItemValue}>₹15/kg</Text>
                </View>
                <View style={styles.priceIndicator}>
                  <Ionicons name="arrow-up" size={20} color="#4CAF50" />
                  <Text style={styles.priceChange}>5%</Text>
                </View>
              </View>
              <View style={styles.priceRow}>
                <View style={styles.priceItemContainer}>
                  <Text style={styles.priceItemName}>Tomato</Text>
                  <Text style={styles.priceItemValue}>₹38/kg</Text>
                </View>
                <View style={styles.priceIndicator}>
                  <Ionicons name="arrow-up" size={20} color="#4CAF50" />
                  <Text style={styles.priceChange}>8%</Text>
                </View>
              </View>
              <View style={styles.priceRow}>
                <View style={styles.priceItemContainer}>
                  <Text style={styles.priceItemName}>Rice</Text>
                  <Text style={styles.priceItemValue}>₹45/kg</Text>
                </View>
                <View style={styles.priceIndicator}>
                  <Ionicons name="arrow-down" size={20} color="#f44336" />
                  <Text style={[styles.priceChange, { color: '#f44336' }]}>2%</Text>
                </View>
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
        {recommendation && (
          <View style={styles.recommendationContainer}>
            <Text style={styles.recommendationTitle}>🌾 Farm Analysis Results</Text>
            
            <View style={styles.recommendationCard}>
              <View style={styles.recommendationItem}>
                <View style={styles.recommendationHeader}>
                  <Ionicons name="leaf" size={20} color="#4CAF50" />
                  <Text style={styles.recommendationLabel}>Recommended Crop</Text>
                </View>
                <Text style={styles.recommendationValue}>{recommendation.crop_recommendation}</Text>
              </View>
            </View>
            
            <View style={styles.recommendationCard}>
              <View style={styles.recommendationItem}>
                <View style={styles.recommendationHeader}>
                  <Ionicons name="bulb" size={20} color="#4CAF50" />
                  <Text style={styles.recommendationLabel}>AI Advice</Text>
                </View>
                <Text style={styles.recommendationAdvice}>{recommendation.advice}</Text>
              </View>
            </View>
            
            <View style={styles.recommendationCard}>
              <View style={styles.recommendationItem}>
                <View style={styles.recommendationHeader}>
                  <Ionicons name="location" size={20} color="#4CAF50" />
                  <Text style={styles.recommendationLabel}>Location</Text>
                </View>
                <Text style={styles.recommendationText}>{recommendation.location_info?.state || 'Unknown'}</Text>
              </View>
            </View>
            
            <View style={styles.recommendationCard}>
              <View style={styles.recommendationItem}>
                <View style={styles.recommendationHeader}>
                  <Ionicons name="analytics" size={20} color="#4CAF50" />
                  <Text style={styles.recommendationLabel}>Environmental Data</Text>
                </View>
                <View style={styles.environmentalData}>
                  <View style={styles.dataRow}>
                    <Ionicons name="thermometer" size={16} color="#FF6B6B" />
                    <Text style={styles.dataItem}>Temperature: {String(recommendation.live_data_used?.temperature)}°C</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Ionicons name="water" size={16} color="#4ECDC4" />
                    <Text style={styles.dataItem}>Humidity: {String(recommendation.live_data_used?.humidity)}%</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Ionicons name="flask" size={16} color="#45B7D1" />
                    <Text style={styles.dataItem}>pH: {String(recommendation.live_data_used?.ph)}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Ionicons name="nutrition" size={16} color="#96CEB4" />
                    <Text style={styles.dataItem}>Nitrogen: {String(recommendation.live_data_used?.N)} kg/ha</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Ionicons name="rainy" size={16} color="#74B9FF" />
                    <Text style={styles.dataItem}>Rainfall: {String(recommendation.live_data_used?.rainfall_mm_monthly_avg)} mm/month</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Floating Chat Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleChatPress}>
        <Ionicons name="chatbubbles" size={24} color="white" />
      </TouchableOpacity>

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <Pressable onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={24} color="#fff" />
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
                <Ionicons name="close" size={24} color="#fff" />
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
              <Pressable 
                style={styles.profileOption}
                onPress={() => {
                  setShowProfile(false);
                  setShowHistory(true);
                }}
              >
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

      {/* History Modal */}
      <Modal
        visible={showHistory}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.historyModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Farm Analysis History</Text>
              <Pressable onPress={() => setShowHistory(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>
            
            <ScrollView style={styles.historyList}>
              {analysisHistory.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Ionicons name="time-outline" size={48} color="#666" />
                  <Text style={styles.emptyHistoryText}>No analysis history yet</Text>
                  <Text style={styles.emptyHistorySubtext}>
                    Use "Analyze My Farm" to get crop recommendations and they'll appear here
                  </Text>
                </View>
              ) : (
                analysisHistory.map((item) => (
                  <View key={item.id} style={styles.historyItem}>
                    <View style={styles.historyHeader}>
                      <View style={styles.historyDateContainer}>
                        <Ionicons name="calendar" size={16} color="#4CAF50" />
                        <Text style={styles.historyDate}>{item.date}</Text>
                        <Text style={styles.historyTime}>{item.time}</Text>
                      </View>
                      <View style={styles.historyLocationContainer}>
                        <Ionicons name="location" size={16} color="#4CAF50" />
                        <Text style={styles.historyLocation}>{item.location}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.historyContent}>
                      <View style={styles.historyCropContainer}>
                        <Text style={styles.historyLabel}>Recommended Crop:</Text>
                        <Text style={styles.historyCrop}>{item.crop_recommendation}</Text>
                      </View>
                      
                      <View style={styles.historyAdviceContainer}>
                        <Text style={styles.historyLabel}>AI Advice:</Text>
                        <Text style={styles.historyAdvice}>{item.advice}</Text>
                      </View>
                      
                      <View style={styles.historyWeatherContainer}>
                        <Ionicons name="partly-sunny" size={16} color="#FFD700" />
                        <Text style={styles.historyWeather}>{item.weather}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
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
    backgroundColor: 'transparent',
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
  fullWidthCardContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    // backgroundColor: '#fefcbf',
    backgroundColor: '#2d3748',
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
    color: '#ffffff',
    marginBottom: 12,
  },
  weatherContent: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  weatherIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  cloudIcon: {
    marginLeft: -10,
    marginTop: 5,
  },
  weatherLocation: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  weatherDesc: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
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
    backgroundColor: 'transparent',
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
  recommendationContainer: {
    marginHorizontal: 20,
    backgroundColor: '#4a5568',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  recommendationCard: {
    backgroundColor: '#4a5568',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#718096',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  recommendationContent: {
    gap: 16,
    // backgroundColor: '#4a5568',
  },
  recommendationItem: {
    gap: 12,
    backgroundColor: '#4a5568',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    backgroundColor: '#4a5568',
  },
  recommendationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendationValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
  },
  recommendationAdvice: {
    fontSize: 15,
    color: '#e2e8f0',
    lineHeight: 22,
    marginTop: 4,
  },
  recommendationText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    marginTop: 4,
  },
  environmentalData: {
    gap: 12,
    marginTop: 8,
    backgroundColor: '#4a5568',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2d3748',
    borderRadius: 8,
  },
  dataItem: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
    flex: 1,
  },
  floatingButton: {
    backgroundColor: '#4CAF50',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    right: 30,
    elevation: 5, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    backgroundColor: '#4a5568',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  profileModal: {
    backgroundColor: '#4a5568',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    backgroundColor: '#4a5568',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#a0d9b4',
    // backgroundColor:"#fff"
  },
  // Notification styles
  notificationList: {
    maxHeight: 300,
  },
  notificationText: {
    fontSize: 16,
    color: '#000',
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
    // backgroundColor: '#4a5568',
    padding: 20,
    borderRadius: 12,
  },
  profileModalImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    // backgroundColor: '#fff',
    
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
    color: '#a0d9b4',
    marginBottom: 4,
    
  },
  profileEmail: {
    fontSize: 14,
    color: '#a0d9b4',
  },
  profileOptions: {
    backgroundColor: '#4a5568',
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
  // Full width card styles
  weatherCardFull: {
    backgroundColor: '#4a5568',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#718096',
  },
  weatherContentFull: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'transparent',
  },
  weatherLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'transparent',
  },
  weatherInfo: {
    marginLeft: 16,
    backgroundColor: 'transparent',
  },
  weatherRightSection: {
    alignItems: 'flex-end',
    gap: 4,
    backgroundColor: 'transparent',
  },
  weatherDetails: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '500',
  },
  pricesCardFull: {
    backgroundColor: '#4a5568',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#718096',
  },
  priceContentFull: {
    marginTop: 12,
    gap: 12,
    backgroundColor: 'transparent',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2d3748',
    borderRadius: 8,
  },
  priceItemContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  priceItemName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  priceItemValue: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  // History modal styles
  historyModal: {
    backgroundColor: '#4a5568',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  historyList: {
    
    flex: 1,
    paddingTop: 8,
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    
    paddingHorizontal: 20,
  },
  emptyHistoryText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyHistorySubtext: {
    fontSize: 16,
    color: '#a0d9b4',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  historyItem: {
    // backgroundColor: '#2d3748',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#718096',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#4a5568',
  },
  historyDateContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  historyDate: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '700',
  },
  historyTime: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  historyLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4a5568',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  historyLocation: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  historyContent: {
    gap: 16,
  },
  historyCropContainer: {
    backgroundColor: '#4a5568',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  historyLabel: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyCrop: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  historyAdviceContainer: {
    backgroundColor: '#4a5568',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#74B9FF',
  },
  historyAdvice: {
    fontSize: 15,
    color: '#e2e8f0',
    lineHeight: 22,
  },
  historyWeatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#4a5568',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  historyWeather: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '500',
  },
});

