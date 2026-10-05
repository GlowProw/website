import {defineStore} from "pinia";

let cachedNpcsMap: any = null;
let cachedRaritysMap: any = null;

function serializationMap(assetsRaw: any) {
    const imageMap: any = {};
    for (const path in assetsRaw) {
        const key: any = path.split('/').pop()
            ?.toString()
            .replace(/\.(svg|webp|jpg|png|mp4)$/, '');
        imageMap[key] = assetsRaw[path]?.default || assetsRaw[path];
    }
    return imageMap;
}

function getNpcsMap() {
    if (!cachedNpcsMap) {
        // @ts-ignore
        const npcImages = import.meta.glob('@glow-prow-assets/npcs/*', { eager: true });
        cachedNpcsMap = serializationMap(npcImages);
    }
    return cachedNpcsMap;
}

function getRaritysMap() {
    if (!cachedRaritysMap) {
        // @ts-ignore
        const rarityImages = import.meta.glob('@/assets/images/item-rarity-*.png', { eager: true });
        cachedRaritysMap = serializationMap(rarityImages);
    }
    return cachedRaritysMap;
}

/**
 * 资源状态
 */
export const useAssetsStore = defineStore('assets', {
    state: () => ({
        raritys: {} as any,
        npcs: {} as any,
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
                this.initNpcs();
            if (options.rarity || options.all)
                this.initRarity();
        },

        initNpcs() {
            this.npcs = getNpcsMap();
        },

        initRarity() {
            this.raritys = getRaritysMap();
        },

        serializationMap(assetsRaw: any) {
            return serializationMap(assetsRaw);
        }
    }
});

