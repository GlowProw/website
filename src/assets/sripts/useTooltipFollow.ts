import { ref } from 'vue';

let globalX = 0;
let globalY = 0;

// Globally track mouse position silently just to know the last valid coordinate
if (typeof window !== 'undefined') {
    const updateGlobal = (e: MouseEvent | WheelEvent | PointerEvent) => {
        if (e.clientX !== undefined) {
            globalX = e.clientX;
            globalY = e.clientY;
        }
    };
    window.addEventListener('mousemove', updateGlobal, { passive: true, capture: true });
    window.addEventListener('wheel', updateGlobal as EventListener, { passive: true, capture: true });
}

export function useTooltipFollow() {
    // Only local reactivity! Prevents 100+ instances from evaluating target positions simultaneously causing lag.
    const tooltipPos = ref({ x: 0, y: 0 });
    let ticking = false;

    const updatePos = (e: MouseEvent) => {
        globalX = e.clientX;
        globalY = e.clientY;
        tooltipPos.value.x = e.clientX;
        tooltipPos.value.y = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updatePos(e);
                ticking = false;
            });
            ticking = true;
        }
    };

    const onMouseEnter = (e: MouseEvent) => {
        updatePos(e);
    };

    return {
        tooltipPos,
        onMouseMove,
        onMouseEnter
    };
}
