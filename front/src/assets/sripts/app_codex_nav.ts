import {Commodity} from "../../../../../glow-prow-data";

/**
 * 手稿导航
 */
export default class AppCodexNav {
    codex = [
        {
            title: 'codex.navs.shipsAndCaptainTools.name',
            value: 'shipsAndCaptainTools',
            childs: [
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
            childs: [
                {
                    title: 'codex.navs.allDeckWeapons.name',
                    value: 'allDeckWeapons',
                    to: "/codex/items?type=culverin,demicannon,bombard,longGun,torpedo"
                },
                {
                    title: 'codex.navs.topDeckWeapons.name',
                    value: 'topDeckWeapons',
                    to: "/codex/items?type=ballista,seaFire"
                },
                {
                    title: 'codex.navs.bowWeapons.name',
                    value: 'bowWeapons',
                    to: "/codex/items?type=ballista"
                },
                {
                    title: 'codex.navs.auxiliaryWeapons.name',
                    value: 'auxiliaryWeapons',
                    to: "/codex/items?type=mortar"
                }
            ]
        },
        {
            title: 'codex.navs.armor.name',
            value: 'armor',
            childs: [
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
            childs: [
                {
                    title: 'codex.navs.majorFurniture.name',
                    value: 'majorFurniture',
                    to: "/codex/items?type=majorFurniture"
                },
                {
                    title: 'codex.navs.offensiveFurnTure.name',
                    value: 'offensiveFurnTure',
                    to: "/codex/items?type=offensiveFurnTure"
                },
                {
                    title: 'codex.navs.utilityFurnTure.name',
                    value: 'utilityFurnTure',
                    to: "/codex/items?type=utilityFurnTure"
                },
            ]
        },
        {
            title: 'codex.navs.materials.name',
            value: 'materials',
            childs: [
                {
                    title: 'codex.navs.rawMaterials.name',
                    value: 'rawMaterials',
                    to: "/codex/materials?type=raw"
                },
                {
                    title: 'codex.navs.refinedMaterials.name',
                    value: 'refinedMaterials',
                    to: "/codex/materials?type=refined"
                },
                {
                    title: 'codex.navs.specializedMaterials.name',
                    value: 'specializedMaterials',
                    to: "/codex/materials?type=specialized"
                },
                {
                    title: 'codex.navs.exoticMaterials.name',
                    value: 'exoticMaterials',
                    to: "/codex/materials?type=exotic"
                },
                {
                    title: 'codex.navs.helmMaterials.name',
                    value: 'helmMaterials',
                    to: "/codex/materials?type=helm"
                },
                {
                    title: 'codex.navs.scrapMaterials.name',
                    value: 'scrapMaterials',
                    to: "/codex/materials?type=scrap"
                },
            ]
        },
        {
            title: 'codex.navs.provisions.name',
            value: 'provisions',
            childs: [
                {
                    title: 'codex.navs.shipSupplies.name',
                    value: 'shipSupplies',
                    to: '/codex/items?type=tool'
                },
                {
                    title: 'codex.navs.crewProvision.name',
                    value: 'crewProvision',
                    to: '/codex/items?type=tool'
                },
            ]
        },
        {
            title: 'codex.navs.commodities.name',
            value: 'commodities',
            childs: [
                {
                    title: 'codex.navs.localFactionCommodities.name',
                    value: 'localFactionCommodities',
                    to: '/codex/commodities?type=localFaction'
                },
                {
                    title: 'codex.navs.megaCorpCommodities.name',
                    value: 'megaCorpCommodities',
                    to: '/codex/commodities?type=megacorp'
                },
                {
                    title: 'codex.navs.kingpinCommodities.name',
                    value: 'kingpinCommodities',
                    to: '/codex/commodities?type=kingpin'
                },
                {
                    title: 'codex.navs.theHelmItems.name',
                    value: 'theHelmItems',
                    to: '/codex/items?type=tool'
                },
            ]
        }
    ]

    nav = [
        {
            title: 'codex.ships.title',
            to: '/codex/ships'
        },
        {
            title: 'codex.ultimates.title',
            to: '/codex/ultimates'
        },
        {
            title: 'codex.modifications.title',
            to: '/codex/mods'
        },
        {
            title: 'codex.items.title',
            to: '/codex/items'
        },
        {
            title: 'codex.cosmetics.title',
            to: '/codex/cosmetics'
        },
        {
            title: 'codex.materials.title',
            to: '/codex/materials'
        },
        {
            title: 'codex.commodities.title',
            to: '/codex/commodities'
        },

    ]

    other = []
}
