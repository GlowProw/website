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
            childs: [
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
            childs: [
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
            childs: [
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
