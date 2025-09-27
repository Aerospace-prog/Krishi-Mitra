import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ' },
  { code: 'bo', name: 'Tibetan', nativeName: 'བོད་ཡིག' },
  { code: 'dz', name: 'Dzongkha', nativeName: 'རྫོང་ཁ' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'कॉशुर' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्' },
  { code: 'bh', name: 'Bhojpuri', nativeName: 'भोजपुरी' },
  { code: 'mag', name: 'Magahi', nativeName: 'मगही' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली' },
  { code: 'raj', name: 'Rajasthani', nativeName: 'राजस्थानी' },
  { code: 'gom', name: 'Konkani', nativeName: 'कोंकणी' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্' },
  { code: 'lus', name: 'Mizo', nativeName: 'Mizo' },
  { code: 'njo', name: 'Ao', nativeName: 'Ao' },
  { code: 'nst', name: 'Naga', nativeName: 'Naga' },
];

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onLanguageSelect: (language: Language) => void;
}

export default function LanguageSelector({ selectedLanguage, onLanguageSelect }: LanguageSelectorProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <>
      <Pressable 
        style={styles.selectorButton} 
        onPress={() => setIsModalVisible(true)}
      >
        <Ionicons name="globe-outline" size={20} color="#fff" />
        <Text style={styles.selectorText}>
          {selectedLanguage.nativeName}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#fff" />
      </Pressable>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <ScrollView 
              style={styles.scrollView}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              {languages.map((language) => (
                <Pressable
                  key={language.code}
                  style={[
                    styles.languageOption,
                    selectedLanguage.code === language.code && styles.selectedLanguage
                  ]}
                  onPress={() => {
                    onLanguageSelect(language);
                    setIsModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.languageText,
                    selectedLanguage.code === language.code && styles.selectedLanguageText
                  ]}>
                    {language.nativeName}
                  </Text>
                  <Text style={[
                    styles.languageSubtext,
                    selectedLanguage.code === language.code && styles.selectedLanguageSubtext
                  ]}>
                    {language.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#4caf50',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  selectorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    minHeight: '60%',
  },
  scrollView: {
    maxHeight: '70%',
    paddingRight: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2e7d32',
  },
  languageOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  selectedLanguage: {
    backgroundColor: '#2e7d32',
  },
  languageText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedLanguageText: {
    color: '#fff',
  },
  languageSubtext: {
    fontSize: 14,
    color: '#666',
  },
  selectedLanguageSubtext: {
    color: '#e8f5e8',
  },
});
