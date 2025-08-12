import {defineStore} from "pinia";

export const useItemAssetsStore = defineStore('itemAssets', {
    state: () => ({
        assets: new Map(),
        raritys: new Map()
    }),
    actions: {
        /**
         * 初始
         */
        init() {
            if (!this.assets && this.assets.size != 0 && !this.rarity && this.rarity.size != 0)
                return;

            const assets_ammunitions = import.meta.glob('@glow-prow-assets/items/ammunitions/*', {eager: true}),
                assets_weapons = import.meta.glob('@glow-prow-assets/items/weapons/*', {eager: true}),
                assets_armors = import.meta.glob('@glow-prow-assets/items/armors/*', {eager: true}),
                assets_majorFurnitures = import.meta.glob('@glow-prow-assets/items/majorFurnitures/*', {eager: true}),
                assets_offensiveFurnitures = import.meta.glob('@glow-prow-assets/items/offensiveFurnitures/*', {eager: true}),
                assets_utilityFurnitures = import.meta.glob('@glow-prow-assets/items/utilityFurnitures/*.*', {eager: true}),
                assets_consumables = import.meta.glob('@glow-prow-assets/items/consumables/*', {eager: true}),
                assets_torpedos = import.meta.glob('@glow-prow-assets/items/weapons/torpedos/*', {eager: true}),
                assets_longGuns = import.meta.glob('@glow-prow-assets/items/weapons/longGuns/*', {eager: true}),
                assets_tools = import.meta.glob('@glow-prow-assets/items/tools/*', {eager: true}),
                assets_shipsUpgrades = import.meta.glob('@glow-prow-assets/ships/upgrades/*', {eager: true}),
                assets_items = import.meta.glob('@glow-prow-assets/items/*', {eager: true});
            const rarityImages = import.meta.glob('@/assets/images/item-rarity-*.png', {eager: true});
            const assetsImages = {
                ...assets_ammunitions, ...assets_weapons, ...assets_armors,
                ...assets_majorFurnitures, ...assets_utilityFurnitures, ...assets_offensiveFurnitures,
                ...assets_consumables, ...assets_torpedos, ...assets_longGuns,
                ...assets_tools, ...assets_shipsUpgrades, ...assets_items
            };

            this.raritys = this.serializationMap(rarityImages);
            this.assets = this.serializationMap(assetsImages);
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
                    .replace('.webp', '')
                    .replace('.png', '');
                imageMap[key] = assetsRaw[path].default;
            }
            return imageMap
        }

    }
})
