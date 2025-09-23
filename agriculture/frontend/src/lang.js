import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      title: "Krishi Mitra",
      subtitle: "Grow Your Own Green Future",
      getStarted: "Get Started",
      skip: "Skip"
    }
  },
  hi: {
    translation: {
      title: "कृषि मित्र",
      subtitle: "अपना खुद का हरा भविष्य बढ़ाएं",
      getStarted: "शुरू करें",
      skip: "छोड़ें"
    }
  },
  ta: {
    translation: {
      title: "கிருஷி மித்ரா",
      subtitle: "உங்கள் செழிப்பான எதிர்காலத்தை உருவாக்குங்கள்",
      getStarted: "தொடங்குக",
      skip: "தவிர்க்குக"
    }
  },
  te: {
    translation: {
      title: "కృషి మిత్ర",
      subtitle: "మీ స్వంత హరిత భవిష్యత్తును పెంచుకోండి",
      getStarted: "ప్రారంభించండి",
      skip: "దాటవేయండి"
    }
  },
  kn: {
    translation: {
      title: "ಕೃಷಿ ಮಿತ್ರ",
      subtitle: "ನಿಮ್ಮ ಹಸಿರು ಭವಿಷ್ಯವನ್ನು ಬೆಳೆಸಿಕೊಳ್ಳಿ",
      getStarted: "ಪ್ರಾರಂಭಿಸಿ",
      skip: "ಬಿಟ್ಟಿ"
    }
  },
  ml: {
    translation: {
      title: "കൃഷി മിത്ര",
      subtitle: "നിങ്ങളുടെ സ്വപ്നങ്ങൾ സഫലമാക്കൂ",
      getStarted: "ആരംഭിക്കുക",
      skip: "കടത്തി വയ്ക്കുക"
    }
  },
  mr: {
    translation: {
      title: "कृषी मित्र",
      subtitle: "तुमचा हिरवा भविष्य वाढवा",
      getStarted: "सुरू करा",
      skip: "वजा करा"
    }
  },
  gu: {
    translation: {
      title: "કૃષિ મિત્ર",
      subtitle: "તમારું હરિત ભવિષ્ય વધારવું",
      getStarted: "પ્રારંભ કરો",
      skip: "રદ કરો"
    }
  },
  pa: {
    translation: {
      title: "ਕ੍ਰਿਸ਼ੀ ਮਿੱਤਰ",
      subtitle: "ਆਪਣਾ ਹਰਾ ਭਵਿੱਖ ਬਣਾਓ",
      getStarted: "ਸ਼ੁਰੂ ਕਰੋ",
      skip: "ਛੱਡੋ"
    }
  },
  bn: {
    translation: {
      title: "কৃষি মিত্র",
      subtitle: "আপনার নিজের সবুজ ভবিষ্যৎ গড়ুন",
      getStarted: "শুরু করুন",
      skip: "বাতিল করুন"
    }
  },
  or: {
    translation: {
      title: "କୃଷି ମିତ୍ର",
      subtitle: "ଆପଣଙ୍କର ସବୁଜ ଭବିଷ୍ୟତ ଗଢନ୍ତୁ",
      getStarted: "ଆରମ୍ଭ କରନ୍ତୁ",
      skip: "ବାତିଲ କରନ୍ତୁ"
    }
  },
  as: {
    translation: {
      title: "কৃষি মিত্ৰ",
      subtitle: "নিজৰ সেউজীয়া ভৱিষ্যত গঢ়াওক",
      getStarted: "আৰম্ভ কৰক",
      skip: "বাতিল কৰক"
    }
  },
  ur: {
    translation: {
      title: "کرشی متر",
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
