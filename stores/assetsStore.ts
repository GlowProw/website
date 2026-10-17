import {defineStore} from "pinia";

let cachedNpcsMap: any = null;
let cachedRaritysMap: any = null;
// 地图图标静态资源缓存
let cachedMapImagesMap: Record<string, string> | null = null;

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
 * 获取地图图标映射字典
 * 集中加载与全局单例缓存，避免各个组件模块重复执行 glob 扫描
 */
function getMapImagesMap(): Record<string, string> {
    if (!cachedMapImagesMap) {
        // @ts-ignore
        const mapImages = import.meta.glob('/src/assets/images/map/*.*', { eager: true });
        cachedMapImagesMap = serializationMap(mapImages);
    }
    return cachedMapImagesMap;
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

        /**
         * 获取地图静态图标字典
         */
        getMapImages() {
            return getMapImagesMap();
        },

        serializationMap(assetsRaw: any) {
            return serializationMap(assetsRaw);
        }
    }
});

