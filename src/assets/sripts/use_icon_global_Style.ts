import type {Ref} from 'vue';
import {computed, unref} from 'vue';
import {useAppStore} from '~/stores/appStore';

type MaybeRefOrGetter<T> = Ref<T> | (() => T) | T;

/**
 * 解析 Ref、Getter 函数或原始值
 */
function resolveValue<T>(val: MaybeRefOrGetter<T>): T {
    return (typeof val === 'function' ? (val as any)() : unref(val)) as T;
}

/**
 * 全局图标样式控制 Hook
 */
export function use_icon_global_Style() {
    const appStore = useAppStore();

    /**
     * 图标自适应尺寸计算
     */
    const useIconAdaptiveSize = (propsSize: MaybeRefOrGetter<number | string | undefined>, defaultSize: number = 80, opt = {isOffset: false}) => {
        return computed(() => {
            const globalSize = appStore.iconSize?.size || 99;
            const offset = globalSize - 99;

            const currentSize = resolveValue(propsSize) === undefined ? defaultSize : resolveValue(propsSize);
            const baseStr = String(currentSize).trim();
            const isPx = baseStr.endsWith('px');
            const numVal = parseFloat(baseStr);

            if (isNaN(numVal)) {
                return currentSize;
            }

            let targetSize = numVal + <number>(opt.isOffset ? offset : 0);
            targetSize = Math.max(numVal - 10, Math.min(numVal + 10, targetSize));
            targetSize = Math.max(25, Math.min(150, targetSize));

            return isPx ? `${targetSize}px` : targetSize;
        });
    };

    /**
     * 图标外框容器內边距（Padding）计算
     */
    const useIconBoxPadding = (propsPadding: MaybeRefOrGetter<number | string | undefined>, defaultPadding: number | string = 1) => {
        return computed(() => {
            if (appStore.iconSize?.box?.padding !== undefined) return appStore.iconSize.box.padding;
            const val = resolveValue(propsPadding);
            return val !== undefined ? val : defaultPadding;
        });
    };

    /**
     * 图标外框容器外边距（Margin）计算
     */
    const useIconBoxMargin = (propsMargin: MaybeRefOrGetter<number | string | undefined>, defaultMargin: number | string = 1) => {
        return computed(() => {
            if (appStore.iconSize?.box?.margin !== undefined) return appStore.iconSize.box.margin;
            const val = resolveValue(propsMargin);
            return val !== undefined ? val : defaultMargin;
        });
    };

    /**
     * 图标图片內边距（Padding）计算
     */
    const useIconImagePadding = (propsPadding: MaybeRefOrGetter<number | undefined>, defaultPadding: number = 0) => {
        return computed(() => {
            if (appStore.iconSize?.icon?.padding !== undefined) return appStore.iconSize.icon.padding;
            const val = resolveValue(propsPadding);
            return val !== undefined ? val : defaultPadding;
        });
    };

    /**
     * 图标图片外边距（Margin）计算
     */
    const useIconImageMargin = (propsMargin: MaybeRefOrGetter<number | undefined>, defaultMargin: number = 1) => {
        return computed(() => {
            if (appStore.iconSize?.icon?.margin !== undefined) return appStore.iconSize.icon.margin;
            const val = resolveValue(propsMargin);
            return val !== undefined ? val : defaultMargin;
        });
    };

    return {
        useIconAdaptiveSize,
        useIconBoxPadding,
        useIconBoxMargin,
        useIconImagePadding,
        useIconImageMargin,
    };
}
