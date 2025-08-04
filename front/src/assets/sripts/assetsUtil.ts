export default class AssetsUtil {
    static assetsMap = {};

    // 加载资源地址
    load(urls: []) {
        let assetsMap = {}
        urls.forEach(i => {
            assetsMap = {
                ...assetsMap,
                ...import.meta.glob(i, {eager: true})
            }
        })

        for (const path in assetsMap) {
            const key = path.split('/').pop()
                ?.toString()
                .replace('.webp', '')
                .replace('.png', '');
            this.assetsMap[key] = assetsMap[path];
        }

        return this.assetsMap;
    }
}
