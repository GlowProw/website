import {defineStore} from "pinia";

export const useAssetsStore = defineStore('assets', {
    state: () => ({
        commodities: new Map(),
        modifications: new Map(),
        npcs: new Map(),
        ships: new Map(),
        items: new Map(),
        cosmetics: new Map(),
        materials: new Map(),
        factions: new Map(),
        treasureMaps: new Map(),
        raritys: new Map(),
    }),
    actions: {
        /**
         * 初始
         */
        init(options = {
            all: true, npc: true, ship: true, item: true, material: true, faction: true,
            modification: true, cosmetic: true,
            teasureMap: true,
            rarity: true,
        }) {
            if (options.npc || options.all)
                this.initNpcs()
            if (options.ship || options.all)
                this.initShips()
            if (options.item || options.all)
                this.initItems()
            if (options.cosmetic || options.all)
                this.initCosmetics()
            if (options.material || options.all)
                this.initMaterials()
            if (options.faction || options.all)
                this.iniFactions()
            if (options.cosmetic || options.all)
                this.initCommodities()
            if (options.modification || options.all)
                this.initModifications()

            if (options.teasureMap || options.all)
                this.initTeasureMaps()

            if (options.rarity || options.all)
                this.initRarity()
        },

        initCommodities() {
            if (this.commodities.size != 0)
                return;

            const commoditieImages = import.meta.glob('@glow-prow-assets/commodities/*', {eager: true})

            this.commodities = this.serializationMap(commoditieImages)
        },

        initModifications() {
            if (this.modifications.size != 0)
                return;

            const modificationImages = import.meta.glob('@glow-prow-assets/modifications/*', {eager: true})

            this.modifications = this.serializationMap(modificationImages)
        },

        initNpcs() {
            if (this.npcs.size != 0)
                return;

            const npcImages = import.meta.glob('@glow-prow-assets/npcs/*', {eager: true})

            this.npcs = this.serializationMap(npcImages)
        },

        initShips() {
            if (this.ships.size != 0)
                return;

            const shipImages = import.meta.glob('@glow-prow-assets/ships/*', {eager: true})

            this.ships = this.serializationMap(shipImages)
        },

        initItems() {
            if (this.items.size != 0)
                return;

            const item_ammunitions = import.meta.glob('@glow-prow-assets/items/ammunitions/*', {eager: true}),
                item_weapons = import.meta.glob('@glow-prow-assets/items/weapons/*', {eager: true}),
                item_armors = import.meta.glob('@glow-prow-assets/items/armors/*', {eager: true}),
                item_chests = import.meta.glob('@glow-prow-assets/items/chests/*', {eager: true}),
                item_major_furnitures = import.meta.glob('@glow-prow-assets/items/majorFurnitures/*', {eager: true}),
                item_offensive_furnitures = import.meta.glob('@glow-prow-assets/items/offensiveFurnitures/*', {eager: true}),
                item_utility_furnitures = import.meta.glob('@glow-prow-assets/items/utilityFurnitures/*.*', {eager: true}),
                item_consumables = import.meta.glob('@glow-prow-assets/items/consumables/*', {eager: true}),
                item_torpedos = import.meta.glob('@glow-prow-assets/items/weapons/torpedos/*', {eager: true}),
                item_longGuns = import.meta.glob('@glow-prow-assets/items/weapons/longGuns/*', {eager: true}),
                item_tools = import.meta.glob('@glow-prow-assets/items/tools/*', {eager: true}),
                item_shipsUpgrades = import.meta.glob('@glow-prow-assets/ships/upgrades/*', {eager: true}),
                item_items = import.meta.glob('@glow-prow-assets/items/*', {eager: true})

            const itemImages = {
                ...item_ammunitions, ...item_weapons, ...item_armors, ...item_chests,
                ...item_major_furnitures, ...item_utility_furnitures, ...item_offensive_furnitures,
                ...item_consumables, ...item_torpedos, ...item_longGuns,
                ...item_tools, ...item_shipsUpgrades, ...item_items,
            };

            this.items = this.serializationMap(itemImages)
        },

        initCosmetics() {
            if (this.cosmetics.size != 0)
                return;

            const cosmetics_sailsPattern = import.meta.glob('@glow-prow-assets/cosmetics/sailsPattern/*', {eager: true})

            const cosmeticsImages = {
                ...cosmetics_sailsPattern
            }
            this.cosmetics = this.serializationMap(cosmeticsImages)
        },

        initRarity() {
            if (this.raritys.size != 0)
                return;

            const rarityImages = import.meta.glob('@/assets/images/item-rarity-*.png', {eager: true})

            this.raritys = this.serializationMap(rarityImages)
        },

        initMaterials() {
            if (this.materials.size != 0)
                return;

            const materialsImages = import.meta.glob('@glow-prow-assets/materials/*.*', {eager: true})

            this.materials = this.serializationMap(materialsImages)
        },

        iniFactions() {
            if (this.factions.size != 0)
                return;

            const factionsImages = import.meta.glob('@glow-prow-assets/factions/*.*', {eager: true})

            this.factions = this.serializationMap(factionsImages)
        },

        initTeasureMaps() {
            if (this.treasureMaps.size != 0)
                return;

            const teasureMapsImages = import.meta.glob('@glow-prow-assets/treasureMaps/**/*.*', {eager: true})

            this.treasureMaps = this.serializationMap(teasureMapsImages)
        },

        /**
         * 序列化
         * @param assetsRaw
         */
        serializationMap(assetsRaw: any) {
            const imageMap: any = {};
            for (const path in assetsRaw) {
                const key: any = path.split('/').pop()
                    ?.toString()
                    .replace(/\.(svg|webp|jpg|png|mp4)$/, '')
                imageMap[key] = assetsRaw[path].default;
            }
            return imageMap
        }
    }
})
