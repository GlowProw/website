import { ref, onMounted, onUnmounted, watch } from 'vue';

/**
 * 解析实际的 DOM 元素（支持原生 DOM 及 Vue 组件 ref 的 $el）
 * @param target 目标对象
 */
function resolveElement(target: any): Element | null {
    if (!target) return null;
    if (typeof Element !== 'undefined' && target instanceof Element) return target;
    if (target.$el && typeof Element !== 'undefined' && target.$el instanceof Element) return target.$el;
    return null;
}

/**
 * 交叉观察器 Hook (用于检测元素是否进入视口)
 * @param options IntersectionObserver 配置项
 */
export function useIntersectionObserver(options = {}) {
    const targetElement = ref<any>(null)
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

    watch(targetElement, (newEl, oldEl) => {
        const oldDom = resolveElement(oldEl);
        if (oldDom) {
            observer.unobserve(oldDom)
        }
        const newDom = resolveElement(newEl);
        if (newDom) {
            observer.observe(newDom)
        }
    })

    onMounted(() => {
        const dom = resolveElement(targetElement.value);
        if (dom) {
            observer.observe(dom)
        }
    })

    onUnmounted(() => {
        const dom = resolveElement(targetElement.value);
        if (dom) {
            observer.unobserve(dom)
        }
        observer.disconnect()
    })

    return { targetElement, isVisible };
}
