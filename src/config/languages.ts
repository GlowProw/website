export interface LanguageItem {
  label: string;
  value: string;
}

export interface LanguagesConfig {
  default: string;
  mapping: string;
  fallback: string;
  child: LanguageItem[];
}

export const languagesConfig: LanguagesConfig = {
  default: "zh-CN",
  mapping: "en-US",
  fallback: "en-US",
  child: [
    {
      label: "简体中文",
      value: "zh-CN"
    },
    {
      label: "繁体中文",
      value: "zh-TW"
    },
    {
      label: "English",
      value: "en-US"
    }
  ]
};

/**
 * 格式归一
 * @param langStr 
 * @returns 
 */
export const normalizeLang = (langStr: string | null | undefined): string | null => {
  if (!langStr || typeof langStr !== 'string') return null;
  const target = langStr.trim().replace('_', '-');
  const supported = languagesConfig.child.map(item => item.value);

  const exactMatch = supported.find(val => val.toLowerCase() === target.toLowerCase());
  if (exactMatch) return exactMatch;

  const shortLang = target.split('-')[0].toLowerCase();
  for (const s of supported) {
    if (s.split('-')[0].toLowerCase() === shortLang) {
      return s;
    }
  }

  return null;
};

export default languagesConfig;
