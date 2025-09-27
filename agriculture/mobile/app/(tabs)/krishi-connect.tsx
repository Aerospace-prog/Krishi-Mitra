import React from 'react';
import { StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';

export default function KrishiConnectScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Krishi Connect</Text>
        <Ionicons name="people" size={24} color="#4CAF50" />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="people-outline" size={60} color="#4CAF50" />
          </View>
          <Text style={styles.heroTitle}>Connect with Farmers</Text>
          <Text style={styles.heroSubtitle}>
            Join our farming community to share knowledge, get advice, and grow together
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          <Pressable style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="chatbubbles" size={32} color="#4CAF50" />
            </View>
            <Text style={styles.featureTitle}>Community Chat</Text>
            <Text style={styles.featureDescription}>
              Connect with farmers in your area and share experiences
            </Text>
          </Pressable>

          <Pressable style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="school" size={32} color="#4CAF50" />
            </View>
            <Text style={styles.featureTitle}>Expert Advice</Text>
            <Text style={styles.featureDescription}>
              Get guidance from agricultural experts and experienced farmers
            </Text>
          </Pressable>

          <Pressable style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="storefront" size={32} color="#4CAF50" />
            </View>
            <Text style={styles.featureTitle}>Marketplace</Text>
            <Text style={styles.featureDescription}>
              Buy and sell farming equipment, seeds, and produce
            </Text>
          </Pressable>

          <Pressable style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="library" size={32} color="#4CAF50" />
            </View>
            <Text style={styles.featureTitle}>Knowledge Base</Text>
            <Text style={styles.featureDescription}>
              Access farming guides, tutorials, and best practices
            </Text>
          </Pressable>
        </View>

        {/* Coming Soon Banner */}
        <View style={styles.comingSoonBanner}>
          <Ionicons name="time" size={24} color="#FF9500" />
          <Text style={styles.comingSoonText}>Coming Soon!</Text>
          <Text style={styles.comingSoonSubtext}>
            We're building an amazing community platform for farmers
          </Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Join Our Growing Community</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Farmers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Experts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>50+</Text>
              <Text style={styles.statLabel}>Districts</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  heroIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0fff4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a202c',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresGrid: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 20,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0fff4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  comingSoonBanner: {
    backgroundColor: '#fff7ed',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 20,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ea580c',
    marginTop: 8,
    marginBottom: 4,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#9a3412',
    textAlign: 'center',
  },
  statsSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
  },
});
