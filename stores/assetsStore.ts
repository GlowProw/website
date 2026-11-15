import {defineStore} from "pinia";
import {Enemies, EnemyTypes, MapLocations, Npcs} from "glow-prow-data";
import {useCDNAssetsServiceStore} from "~/stores/cdnAssetsStore";

let cachedRaritysMap: any = null;
// 地图图标静态资源缓存
let cachedMapImagesMap: Record<string, string> | null = null;
// NPC 图标依赖当前 CDN 服务，按服务名缓存
let cachedNpcsMap: Record<string, string> | null = null;
let cachedNpcsService: string | null = null;
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

/**
 * NPC 图标统一使用 CDN 资源服务加载，使用 glow-prow-data 包中的 Npcs 实体定义
 * 同时映射 key 与 id，兼容不同组件的查找方式
 */
function getNpcsMap(): Record<string, string> {
    const imageMap: Record<string, string> = {};
    let cdnStore;
    try {
        cdnStore = useCDNAssetsServiceStore();
    } catch (e) {
        // 无激活的 pinia 实例时（例如纯工具脚本）直接跳过
        return imageMap;
    }

    // 切换 CDN 服务后需要重新生成 URL，因此按服务名 + NPC 总数缓存
    const service = String(cdnStore.selectedService || '');
    const npcCount = Object.keys(Npcs).length;
    const npcsCacheKey = `${service}|${npcCount}`;
    if (cachedNpcsMap && cachedNpcsService === npcsCacheKey) {
        return cachedNpcsMap;
    }

    for (const [key, npc] of Object.entries(Npcs)) {
        const iconId = (npc as any)?.id || key;
        const url = cdnStore.currentService.image.url({
            'glow-prow': {id: iconId, category: 'npcs'},
            'glow-prow-zh-cn': {id: iconId, category: 'npcs'},
            'local-test': {id: iconId, category: 'npcs'},
        });
        imageMap[key] = url;
        if (iconId && iconId !== key) {
            imageMap[iconId] = url;
        }
    }

    // 注册默认兜底占位图
    const placeholderUrl = cdnStore.currentService.image.url({
        'glow-prow': {id: 'npcPlaceholder', category: 'npcs'},
        'glow-prow-zh-cn': {id: 'npcPlaceholder', category: 'npcs'},
        'local-test': {id: 'npcPlaceholder', category: 'npcs'},
    });
    imageMap['default'] = placeholderUrl;
    imageMap['npcPlaceholder'] = placeholderUrl;

    cachedNpcsService = npcsCacheKey;
    cachedNpcsMap = imageMap;
    return imageMap;
}

function getRaritysMap() {
    if (!cachedRaritysMap) {
        // @ts-ignore
        const rarityImages = import.meta.glob('@/assets/images/item-rarity-*.webp', { eager: true });
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

    // 切换 CDN 服务后需要重新生成 URL，因此按服务名 + 敌人总数缓存
    const service = String(cdnStore.selectedService || '');
    const enemyCount = Object.keys(Enemies).length;
    const enemiesCacheKey = `${service}|${enemyCount}`;
    if (cachedEnemyImagesMap && cachedEnemyImagesService === enemiesCacheKey) {
        return cachedEnemyImagesMap;
    }

    const iconKeys = new Set<string>();
    for (const enemy of Object.values(Enemies)) {
        if (enemy.icon) iconKeys.add(enemy.icon);
    }
    // 地图坐标回退到类型图标时，也把它们纳入映射
    // 注意：图层面板按 category（如 eliteWarship）取图，这里必须同时登记分类名，
    // 否则 icons[category] 为空会回退到 default.webp（叶子占位图）
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

    cachedEnemyImagesService = enemiesCacheKey;
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

    // 合并缓存 key 与敌人/NPC 图标缓存保持一致（服务名 + 敌人总数 + 地图坐标总数 + NPC总数），
    // 避免新增敌人/坐标/NPC 后缓存不失效导致图标缺失
    const enemyCount = Object.keys(Enemies).length;
    const locationCount = Object.keys(MapLocations).length;
    const npcCount = Object.keys(Npcs).length;
    const mergedCacheKey = `${service}|${enemyCount}|${locationCount}|${npcCount}`;
    if (cachedMergedMapImagesMap && cachedMergedMapImagesService === mergedCacheKey) {
        return cachedMergedMapImagesMap;
    }

    // 优先级：本地地图静态图标 > 敌人/领域首领图标 > NPC图标
    // 确保同名（如 liTianNing 既是领域首领又是NPC）时首领图标优先，且 default 地图默认图标不被 NPC 占位图篡改
    cachedMergedMapImagesMap = {...getNpcsMap(), ...getEnemyImagesMap(), ...cachedMapImagesMap};
    cachedMergedMapImagesService = mergedCacheKey;
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

