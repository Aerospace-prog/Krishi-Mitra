import { Stack, useRouter } from 'expo-router';
import { Image, StyleSheet, Pressable, ImageBackground } from 'react-native';
import { Text, View } from '@/components/Themed';
import LanguageSelector, { Language } from '@/components/LanguageSelector';
import AuthModal from '@/components/AuthModal';
import { getTranslation } from '@/utils/translations';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';

export default function LandingScreen() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>({ 
    code: 'en', 
    name: 'English', 
    nativeName: 'English' 
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Redirect authenticated users directly to home
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/(tabs)/home');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading while checking authentication status
  if (!isLoaded) {
    return (
      <View style={[styles.backgroundImage, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  // If user is signed in, they'll be redirected by useEffect
  // This return statement is for when user is not signed in
  return (
    <ImageBackground 
      source={require('../../assets/images/bg2.jpg')} 
      style={styles.backgroundImage}
      resizeMode="contain"
      imageStyle={styles.backgroundImageStyle}
    >
      <View style={styles.overlay}>
        <Stack.Screen options={{ headerShown: false }} />
        
        {/* Language Selector */}
        <View style={styles.languageSelectorContainer}>
          <LanguageSelector 
            selectedLanguage={selectedLanguage}
            onLanguageSelect={setSelectedLanguage}
          />
        </View>

        
        <Text style={styles.title}>
          {getTranslation(selectedLanguage.code, 'welcome')}
        </Text>
        <Text style={styles.subtitle}>
          {getTranslation(selectedLanguage.code, 'subtitle')}
        </Text>
        <Pressable 
          style={styles.button} 
          onPress={() => {
            if (isSignedIn) {
              router.replace('/(tabs)/home');
            } else {
              setShowAuthModal(true);
            }
          }}
        >
          <Text style={styles.buttonText}>
            {getTranslation(selectedLanguage.code, 'getStarted')}
          </Text>
        </Pressable>
      </View>
      
      <AuthModal 
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImageStyle: {
    opacity: 0.8,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Lighter overlay for mobile
    width: '100%',
  },
  languageSelectorContainer: {
    position: 'absolute',
    top: 70,
    right: 20,
    zIndex: 10,
  },
  logo: { 
    width: 120, 
    height: 120, 
    marginBottom: 20,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    textAlign: 'center',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: { 
    fontSize: 18, 
    opacity: 0.9, 
    textAlign: 'center', 
    marginTop: 12, 
    marginBottom: 32,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  button: { 
    backgroundColor: '#2e7d32', 
    paddingHorizontal: 32, 
    paddingVertical: 16, 
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 18,
  },
});
