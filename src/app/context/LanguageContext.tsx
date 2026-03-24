import React, { createContext, useContext, useState } from "react";
import { T, type Lang, type Translations } from "../i18n/translations";

interface LanguageContextValue {
  lang:    Lang;
  setLang: (l: Lang) => void;
  t:       Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang:    "en",
  setLang: () => {},
  t:       T["en"],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: T[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
