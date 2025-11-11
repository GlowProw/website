import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useI18nStore = defineStore('i18n', () => {
    const useRemoteTranslations = ref(true)

    return {
        useRemoteTranslations: computed(() => useRemoteTranslations.value),
    }
})
