import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, ScrollView, Pressable, Alert, Image, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function ScanScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to scan plants.');
      return false;
    }
    return true;
  };

  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library permission is required to select images.');
      return false;
    }
    return true;
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openImagePicker = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const analyzeImage = async (imageUri: string) => {
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      setIsAnalyzing(false);
      Alert.alert(
        'Analysis Complete!',
        'Plant analysis feature is coming soon. Your image has been processed successfully.',
        [{ text: 'OK' }]
      );
    }, 3000);
  };

  const showImageSourceOptions = () => {
    Alert.alert(
      'Select Image Source',
      'Choose how you want to capture or select your plant image',
      [
        {
          text: 'Camera',
          onPress: openCamera,
          style: 'default',
        },
        {
          text: 'Photo Library',
          onPress: openImagePicker,
          style: 'default',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Plant Scanner</Text>
        <Ionicons name="scan" size={24} color="#4CAF50" />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Scan Action Section */}
        <View style={styles.scanActionContainer}>
          {selectedImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              {isAnalyzing && (
                <View style={styles.analyzingOverlay}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.analyzingText}>Analyzing...</Text>
                </View>
              )}
            </View>
          ) : (
            <Pressable style={styles.scanButton} onPress={showImageSourceOptions}>
              <View style={styles.scanIconContainer}>
                <Ionicons name="scan-outline" size={60} color="#4CAF50" />
              </View>
              <Text style={styles.scanButtonTitle}>Scan Your Plant</Text>
              <Text style={styles.scanButtonSubtitle}>
                Take a photo or upload from gallery to analyze plant health
              </Text>
            </Pressable>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <Pressable style={styles.actionButton} onPress={openCamera}>
            <Ionicons name="camera" size={24} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </Pressable>
          
          <Pressable style={styles.actionButton} onPress={openImagePicker}>
            <Ionicons name="images" size={24} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Upload Image</Text>
          </Pressable>
        </View>

        {selectedImage && (
          <View style={styles.newScanContainer}>
            <Pressable style={styles.newScanButton} onPress={() => setSelectedImage(null)}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.newScanButtonText}>Scan Another Plant</Text>
            </Pressable>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoDescription}>
            Our AI-powered plant scanner can detect diseases, pests, and nutrient deficiencies. 
            Simply take a clear photo of your plant's leaves or affected areas for analysis.
          </Text>
          
          {/* Features List */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Disease Detection</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Pest Identification</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Nutrient Analysis</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Treatment Recommendations</Text>
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
    paddingHorizontal: 20,
  },
  scanActionContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    // backgroundColor: '#4a5568',
    backgroundColor: '#a0d9b4',
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    // backgroundColor: '#4a5568',
  },
  selectedImage: {
    width: 300,
    // backgroundColor: '#4a5568',
    height: 300,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  analyzingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scanButton: {
    // backgroundColor: '#ffffff',
    backgroundColor: '#a0d9b4',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    width: '100%',
  },
  scanIconContainer: {
    marginBottom: 16,
    borderRadius:16,
    backgroundColor: '#a0d9b4',
  },
  scanButtonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 8,
  },
  scanButtonSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    // backgroundColor: '#4a5568',
    backgroundColor: '#a0d9b4',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  newScanContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  newScanButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  newScanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    // backgroundColor: '#ffffff',
    backgroundColor: '#a0d9b4',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 12,
  },
  infoDescription: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 20,
    // backgroundColor: '#a0d9b4',
  },
  featuresList: {
    width: '100%',
    gap: 16,
    backgroundColor: '#a0d9b4',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#ffffff',
    
    padding: 16,
    backgroundColor: '#a0d9b4',
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
});
