import {defineStore} from "pinia";

export const useAssetsStore = defineStore('assets', {
    state: () => ({
        items: new Map(),
        raritys: new Map(),
        cosmetics: new Map(),
        materials: new Map(),
        factions: new Map()
    }),
    actions: {
        /**
         * 初始
         */
        init() {
            this.initItems()
            this.initCosmetics()
            this.initRarity()
            this.initMaterials()
            this.iniFactions()
        },

        initItems () {
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
                item_items = import.meta.glob('@glow-prow-assets/items/*', {eager: true});

            const itemImages = {
                ...item_ammunitions, ...item_weapons, ...item_armors, ...item_chests,
                ...item_major_furnitures, ...item_utility_furnitures, ...item_offensive_furnitures,
                ...item_consumables, ...item_torpedos, ...item_longGuns,
                ...item_tools, ...item_shipsUpgrades, ...item_items,
            };

            this.items = this.serializationMap(itemImages);
        },

        initCosmetics () {
            if (this.cosmetics.size != 0)
                return;

            const cosmetics_sailsPattern = import.meta.glob('@glow-prow-assets/cosmetics/sailsPattern/*', {eager: true});

            const cosmeticsImages = {
                ...cosmetics_sailsPattern
            }
            this.cosmetics = this.serializationMap(cosmeticsImages);
        },

        initRarity () {
            if (this.raritys.size != 0)
                return;

            const rarityImages = import.meta.glob('@/assets/images/item-rarity-*.png', {eager: true});

            this.raritys = this.serializationMap(rarityImages);
        },

        initMaterials () {
            if (this.materials.size != 0)
                return;

            const materialsImages = import.meta.glob('@glow-prow-assets/materials/*.*', {eager: true});

            this.materials = this.serializationMap(materialsImages);
        },

        iniFactions () {
            if (this.factions.size != 0)
                return;

            const factionsImages = import.meta.glob('@glow-prow-assets/factions/*.*', {eager: true});

            this.factions = this.serializationMap(factionsImages);
        },

        /**
         * 序列化
         * @param assetsRaw
         */
        serializationMap(assetsRaw) {
            const imageMap = {};
            for (const path in assetsRaw) {
                const key = path.split('/').pop()
                    ?.toString()
                    .replace(/\.(svg|webp|jpg|png|mp4)$/, '');
                imageMap[key] = assetsRaw[path].default;
            }
            return imageMap
        }

    }
})
