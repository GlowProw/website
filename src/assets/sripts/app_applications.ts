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

    getAppData(id: string): any {
        return this.list.find((item) => item.id === id)
    }
}
