export interface LanguageItem {
  label: string;
  value: string;
}

export interface LanguagesConfig {
  default: string;
  mapping: string;
  child: LanguageItem[];
}

export const languagesConfig: LanguagesConfig = {
  default: "zh-CN",
  mapping: "en-US",
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

export default languagesConfig;
