'use client';
import { useEffect, useState } from 'react';

export default function LanguageSwitcher() {
  const [lang, setLang] = useState('es');

  useEffect(() => {
    // Inject Google Translate script dynamically if not present
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(script);

      window.googleTranslateElementInit = function() {
        new window.google.translate.TranslateElement({
          pageLanguage: 'es',
          includedLanguages: 'es,en,fr', /* Only allow Spanish, English, French */
          autoDisplay: false
        }, 'google_translate_element');
      };
    }
  }, []);

  const changeLanguage = (langCode: string) => {
    setLang(langCode);
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
    }
  };

  return (
    <div className="custom-language-switcher flex-wrap-center gap-08rem mb-2rem">
      <div id="google_translate_element" className="d-none"></div>
      <button 
        onClick={() => changeLanguage('es')}
        className={`lang-btn ${lang === 'es' ? 'lang-btn-active' : ''}`}
        aria-label="Español" title="Español"
      >
        ES
      </button>
      <button 
        onClick={() => changeLanguage('en')}
        className={`lang-btn ${lang === 'en' ? 'lang-btn-active' : ''}`}
        aria-label="English" title="English"
      >
        EN
      </button>
      <button 
        onClick={() => changeLanguage('fr')}
        className={`lang-btn ${lang === 'fr' ? 'lang-btn-active' : ''}`}
        aria-label="Français" title="Français"
      >
        FR
      </button>
    </div>
  );
}

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}
