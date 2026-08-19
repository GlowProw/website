/**
 * 主程序扩展套件
 */
export default class AppApps {
    list = [
        {
            id: 'qqBot',
            tags: ['bot', 'qq'],
            to: '/apps/qq-bot'
        }
    ]

    /**
     * 根据应用 ID 获取应用数据
     * @param id 应用 ID
     */
    getAppData(id: string): any {
        return this.list.find((item) => item.id === id)
    }
}
