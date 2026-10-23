import {defineStore} from 'pinia'
import {ref} from 'vue'

/**
 * 全局游览历史侧边抽屉开关
 * Header 的浏览记录按钮、抽屉组件与全局快捷键通过它共享开合状态
 */
export const useCodexHistoryDrawerStore = defineStore('codexHistoryDrawer', () => {
    const open = ref(false)

    const setOpen = (value: boolean) => {
        open.value = value
    }

    return {open, setOpen}
})
