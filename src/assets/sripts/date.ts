/**
 * 时间
 */

export default class Time {
    DATE;

    constructor() {
        this.DATE = new Date()
    }

    get nowTimeStamp() {
        return this.DATE.getTime()
    }

    update() {
        this.DATE = new Date()
        return this
    }

    /**
     * 程序启动时间
     */
    get appStart() {
        return 1541260800000;
    }

    get appStartDate() {
        return new Date(this.appStart)
    }

    /**
     * 计算剩余天数
     * @returns {number | null} 剩余天数，如果不在赛季内则返回 null
     *
     */
    calcRemainingDays(endData: string | number | Date): number | null {
        const endDate = new Date(endData)
        const now = new Date()
        const currentDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate())

        const targetPureDate = new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            endDate.getDate())


        const remainingMs = targetPureDate.getTime() - currentDate.getTime()
        const remainingDays = Math.floor(remainingMs / 86400000)

        return remainingDays >= 0 ? remainingDays : 0;
    }
}
