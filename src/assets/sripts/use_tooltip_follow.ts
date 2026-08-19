import {ref} from 'vue';

let globalX = 0;
let globalY = 0;

// 全局静默追踪鼠标位置，获取最新的有效坐标
if (typeof window !== 'undefined') {
    const updateGlobal = (e: MouseEvent | WheelEvent | PointerEvent) => {
        if (e.clientX !== undefined) {
            globalX = e.clientX;
            globalY = e.clientY;
        }
    };
    window.addEventListener('mousemove', updateGlobal, {passive: true, capture: true});
    window.addEventListener('wheel', updateGlobal as EventListener, {passive: true, capture: true});
}

/**
 * 提示框鼠标跟随 Hook
 */
export function useTooltipFollow() {
    // 仅使用局部响应式！防止100+实例同时计算目标位置导致卡顿。
    const tooltipPos = ref({x: 0, y: 0});
    let ticking = false;

    /**
     * 更新提示框坐标位置
     */
    const updatePos = (e: MouseEvent) => {
        globalX = e.clientX;
        globalY = e.clientY;
        tooltipPos.value.x = e.clientX;
        tooltipPos.value.y = e.clientY;
    };

    /**
     * 鼠标移动事件监听（带 rAF 防抖优化）
     */
    const onMouseMove = (e: MouseEvent) => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updatePos(e);
                ticking = false;
            });
            ticking = true;
        }
    };

    /**
     * 鼠标移入事件监听
     */
    const onMouseEnter = (e: MouseEvent) => {
        updatePos(e);
    };

    return {
        tooltipPos,
        onMouseMove,
        onMouseEnter
    };
}
