import { storage_account } from "@/assets/sripts/index";
import { getCurrentLang } from "@/config/languages";

/**
 * 应用功能
 */
export default class AppFuns {
    storage = storage_account

    /**
     * 功能原始列表（内部路由统一带 /{lang}/ 前缀）
     * 用 getter 在访问时按当前语言生成：本类是模块级单例，普通字段只在模块加载时求值一次，
     * 会冻结为默认语言（SSR 预渲染 en-US 页面时仍会得到 zh-CN 链接）。
     * 当前语言由 App.vue 在 setup/语言切换时写入 config/languages。
     */
    public get original(): any[] {
        const lang = getCurrentLang();

        return [
            {
                title: 'header.functions.codex.title',
                icon: 'mdi-package-variant-closed',
                description: 'header.functions.codex.description',
                to: `/${lang}/codex`
            },
            {
                title: 'header.functions.quest.title',
                icon: 'mdi-script-text-outline',
                description: 'header.functions.quest.description',
                to: `/${lang}/quest`
            },
            {
                title: 'header.functions.assembly.title',
                icon: 'mdi-palette-outline',
                description: 'header.functions.assembly.description',
                to: `/${lang}/assembly/browse?t=${new Date().getTime()}`
            },
            {
                title: 'header.functions.maps.title',
                icon: 'mdi-map',
                description: 'header.functions.maps.description',
                to: `/${lang}/map`
            },
            {
                title: 'header.functions.calendar.title',
                icon: 'mdi-calendar-range',
                description: 'header.functions.calendar.description',
                to: `/${lang}/calendar`
            },
            {
                title: 'header.functions.drop.title',
                icon: 'mdi-gift-outline',
                description: 'header.functions.drop.description',
                to: `/${lang}/drop`
            },
            {
                title: 'codex.treasureMaps.comparison.title',
                icon: 'mdi-image-search-outline',
                description: 'codex.treasureMaps.comparison.description',
                to: `/${lang}/codex/treasureMaps?comparison=true`
            },
            {
                title: 'header.functions.smugglers-report.title',
                icon: 'mdi-trophy-award',
                description: 'header.functions.smugglers-report.description',
                to: `/${lang}/smugglers-report`
            },
            {
                title: 'header.functions.stateOfWar.title',
                icon: 'mdi-shield-cross',
                description: 'header.functions.stateOfWar.description',
                to: `/${lang}/stateOfWar`
            },
            {
                title: 'header.functions.empire-skill-simulation.title',
                icon: 'mdi-hexagram-outline',
                description: 'header.functions.empire-skill-simulation.description',
                to: `/${lang}/empire-skill-simulation`
            },
            {
                title: 'header.functions.mastery.title',
                icon: 'mdi-compass-rose',
                description: 'header.functions.mastery.description',
                to: `/${lang}/mastery`
            },
            {
                title: 'header.functions.calculator.title',
                icon: 'mdi-calculator',
                description: 'header.functions.calculator.description',
                to: `/${lang}/calculator`
            },
            // {
            //    title: 'header.functions.captain-signature.title',
            //    icon: 'mdi-draw-pen',
            //    description: 'header.functions.captain-signature.description',
            //    to: ''
            // },
            // {
            //     title: 'header.functions.ranking-of-designed-items.title',
            //     icon: 'mdi-format-list-numbered',
            //     description: 'header.functions.ranking-of-designed-items.description',
            //     to: '',
            //     testTo: '/ranking-designed-items'
            // },
            // {
            //    title: 'header.functions.impression-of-monsters.title',
            //    icon: 'mdi-help',
            //    description: 'header.functions.impression-of-monsters.description',
            //    to: ''
            // },
            // {
            //    title: 'header.functions.fashion-show.title',
            //    icon: 'mdi-help',
            //    description: 'header.functions.fashion-show.description',
            //    to: ''
            // }
            {
                title: 'header.functions.apps.title',
                icon: 'mdi-application-outline',
                description: 'header.functions.apps.description',
                to: `/${lang}/apps`,
            },
            {
                title: 'header.functions.reminder.title',
                icon: 'mdi-alarm-check',
                description: 'header.functions.reminder.description',
                to: `/${lang}/reminder`,
            },
            {
                title: 'header.functions.team.title',
                icon: 'mdi-bullhorn-outline',
                description: "header.functions.team.description",
                to: `/${lang}/team`
            },
        ]
    }

    /**
     * 获取处理后的功能列表（根据用户配置过滤，路径已含 /{lang}/ 前缀）
     */
    get list(): any[] {
        const userConfigAppfuns = this.storage.getConfigurationItem('appFun', 'config');
        const original: any[] = this.original;

        if (!userConfigAppfuns || !Array.isArray(userConfigAppfuns)) {
            return original;
        }

        const configMap = new Map();
        userConfigAppfuns.forEach((item: { key: string, value: boolean }) => {
            if (item && item.key) {
                configMap.set(item.key, item.value);
            }
        });

        return original.filter((item: any) => {
            const configKey = item.title;
            const isEnabled = configMap.get(configKey);

            return isEnabled === undefined || isEnabled === true;
        });
    }
}
