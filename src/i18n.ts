import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";

const STORAGE_KEY = "svg-to-png-language";

function normalizeLanguage(language: string): "en" | "zh-CN" {
  return language.toLowerCase().startsWith("zh") ? "zh-CN" : "en";
}

function getInitialLanguage(): "en" | "zh-CN" {
  try {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
    if (savedLanguage) return normalizeLanguage(savedLanguage);
  } catch {
    // Storage can be unavailable in strict privacy modes.
  }

  return normalizeLanguage(window.navigator.language || "en");
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    "zh-CN": { translation: zhCN },
  },
  lng: getInitialLanguage(),
  fallbackLng: "en",
  supportedLngs: ["en", "zh-CN"],
  interpolation: {
    escapeValue: false,
  },
  initAsync: false,
  returnNull: false,
});

i18n.on("languageChanged", (language) => {
  const normalizedLanguage = normalizeLanguage(language);
  document.documentElement.lang = normalizedLanguage;

  try {
    window.localStorage.setItem(STORAGE_KEY, normalizedLanguage);
  } catch {
    // The language still applies for the current session.
  }
});

document.documentElement.lang = normalizeLanguage(i18n.language);

export default i18n;
