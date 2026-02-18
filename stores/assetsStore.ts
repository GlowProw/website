import {defineStore} from "pinia";

/**
 * 资源状态
 */
export const useAssetsStore = defineStore('assets', {
    state: () => ({
        raritys: new Map(),
        treasureMaps: new Map(),
        npcs: new Map(),
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
            if (options.teasureMap || options.all)
                this.initTeasureMaps()
            if (options.rarity || options.all)
                this.initRarity()
        },

        initNpcs() {
            if (this.npcs.size != 0)
                return;

            const npcImages = import.meta.glob('@glow-prow-assets/npcs/*', {eager: true});

            this.npcs = this.serializationMap(npcImages)
        },

        initTeasureMaps() {
            if (this.treasureMaps.size != 0)
                return;

            const teasureMapsImages = import.meta.glob('@glow-prow-assets/treasureMaps/**/*.*', {eager: true});

            this.treasureMaps = this.serializationMap(teasureMapsImages);
        },

        initRarity() {
            if (this.raritys.size != 0)
                return;

            const rarityImages = import.meta.glob('@/assets/images/item-rarity-*.png', {eager: true})

            this.raritys = this.serializationMap(rarityImages)
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
