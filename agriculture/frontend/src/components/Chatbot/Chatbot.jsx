import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Minimize2, MessageCircle } from 'lucide-react';
import './Chatbot.css';

const Chatbot = ({ onClose, isMinimized, onMinimize }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const messagesEndRef = useRef(null);

  const languages = {
    en: { name: 'English', flag: '🇺🇸' },
    hi: { name: 'हिन्दी', flag: '🇮🇳' },
    te: { name: 'తెలుగు', flag: '🇮🇳' },
    ta: { name: 'தமிழ்', flag: '🇮🇳' },
    bn: { name: 'বাংলা', flag: '🇮🇳' },
    mr: { name: 'मराठी', flag: '🇮🇳' },
    gu: { name: 'ગુજરાતી', flag: '🇮🇳' },
    kn: { name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    ml: { name: 'മലയാളം', flag: '🇮🇳' },
    pa: { name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' }
  };

  const translations = {
    en: {
      welcome: "Hello! I'm Krishi Mitra, your AI farming assistant. How can I help you today?",
      placeholder: "Ask me anything about farming...",
      send: "Send",
      minimize: "Minimize",
      close: "Close",
      thinking: "Thinking...",
      error: "Sorry, I couldn't process your request. Please try again.",
      examples: "Try asking:",
      exampleQueries: [
        "How to grow tomatoes?",
        "What fertilizer should I use?",
        "How to control pests?",
        "When to harvest wheat?",
        "Weather forecast for my area"
      ]
    },
    hi: {
      welcome: "नमस्ते! मैं कृषि मित्र हूं, आपका AI कृषि सहायक। आज मैं आपकी कैसे मदद कर सकता हूं?",
      placeholder: "कृषि के बारे में कुछ भी पूछें...",
      send: "भेजें",
      minimize: "छोटा करें",
      close: "बंद करें",
      thinking: "सोच रहा हूं...",
      error: "क्षमा करें, मैं आपका अनुरोध संसाधित नहीं कर सका। कृपया पुनः प्रयास करें।",
      examples: "इनमें से पूछने की कोशिश करें:",
      exampleQueries: [
        "टमाटर कैसे उगाएं?",
        "कौन सा उर्वरक उपयोग करूं?",
        "कीटों को कैसे नियंत्रित करें?",
        "गेहूं कब काटें?",
        "मेरे क्षेत्र का मौसम पूर्वानुमान"
      ]
    },
    te: {
      welcome: "నమస్కారం! నేను కృషి మిత్రుడిని, మీ AI వ్యవసాయ సహాయకుడిని. ఈరోజు మీకు ఎలా సహాయపడగలను?",
      placeholder: "వ్యవసాయం గురించి ఏదైనా అడగండి...",
      send: "పంపండి",
      minimize: "చిన్నది చేయండి",
      close: "మూసివేయండి",
      thinking: "ఆలోచిస్తున్నాను...",
      error: "క్షమించండి, నేను మీ అభ్యర్థనను ప్రాసెస్ చేయలేకపోయాను. దయచేసి మళ్లీ ప్రయత్నించండి.",
      examples: "ఇవి అడగడానికి ప్రయత్నించండి:",
      exampleQueries: [
        "టమాటలు ఎలా పండించాలి?",
        "ఏ ఎరువు ఉపయోగించాలి?",
        "కీటకాలను ఎలా నియంత్రించాలి?",
        "గోధుమలు ఎప్పుడు కోయాలి?",
        "నా ప్రాంతానికి వాతావరణ సూచన"
      ]
    },
    ta: {
      welcome: "வணக்கம்! நான் கிருஷி மித்ரா, உங்கள் AI விவசாய உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
      placeholder: "விவசாயம் பற்றி எதையும் கேளுங்கள்...",
      send: "அனுப்பு",
      minimize: "சிறிதாக்கு",
      close: "மூடு",
      thinking: "யோசித்துக்கொண்டிருக்கிறேன்...",
      error: "மன்னிக்கவும், உங்கள் கோரிக்கையை செயலாக்க முடியவில்லை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.",
      examples: "இவற்றைக் கேட்க முயற்சிக்கவும்:",
      exampleQueries: [
        "தக்காளி எப்படி வளர்க்கலாம்?",
        "எந்த உரம் பயன்படுத்த வேண்டும்?",
        "பூச்சிகளை எப்படி கட்டுப்படுத்துவது?",
        "கோதுமை எப்போது அறுவடை செய்வது?",
        "என் பகுதியின் வானிலை முன்னறிவிப்பு"
      ]
    },
    bn: {
      welcome: "নমস্কার! আমি কৃষি মিত্র, আপনার AI কৃষি সহায়ক। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
      placeholder: "কৃষি সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন...",
      send: "পাঠান",
      minimize: "ছোট করুন",
      close: "বন্ধ করুন",
      thinking: "ভাবছি...",
      error: "দুঃখিত, আমি আপনার অনুরোধ প্রক্রিয়া করতে পারিনি। অনুগ্রহ করে আবার চেষ্টা করুন।",
      examples: "এগুলো জিজ্ঞাসা করার চেষ্টা করুন:",
      exampleQueries: [
        "টমেটো কীভাবে চাষ করব?",
        "কোন সার ব্যবহার করব?",
        "পোকামাকড় কীভাবে নিয়ন্ত্রণ করব?",
        "গম কখন কাটব?",
        "আমার এলাকার আবহাওয়ার পূর্বাভাস"
      ]
    },
    mr: {
      welcome: "नमस्कार! मी कृषी मित्र आहे, तुमचा AI कृषी सहायक. आज मी तुम्हाला कशी मदत करू शकतो?",
      placeholder: "शेतीबद्दल काहीही विचारा...",
      send: "पाठवा",
      minimize: "लहान करा",
      close: "बंद करा",
      thinking: "विचार करत आहे...",
      error: "माफ करा, मी तुमची विनंती प्रक्रिया करू शकलो नाही. कृपया पुन्हा प्रयत्न करा.",
      examples: "हे विचारण्याचा प्रयत्न करा:",
      exampleQueries: [
        "टोमॅटो कसे पिकवायचे?",
        "कोणते खत वापरावे?",
        "कीड कसे नियंत्रित करावे?",
        "गहू कधी कापावा?",
        "माझ्या भागातील हवामान अंदाज"
      ]
    },
    gu: {
      welcome: "નમસ્તે! હું કૃષિ મિત્ર છું, તમારો AI કૃષિ સહાયક. આજે હું તમારી કેવી રીતે મદદ કરી શકું?",
      placeholder: "ખેતી વિશે કંઈપણ પૂછો...",
      send: "મોકલો",
      minimize: "નાનું કરો",
      close: "બંધ કરો",
      thinking: "વિચારી રહ્યો છું...",
      error: "માફ કરશો, હું તમારી વિનંતી પર પ્રક્રિયા કરી શક્યો નથી. કૃપા કરીને ફરીથી પ્રયાસ કરો.",
      examples: "આ પૂછવાનો પ્રયાસ કરો:",
      exampleQueries: [
        "ટમેટા કેવી રીતે ઉગાડવા?",
        "કયા ખાતરનો ઉપયોગ કરવો?",
        "જંતુઓને કેવી રીતે નિયંત્રિત કરવા?",
        "ઘઉં ક્યારે કાપવું?",
        "મારા વિસ્તારનું હવામાન પૂર્વાનુમાન"
      ]
    },
    kn: {
      welcome: "ನಮಸ್ಕಾರ! ನಾನು ಕೃಷಿ ಮಿತ್ರ, ನಿಮ್ಮ AI ಕೃಷಿ ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
      placeholder: "ಕೃಷಿಯ ಬಗ್ಗೆ ಏನನ್ನಾದರೂ ಕೇಳಿ...",
      send: "ಕಳುಹಿಸಿ",
      minimize: "ಚಿಕ್ಕದಾಗಿ ಮಾಡಿ",
      close: "ಮುಚ್ಚಿ",
      thinking: "ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ...",
      error: "ಕ್ಷಮಿಸಿ, ನಾನು ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
      examples: "ಇವುಗಳನ್ನು ಕೇಳಲು ಪ್ರಯತ್ನಿಸಿ:",
      exampleQueries: [
        "ಟೊಮೇಟೊ ಹೇಗೆ ಬೆಳೆಯುವುದು?",
        "ಯಾವ ಗೊಬ್ಬರ ಬಳಸಬೇಕು?",
        "ಕೀಟಗಳನ್ನು ಹೇಗೆ ನಿಯಂತ್ರಿಸುವುದು?",
        "ಗೋಧಿ ಯಾವಾಗ ಕೊಯ್ಯಬೇಕು?",
        "ನನ್ನ ಪ್ರದೇಶದ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ"
      ]
    },
    ml: {
      welcome: "നമസ്കാരം! ഞാൻ കൃഷി മിത്രൻ, നിങ്ങളുടെ AI കാർഷിക സഹായി. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?",
      placeholder: "കൃഷിയെക്കുറിച്ച് എന്തും ചോദിക്കൂ...",
      send: "അയയ്ക്കുക",
      minimize: "ചെറുതാക്കുക",
      close: "അടയ്ക്കുക",
      thinking: "ചിന്തിക്കുന്നു...",
      error: "ക്ഷമിക്കണം, നിങ്ങളുടെ അഭ്യർത്ഥന പ്രോസസ്സ് ചെയ്യാൻ കഴിഞ്ഞില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
      examples: "ഇവ ചോദിക്കാൻ ശ്രമിക്കൂ:",
      exampleQueries: [
        "തക്കാളി എങ്ങനെ വളർത്താം?",
        "ഏത് വളം ഉപയോഗിക്കണം?",
        "കീടങ്ങളെ എങ്ങനെ നിയന്ത്രിക്കാം?",
        "ഗോതമ്പ് എപ്പോൾ വിളവെടുക്കണം?",
        "എന്റെ പ്രദേശത്തെ കാലാവസ്ഥാ പ്രവചനം"
      ]
    },
    pa: {
      welcome: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਕ੍ਰਿਸ਼ੀ ਮਿਤਰ ਹਾਂ, ਤੁਹਾਡਾ AI ਖੇਤੀ ਸਹਾਇਕ। ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",
      placeholder: "ਖੇਤੀ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ...",
      send: "ਭੇਜੋ",
      minimize: "ਛੋਟਾ ਕਰੋ",
      close: "ਬੰਦ ਕਰੋ",
      thinking: "ਸੋਚ ਰਿਹਾ ਹਾਂ...",
      error: "ਮਾਫ਼ ਕਰਨਾ, ਮੈਂ ਤੁਹਾਡੀ ਬੇਨਤੀ ਦੀ ਪ੍ਰਕਿਰਿਆ ਨਹੀਂ ਕਰ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
      examples: "ਇਹ ਪੁੱਛਣ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰੋ:",
      exampleQueries: [
        "ਟਮਾਟਰ ਕਿਵੇਂ ਉਗਾਉਣੇ?",
        "ਕਿਹੜੀ ਖਾਦ ਵਰਤਣੀ ਚਾਹੀਦੀ ਹੈ?",
        "ਕੀੜਿਆਂ ਨੂੰ ਕਿਵੇਂ ਕਾਬੂ ਕਰਨਾ?",
        "ਕਣਕ ਕਦੋਂ ਵੱਢਣੀ ਚਾਹੀਦੀ ਹੈ?",
        "ਮੇਰੇ ਇਲਾਕੇ ਦਾ ਮੌਸਮੀ ਪੂਰਵਾਨੁਮਾਨ"
      ]
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message when component mounts
    if (messages.length === 0) {
      setMessages([{
        id: Date.now(),
        type: 'bot',
        text: translations[selectedLanguage]?.welcome || translations.en.welcome,
        timestamp: new Date()
      }]);
    }
  }, [selectedLanguage]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          language: selectedLanguage
        })
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          text: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: translations[selectedLanguage]?.error || translations.en.error,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExampleClick = (example) => {
    setInputMessage(example);
  };

  if (isMinimized) {
    return (
      <div className="chatbot-minimized" onClick={onMinimize}>
        <MessageCircle className="w-6 h-6" />
        <span>Krishi Mitra</span>
      </div>
    );
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <Bot className="w-6 h-6" />
          <span>Krishi Mitra AI Assistant</span>
        </div>
        <div className="chatbot-controls">
          <select 
            value={selectedLanguage} 
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="language-selector"
          >
            {Object.entries(languages).map(([code, lang]) => (
              <option key={code} value={code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          <button onClick={onMinimize} className="control-btn">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="control-btn">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="chatbot-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-avatar">
              {message.type === 'bot' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot">
            <div className="message-avatar">
              <Bot className="w-5 h-5" />
            </div>
            <div className="message-content">
              <div className="message-text">
                {translations[selectedLanguage]?.thinking || translations.en.thinking}
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-examples">
        <div className="examples-title">
          {translations[selectedLanguage]?.examples || translations.en.examples}
        </div>
        <div className="examples-list">
          {(translations[selectedLanguage]?.exampleQueries || translations.en.exampleQueries).map((example, index) => (
            <button
              key={index}
              className="example-btn"
              onClick={() => handleExampleClick(example)}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="chatbot-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={translations[selectedLanguage]?.placeholder || translations.en.placeholder}
          className="message-input"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="send-btn"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
