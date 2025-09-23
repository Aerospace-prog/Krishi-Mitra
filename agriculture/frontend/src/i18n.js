import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      title: "HARVEST JOURNEY",
      subtitle: "Grow Your Own Green Future",
      getStarted: "Get Started",
      skip: "Skip"
    }
  },
  hi: {
    translation: {
      title: "हार्वेस्ट जर्नी",
      subtitle: "अपना खुद का हरा भविष्य बढ़ाएं",
      getStarted: "शुरू करें",
      skip: "छोड़ें"
    }
  },
  ta: {
    translation: {
      title: "ஹார்வெஸ்ட் ஜர்னி",
      subtitle: "உங்கள் செழிப்பான எதிர்காலத்தை உருவாக்குங்கள்",
      getStarted: "தொடங்குக",
      skip: "தவிர்க்குக"
    }
  },
  te: {
    translation: {
      title: "హార్వెస్ట్ జర్నీ",
      subtitle: "మీ స్వంత హరిత భవిష్యత్తును పెంచుకోండి",
      getStarted: "ప్రారంభించండి",
      skip: "దాటవేయండి"
    }
  },
  kn: {
    translation: {
      title: "ಹಾರ್ವೆಸ್ಟ್ ಜರ್ನಿ",
      subtitle: "ನಿಮ್ಮ ಹಸಿರು ಭವಿಷ್ಯವನ್ನು ಬೆಳೆಸಿಕೊಳ್ಳಿ",
      getStarted: "ಪ್ರಾರಂಭಿಸಿ",
      skip: "ಬಿಟ್ಟಿ"
    }
  },
  ml: {
    translation: {
      title: "ഹാർവസ്റ്റ് ജേർണി",
      subtitle: "നിങ്ങളുടെ സ്വപ്നങ്ങൾ സഫലമാക്കൂ",
      getStarted: "ആരംഭിക്കുക",
      skip: "കടത്തി വയ്ക്കുക"
    }
  },
  mr: {
    translation: {
      title: "हार्वेस्ट जर्नी",
      subtitle: "तुमचा हिरवा भविष्य वाढवा",
      getStarted: "सुरू करा",
      skip: "वजा करा"
    }
  },
  gu: {
    translation: {
      title: "હાર્વેસ્ટ જર્ની",
      subtitle: "તમારું હરિત ભવિષ્ય વધારવું",
      getStarted: "પ્રારંભ કરો",
      skip: "રદ કરો"
    }
  },
  pa: {
    translation: {
      title: "ਹਾਰਵੇਸਟ ਜਰਨੀ",
      subtitle: "ਆਪਣਾ ਹਰਾ ਭਵਿੱਖ ਬਣਾਓ",
      getStarted: "ਸ਼ੁਰੂ ਕਰੋ",
      skip: "ਛੱਡੋ"
    }
  },
  bn: {
    translation: {
      title: "হার্ভেস্ট জার্নি",
      subtitle: "আপনার নিজের সবুজ ভবিষ্যৎ গড়ুন",
      getStarted: "শুরু করুন",
      skip: "বাতিল করুন"
    }
  },
  or: {
    translation: {
      title: "ହାର୍ଭେଷ୍ଟ ଜର୍ଣୀ",
      subtitle: "ଆପଣଙ୍କର ସବୁଜ ଭବିଷ୍ୟତ ଗଢନ୍ତୁ",
      getStarted: "ଆରମ୍ଭ କରନ୍ତୁ",
      skip: "ବାତିଲ କରନ୍ତୁ"
    }
  },
  as: {
    translation: {
      title: "হাৰ্ভেষ্ট যাত্ৰা",
      subtitle: "নিজৰ সেউজীয়া ভৱিষ্যত গঢ়াওক",
      getStarted: "আৰম্ভ কৰক",
      skip: "বাতিল কৰক"
    }
  },
  ur: {
    translation: {
      title: "ہارویسٹ جرنی",
      subtitle: "اپنا سبز مستقبل بنائیں",
      getStarted: "شروع کریں",
      skip: "منسوخ کریں"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('lang') || 'hi',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
