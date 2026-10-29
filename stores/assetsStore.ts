import {defineStore} from "pinia";
import {Enemies, EnemyTypes, MapLocations} from "glow-prow-data";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

let cachedNpcsMap: any = null;
let cachedRaritysMap: any = null;
// 地图图标静态资源缓存
let cachedMapImagesMap: Record<string, string> | null = null;
// 敌人图标依赖当前 CDN 服务，按服务名缓存
let cachedEnemyImagesMap: Record<string, string> | null = null;
let cachedEnemyImagesService: string | null = null;
// 合并后的地图图标字典缓存，避免每个地图组件挂载时重复展开
let cachedMergedMapImagesMap: Record<string, string> | null = null;
let cachedMergedMapImagesService: string | null = null;

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
 * 敌人图标不再打包进产物，统一从 CDN 按敌人 id / 类型取图
 * 只保留数据里真实存在的图标 key，避免请求不存在的资源
 */
function getEnemyImagesMap(): Record<string, string> {
    const imageMap: Record<string, string> = {};
    let cdnStore;
    try {
        cdnStore = useCDNAssetsServiceStore();
    } catch (e) {
        // 无激活的 pinia 实例时（例如纯工具脚本）直接跳过
        return imageMap;
    }

    // 切换 CDN 服务后需要重新生成 URL，因此按服务名缓存
    const service = String(cdnStore.selectedService || '');
    if (cachedEnemyImagesMap && cachedEnemyImagesService === service) {
        return cachedEnemyImagesMap;
    }

    const iconKeys = new Set<string>();
    for (const enemy of Object.values(Enemies)) {
        if (enemy.icon) iconKeys.add(enemy.icon);
    }
    // 地图坐标回退到类型图标时，也把它们纳入映射
    // 注意：图层面板按 category（如 eliteWarship）取图，这里必须同时登记分类名，
    // 否则 icons[category] 为空会回退到 default.png（叶子占位图）
    const enemyTypes = EnemyTypes as readonly string[];
    for (const location of Object.values(MapLocations)) {
        if (location.icon && enemyTypes.includes(location.icon)) iconKeys.add(location.icon);
        if (location.category && enemyTypes.includes(location.category)) iconKeys.add(location.category);
    }

    for (const key of iconKeys) {
        imageMap[key] = cdnStore.currentService.image.url({
            'glow-prow': {id: key, category: 'enemies'},
            'glow-prow-zh-cn': {id: key, category: 'enemies'},
            'local-test': {id: key, category: 'enemies'},
        });
    }

    cachedEnemyImagesService = service;
    cachedEnemyImagesMap = imageMap;
    return imageMap;
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

    let service = '';
    try {
        service = String(useCDNAssetsServiceStore().selectedService || '');
    } catch (e) {
        // 无激活的 pinia 实例时使用静态图标缓存
    }

    if (cachedMergedMapImagesMap && cachedMergedMapImagesService === service) {
        return cachedMergedMapImagesMap;
    }

    cachedMergedMapImagesMap = {...cachedMapImagesMap, ...getEnemyImagesMap()};
    cachedMergedMapImagesService = service;
    return cachedMergedMapImagesMap;
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

