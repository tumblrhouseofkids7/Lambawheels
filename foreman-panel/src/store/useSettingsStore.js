import { create } from 'zustand';

// Simple dictionary for basic UI translation
const translations = {
  en: {
    dashboard: 'Dashboard',
    shift: 'Shift',
    entry: 'Entry',
    thakdar: 'Thakdar',
    history: 'History',
    logout: 'Logout',
    welcome: 'Welcome',
    portal: 'Operation Supervisor',
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    shift: 'शिफ्ट',
    entry: 'प्रविष्टि',
    thakdar: 'ठेकेदार',
    history: 'इतिहास',
    logout: 'लॉग आउट',
    welcome: 'स्वागत है',
    portal: 'फोरमैन पोर्टल',
  },
  pa: {
    dashboard: 'ਡੈਸ਼ਬੋਰਡ',
    shift: 'ਸ਼ਿਫਟ',
    entry: 'ਇੰਦਰਾਜ਼',
    thakdar: 'ਠੇਕੇਦਾਰ',
    history: 'ਇਤਿਹਾਸ',
    logout: 'ਲਾਗ ਆਊਟ',
    welcome: 'ਸਵਾਗਤ ਹੈ',
    portal: 'ਫੋਰਮੈਨ ਪੋਰਟਲ',
  }
};

const useSettingsStore = create((set, get) => ({
  language: 'en',
  t: (key) => {
    const state = get();
    return translations[state.language][key] || key;
  },
  setLanguage: (lang) => set({ language: lang }),
}));

export default useSettingsStore;
