export const STRUCTURED_DATA_MAP: Record<string, object> = {
    'zh-CN': {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": "https://glow-prow.top/#website",
                "url": "https://glow-prow.top/",
                "name": "Glow Prow | 闪耀船首",
                "description": "《碧海黑帆 (Skull and Bones)》全能游戏百科与交互地图助手：全收集地图、船只配置模拟、全物品图鉴、走私差事与帝国技能树。",
                "publisher": {
                    "@type": "Organization",
                    "name": "Glow Prow",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://glow-prow.top/favicon.png"
                    }
                },
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://glow-prow.top/zh-CN/codex?search={search_term_string}",
                    "query-input": "required name=search_term_string"
                },
                "inLanguage": ["zh-CN", "zh-TW", "en-US"]
            },
            {
                "@type": "WebApplication",
                "@id": "https://glow-prow.top/#webapp",
                "name": "Glow Prow 碧海黑帆助手",
                "url": "https://glow-prow.top/",
                "applicationCategory": "GameApplication, UtilitiesApplication",
                "operatingSystem": "All",
                "browserRequirements": "Requires JavaScript. Requires HTML5.",
                "description": "专为《碧海黑帆》玩家打造的实用工具库，提供交互式地图标注、船只与配装模拟、走私收益计算、帝国技能路线模拟及全数据图鉴。"
            }
        ]
    },
    'zh-TW': {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": "https://glow-prow.top/#website",
                "url": "https://glow-prow.top/",
                "name": "Glow Prow | 閃耀船首",
                "description": "《怒海戰記 (Skull and Bones)》全能遊戲百科與交互地圖助手：全收集地圖、船隻配置模擬、全物品圖鑑、走私差事與帝國技能樹。",
                "publisher": {
                    "@type": "Organization",
                    "name": "Glow Prow",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://glow-prow.top/favicon.png"
                    }
                },
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://glow-prow.top/zh-TW/codex?search={search_term_string}",
                    "query-input": "required name=search_term_string"
                },
                "inLanguage": ["zh-CN", "zh-TW", "en-US"]
            },
            {
                "@type": "WebApplication",
                "@id": "https://glow-prow.top/#webapp",
                "name": "Glow Prow 怒海戰記助手",
                "url": "https://glow-prow.top/",
                "applicationCategory": "GameApplication, UtilitiesApplication",
                "operatingSystem": "All",
                "browserRequirements": "Requires JavaScript. Requires HTML5.",
                "description": "專為《怒海戰記》玩家打造的實用工具庫，提供交互式地圖標註、船隻與配裝模擬、走私收益計算、帝國技能路線模擬及全數據圖鑑。"
            }
        ]
    },
    'en-US': {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": "https://glow-prow.top/#website",
                "url": "https://glow-prow.top/",
                "name": "Glow Prow | Skull and Bones Database & Map",
                "description": "Skull and Bones comprehensive database and interactive map helper: collection map, ship loadout simulation, item codex, smugglers, and empire skills.",
                "publisher": {
                    "@type": "Organization",
                    "name": "Glow Prow",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://glow-prow.top/favicon.png"
                    }
                },
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://glow-prow.top/en-US/codex?search={search_term_string}",
                    "query-input": "required name=search_term_string"
                },
                "inLanguage": ["zh-CN", "zh-TW", "en-US"]
            },
            {
                "@type": "WebApplication",
                "@id": "https://glow-prow.top/#webapp",
                "name": "Glow Prow Skull and Bones Helper",
                "url": "https://glow-prow.top/",
                "applicationCategory": "GameApplication, UtilitiesApplication",
                "operatingSystem": "All",
                "browserRequirements": "Requires JavaScript. Requires HTML5.",
                "description": "A utility toolkit for Skull and Bones players, featuring interactive maps, ship loadout simulation, smuggler calculations, and complete codex."
            }
        ]
    }
};
