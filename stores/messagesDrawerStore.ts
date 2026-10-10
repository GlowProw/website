import {defineStore} from 'pinia'
import {ref} from 'vue'

/**
 * 全局私信侧边抽屉开关
 * Header 的私信按钮与抽屉组件通过它通信，任意位置都可以唤起私信面板
 */
export const useMessagesDrawerStore = defineStore('messagesDrawer', () => {
    const open = ref(false)

    const setOpen = (value: boolean) => {
        open.value = value
    }

    return {open, setOpen}
})
