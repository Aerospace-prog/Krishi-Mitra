import { Language } from '../components/LanguageSelector';

export interface Translations {
  welcome: string;
  subtitle: string;
  getStarted: string;
}

export const translations: Record<string, Translations> = {
  en: {
    welcome: 'Welcome to Krishi Mitra',
    subtitle: 'Smart crop guidance at your fingertips',
    getStarted: 'Get Started',
  },
  hi: {
    welcome: 'कृषि मित्र में आपका स्वागत है',
    subtitle: 'आपकी उंगलियों पर स्मार्ट फसल मार्गदर्शन',
    getStarted: 'शुरू करें',
  },
  bn: {
    welcome: 'কৃষি মিত্রে স্বাগতম',
    subtitle: 'আপনার আঙুলের ডগায় স্মার্ট ফসলের নির্দেশনা',
    getStarted: 'শুরু করুন',
  },
  te: {
    welcome: 'కృషి మిత్రకు స్వాగతం',
    subtitle: 'మీ వేళ్ల చిట్కాలలో స్మార్ట్ పంట మార్గదర్శకత్వం',
    getStarted: 'ప్రారంభించండి',
  },
  mr: {
    welcome: 'कृषी मित्रामध्ये आपले स्वागत आहे',
    subtitle: 'तुमच्या बोटांवर स्मार्ट पिक मार्गदर्शन',
    getStarted: 'सुरु करा',
  },
  ta: {
    welcome: 'கிரிஷி மித்ராவுக்கு வரவேற்கிறோம்',
    subtitle: 'உங்கள் விரல்களில் ஸ்மார்ட் பயிர் வழிகாட்டுதல்',
    getStarted: 'தொடங்குங்கள்',
  },
  gu: {
    welcome: 'કૃષિ મિત્રમાં આપનું સ્વાગત છે',
    subtitle: 'તમારી આંગળીઓ પર સ્માર્ટ પાક માર્ગદર્શન',
    getStarted: 'શરૂ કરો',
  },
  kn: {
    welcome: 'ಕೃಷಿ ಮಿತ್ರಕ್ಕೆ ಸ್ವಾಗತ',
    subtitle: 'ನಿಮ್ಮ ಬೆರಳುಗಳಲ್ಲಿ ಸ್ಮಾರ್ಟ್ ಬೆಳೆ ಮಾರ್ಗದರ್ಶನ',
    getStarted: 'ಪ್ರಾರಂಭಿಸಿ',
  },
  ml: {
    welcome: 'കൃഷി മിത്രയിലേക്ക് സ്വാഗതം',
    subtitle: 'നിങ്ങളുടെ വിരലുകളിൽ സ്മാർട്ട് വിള മാർഗദർശനം',
    getStarted: 'ആരംഭിക്കുക',
  },
  pa: {
    welcome: 'ਕ੍ਰਿਸ਼ੀ ਮਿਤਰ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ',
    subtitle: 'ਤੁਹਾਡੀਆਂ ਉਂਗਲਾਂ ਤੇ ਸਮਾਰਟ ਫਸਲ ਮਾਰਗਦਰਸ਼ਨ',
    getStarted: 'ਸ਼ੁਰੂ ਕਰੋ',
  },
  or: {
    welcome: 'କୃଷି ମିତ୍ରରେ ଆପଣଙ୍କୁ ସ୍ୱାଗତ',
    subtitle: 'ଆପଣଙ୍କ ଆଙ୍ଗୁଳିରେ ସ୍ମାର୍ଟ ଫସଲ ମାର୍ଗଦର୍ଶନ',
    getStarted: 'ଆରମ୍ଭ କରନ୍ତୁ',
  },
  as: {
    welcome: 'কৃষি মিত্ৰলৈ স্বাগতম',
    subtitle: 'আপোনাৰ আঙুলিত স্মাৰ্ট শস্য পথনিৰ্দেশনা',
    getStarted: 'আৰম্ভ কৰক',
  },
  ur: {
    welcome: 'کرشی متر میں آپ کا خیر مقدم ہے',
    subtitle: 'آپ کی انگلیوں میں اسمارٹ فصل کی رہنمائی',
    getStarted: 'شروع کریں',
  },
  ne: {
    welcome: 'कृषि मित्रमा स्वागत छ',
    subtitle: 'तपाईंको औंलामा स्मार्ट बाली मार्गदर्शन',
    getStarted: 'सुरु गर्नुहोस्',
  },
  si: {
    welcome: 'කෘෂි මිත්‍රයට සාදරයෙන් පිළිගනිමු',
    subtitle: 'ඔබේ ඇඟිලිවල ස්මාර්ට් ධාන්‍ය මගපෙන්වීම',
    getStarted: 'ආරම්භ කරන්න',
  },
  my: {
    welcome: 'ကရှီ မိတ္တသို့ ကြိုဆိုပါတယ်',
    subtitle: 'သင့်လက်ချောင်းများတွင် စမတ်သီးနှံလမ်းညွှန်',
    getStarted: 'စတင်ပါ',
  },
  bo: {
    welcome: 'ཞིང་ལས་གྲོགས་པར་ཕེབས་པར་དགའ་བསུ་ཞུ།',
    subtitle: 'ཁྱེད་ཀྱི་མཛུབ་མོའི་ནང་དུ་ཅིག་ཤེས་ཞིང་ལས་ལམ་སྟོན།',
    getStarted: 'འགོ་བཙུགས།',
  },
  dz: {
    welcome: 'ཞིང་ལས་གྲོགས་པར་ཕེབས་པར་དགའ་བསུ་ཞུ།',
    subtitle: 'ཁྱེད་ཀྱི་མཛུབ་མོའི་ནང་དུ་ཅིག་ཤེས་ཞིང་ལས་ལམ་སྟོན།',
    getStarted: 'འགོ་བཙུགས།',
  },
  ks: {
    welcome: 'کرشی متر وچ خوش آمدید',
    subtitle: 'تہاڈے انگلیاں وچ اسمارٹ فصل دی رہنمائی',
    getStarted: 'شروع کرو',
  },
  sd: {
    welcome: 'ڪرشي متر ۾ خوش آمديد',
    subtitle: 'توهان جي انگلين ۾ اسمارٽ فصل جي رهنمائي',
    getStarted: 'شروع ڪريو',
  },
  sa: {
    welcome: 'कृषि मित्रे स्वागतम्',
    subtitle: 'तवाङ्गुलिषु स्मार्ट शस्य मार्गदर्शनम्',
    getStarted: 'आरभ्यताम्',
  },
  bh: {
    welcome: 'कृषि मित्र में आपका स्वागत बा',
    subtitle: 'आपके उंगलियों में स्मार्ट फसल मार्गदर्शन',
    getStarted: 'शुरू करीं',
  },
  mag: {
    welcome: 'कृषि मित्र में आपका स्वागत बा',
    subtitle: 'आपके उंगलियों में स्मार्ट फसल मार्गदर्शन',
    getStarted: 'शुरू करीं',
  },
  mai: {
    welcome: 'कृषि मित्र में आपका स्वागत अछि',
    subtitle: 'आपके उंगलियों में स्मार्ट फसल मार्गदर्शन',
    getStarted: 'शुरू करीं',
  },
  raj: {
    welcome: 'कृषि मित्र में आपका स्वागत है',
    subtitle: 'आपके उंगलियों में स्मार्ट फसल मार्गदर्शन',
    getStarted: 'शुरू करो',
  },
  gom: {
    welcome: 'कृषि मित्रांत आपका स्वागत',
    subtitle: 'आपल्या बोटांत स्मार्ट पिक मार्गदर्शन',
    getStarted: 'सुरू करात',
  },
  mni: {
    welcome: 'কৃষি মিত্রদা স্বাগতম',
    subtitle: 'নুংগীদা স্মার্ট ফসলগী লমদং',
    getStarted: 'লৌরক',
  },
  lus: {
    welcome: 'Krishi Mitra-ah hlawmna a ni',
    subtitle: 'I kutah smart crop hriatna',
    getStarted: 'Tih tan',
  },
  njo: {
    welcome: 'Krishi Mitra-ah welcome',
    subtitle: 'Nungda smart crop guidance',
    getStarted: 'Tih tan',
  },
  nst: {
    welcome: 'Krishi Mitra-ah welcome',
    subtitle: 'Nungda smart crop guidance',
    getStarted: 'Tih tan',
  },
};

export function getTranslation(languageCode: string, key: keyof Translations): string {
  return translations[languageCode]?.[key] || translations.en[key];
}
