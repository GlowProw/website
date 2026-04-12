import type {Ref} from 'vue';
import {computed, unref} from 'vue';
import {useAppStore} from '~/stores/appStore';

type MaybeRefOrGetter<T> = Ref<T> | (() => T) | T;

function resolveValue<T>(val: MaybeRefOrGetter<T>): T {
    return (typeof val === 'function' ? (val as any)() : unref(val)) as T;
}

export function useIconGlobalStyle() {
    const appStore = useAppStore();

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

    const useIconBoxPadding = (propsPadding: MaybeRefOrGetter<number | string | undefined>, defaultPadding: number | string = 1) => {
        return computed(() => {
            if (appStore.iconSize?.box?.padding !== undefined) return appStore.iconSize.box.padding;
            const val = resolveValue(propsPadding);
            return val !== undefined ? val : defaultPadding;
        });
    };

    const useIconBoxMargin = (propsMargin: MaybeRefOrGetter<number | string | undefined>, defaultMargin: number | string = 1) => {
        return computed(() => {
            if (appStore.iconSize?.box?.margin !== undefined) return appStore.iconSize.box.margin;
            const val = resolveValue(propsMargin);
            return val !== undefined ? val : defaultMargin;
        });
    };

    const useIconImagePadding = (propsPadding: MaybeRefOrGetter<number | undefined>, defaultPadding: number = 0) => {
        return computed(() => {
            if (appStore.iconSize?.icon?.padding !== undefined) return appStore.iconSize.icon.padding;
            const val = resolveValue(propsPadding);
            return val !== undefined ? val : defaultPadding;
        });
    };

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
