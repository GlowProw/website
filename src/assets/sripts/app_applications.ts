import {getCurrentLang} from "@/config/languages";

/**
 * 主程序扩展套件
 */
export default class AppApps {
    get list() {
        const lang = getCurrentLang();

        return [
            {
                id: 'qqBot',
                tags: ['bot', 'qq'],
                to: `/${lang}/apps/qq-bot`
            },
            {
                id: 'apiDocs',
                tags: ['api', 'openapi', 'scalar', 'rest-api'],
                to: `/${lang}/apps/api-docs`
            }
        ]
    }

    /**
     * 根据应用 ID 获取应用数据
     * @param id 应用 ID
     */
    getAppData(id: string): any {
        return this.list.find((item) => item.id === id)
    }
}
