export interface CodexNavItem {
    type?: 'item' | 'divider';
    title?: string;
    value?: string;
    to?: string;
    prependIcon?: string;
    appendIcon?: string;
    badge?: string;
    variant?: any;
    class?: string;
    slim?: boolean;
}

/**
 * 手稿导航
 */
export default class AppCodexNav {
    codex = [
        {
            title: 'codex.navs.shipsAndCaptainTools.name',
            value: 'shipsAndCaptainTools',
            children: [
                {
                    title: 'codex.navs.ships.name',
                    value: 'ships',
                    to: '/codex/ships'
                },
                {
                    title: 'codex.navs.captainTools.name',
                    value: 'captainTools',
                    to: '/codex/items?type=tool'
                }
            ]
        },
        {
            title: 'codex.navs.weapons.name',
            value: 'weapons',
            children: [
                {
                    title: 'codex.navs.allDeckWeapons.name',
                    value: 'allDeckWeapons',
                    to: "/codex/items?type=culverin,demicannon"
                },
                {
                    title: 'codex.navs.topDeckWeapons.name',
                    value: 'topDeckWeapons',
                    to: "/codex/items?type=longGun,bombard,torpedo"
                },
                {
                    title: 'codex.navs.bowWeapons.name',
                    value: 'bowWeapons',
                    to: "/codex/items?type=ballista,seaFire"
                },
                {
                    title: 'codex.navs.auxiliaryWeapons.name',
                    value: 'auxiliaryWeapons',
                    to: "/codex/items?type=mortar,rocket,springloader"
                }
            ]
        },
        {
            title: 'codex.navs.armor.name',
            value: 'armor',
            children: [
                {
                    title: 'codex.navs.hullArmor.name',
                    value: 'hullArmor',
                    to: "/codex/items?type=armor"
                },
            ]
        },
        {
            title: 'codex.navs.furnTure.name',
            value: 'furnTure',
            children: [
                {
                    title: 'codex.navs.majorFurniture.name',
                    value: 'majorFurniture',
                    to: "/codex/items?type=majorFurniture"
                },
                {
                    title: 'codex.navs.offensiveFurnTure.name',
                    value: 'offensiveFurnTure',
                    to: "/codex/items?type=offensiveFurniture"
                },
                {
                    title: 'codex.navs.utilityFurnTure.name',
                    value: 'utilityFurnTure',
                    to: "/codex/items?type=utilityFurniture"
                },
            ]
        },
        {
            title: 'codex.navs.materials.name',
            value: 'materials',
            children: [
                {
                    title: 'codex.navs.rawMaterials.name',
                    value: 'rawMaterials',
                    to: "/codex/materials?category=raw"
                },
                {
                    title: 'codex.navs.refinedMaterials.name',
                    value: 'refinedMaterials',
                    to: "/codex/materials?category=refined"
                },
                {
                    title: 'codex.navs.specializedMaterials.name',
                    value: 'specializedMaterials',
                    to: "/codex/materials?category=specialized"
                },
                {
                    title: 'codex.navs.exoticMaterials.name',
                    value: 'exoticMaterials',
                    to: "/codex/materials?category=exotic"
                },
                {
                    title: 'codex.navs.helmMaterials.name',
                    value: 'helmMaterials',
                    to: "/codex/materials?category=helm"
                },
                {
                    title: 'codex.navs.scrapMaterials.name',
                    value: 'scrapMaterials',
                    to: "/codex/materials?category=scrap"
                },
            ]
        },
        {
            title: 'codex.navs.provisions.name',
            value: 'provisions',
            children: [
                {
                    title: 'codex.navs.shipSupplies.name',
                    value: 'shipSupplies',
                    to: '/codex/items?type=ammunition,consumable'
                },
                {
                    title: 'codex.navs.crewProvision.name',
                    value: 'crewProvision',
                    to: '/codex/items?type=consumable'
                },
            ]
        },
        {
            title: 'codex.navs.commodities.name',
            value: 'commodities',
            children: [
                {
                    title: 'codex.navs.localFactionCommodities.name',
                    value: 'localFactionCommodities',
                    to: '/codex/commodities?category=localFaction'
                },
                {
                    title: 'codex.navs.megaCorpCommodities.name',
                    value: 'megaCorpCommodities',
                    to: '/codex/commodities?category=megacorp'
                },
                {
                    title: 'codex.navs.kingpinCommodities.name',
                    value: 'kingpinCommodities',
                    to: '/codex/commodities?category=kingpin'
                },
                {
                    title: 'codex.navs.theHelmItems.name',
                    value: 'theHelmItems',
                    to: '/codex/commodities?category=theHelm'
                },
                {
                    title: 'codex.navs.currency.name',
                    value: 'currency',
                    to: '/codex/materials?category=currency'
                },
            ]
        }
    ];

    nav: CodexNavItem[] = [
        {
            title: 'codex.ships.title',
            to: '/codex/ships',
            prependIcon: 'mdi-format-list-bulleted-type'
        },
        {
            title: 'codex.ultimates.title',
            to: '/codex/ultimates',
            prependIcon: 'mdi-format-list-bulleted-type'
        },
        {
            title: 'codex.modifications.title',
            to: '/codex/modifications',
            prependIcon: 'mdi-format-list-bulleted-type'
        },
        {
            title: 'codex.items.title',
            to: '/codex/items',
            prependIcon: 'mdi-format-list-bulleted-type'
        },
        {
            title: 'codex.cosmetics.title',
            to: '/codex/cosmetics',
            prependIcon: 'mdi-format-list-bulleted-type'
        },
        {
            title: 'codex.sets.title',
            to: '/codex/sets',
            prependIcon: 'mdi-format-list-bulleted-type'
        },
        {
            title: 'codex.materials.title',
            to: '/codex/materials',
            prependIcon: 'mdi-format-list-bulleted-type'
        },
        {
            title: 'codex.commodities.title',
            to: '/codex/commodities',
            prependIcon: 'mdi-format-list-bulleted-type'
        },

        {
            title: 'codex.masterys.title',
            to: '/codex/masterys',
            prependIcon: 'mdi-format-list-bulleted-type'
        },
        {
            type: 'divider',
            class: 'my-2'
        },
        {
            title: 'codex.empireSkills.title',
            to: '/codex/empireSkills',
            prependIcon: 'mdi-format-list-bulleted-type'
        },
        {
            title: 'codex.quests.title',
            to: '/quest',
            prependIcon: 'mdi-format-list-bulleted-type'
        },
        {
            type: 'divider',
            class: 'my-2'
        },
        {
            title: 'codex.treasureMaps.title',
            to: '/codex/treasureMaps'
        },
        {
            title: 'codex.mapLocations.title',
            to: '/codex/mapLocations',
            badge: 'BETA'
        },
        {
            title: 'codex.npcs.title',
            to: '/codex/npcs',
            badge: 'BETA'
        },
        {
            title: 'search.title',
            to: '/search',
            prependIcon: 'mdi-magnify',
            appendIcon: 'mdi-open-in-new',
            variant: 'tonal',
            slim: true,
            class: 'mt-5'
        }
    ];

    other = [];
}
