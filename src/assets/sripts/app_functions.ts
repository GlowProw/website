import {storage_account} from "@/assets/sripts/index";

/**
 * 应用功能
 */
export default class AppFuns {
    storage = storage_account

    public original: any[] = [
        {
            title: 'header.functions.team.title',
            icon: 'mdi-bullhorn-outline',
            description: "header.functions.team.description",
            to: '/team'
        },
        {
            title: 'header.functions.calendar.title',
            icon: 'mdi-calendar-range',
            description: 'header.functions.calendar.description',
            to: '/calendar'
        },
        {
            title: 'header.functions.maps.title',
            icon: 'mdi-map',
            description: 'header.functions.maps.description',
            to: '/map'
        },
        {
            title: 'header.functions.codex.title',
            icon: 'mdi-package-variant-closed',
            description: 'header.functions.codex.description',
            to: '/codex'
        },
        {
            title: 'codex.treasureMaps.comparison.title',
            icon: 'mdi-image-search-outline',
            description: 'codex.treasureMaps.comparison.description',
            to: '/codex/treasureMaps?comparison=true'
        },
        {
            title: 'header.functions.assembly.title',
            icon: 'mdi-palette-outline',
            description: 'header.functions.assembly.description',
            to: `/assembly/browse?t=${new Date().getTime()}`
        },
        {
            title: 'header.functions.captain-signature.title',
            icon: 'mdi-draw-pen',
            description: 'header.functions.captain-signature.description',
            to: ''
        },
        {
            title: 'header.functions.ranking-of-designed-items.title',
            icon: 'mdi-format-list-numbered',
            description: 'header.functions.ranking-of-designed-items.description',
            to: '',
            testTo: '/ranking-designed-items'
        },
        {
            title: 'header.functions.impression-of-monsters.title',
            icon: 'mdi-help',
            description: 'header.functions.impression-of-monsters.description',
            to: ''
        },
        {
            title: 'header.functions.fashion-show.title',
            icon: 'mdi-help',
            description: 'header.functions.fashion-show.description',
            to: ''
        },
        {
            title: 'header.functions.empire-skill-simulation.title',
            icon: 'mdi-hexagram-outline',
            description: 'header.functions.empire-skill-simulation.description',
            to: '/empire-skill-simulation'
        }
    ]

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
