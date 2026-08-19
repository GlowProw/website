import { ref, onMounted, onUnmounted } from 'vue';

/**
 * 交叉观察器 Hook (用于检测元素是否进入视口)
 * @param options IntersectionObserver 配置项
 */
export function useIntersectionObserver(options = {}) {
    const targetElement = ref(null)
    const isVisible = ref(false)

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                isVisible.value = entry.isIntersecting;
            })
        },
        {
            threshold: 0.1,
            rootMargin: '0px',
            ...options, // 允许自定义配置
        })


    onMounted(() => {
        if (targetElement.value) {
            observer.observe(targetElement.value)
        }
    })

    onUnmounted(() => {
        if (targetElement.value) {
            observer.unobserve(targetElement.value)
        }
        observer.disconnect()
    })

    return { targetElement, isVisible };
}
