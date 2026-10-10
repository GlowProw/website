/**
 * 应用基础相关类型定义
 */
import type {Ref} from "vue";

export type OperatingSystem =
    | 'Android'
    | 'iOS'
    | 'Windows'
    | 'MacOS'
    | 'Linux'
    | 'unknown'

export interface CodexNavItem {
    type?: 'item' | 'divider';
    title?: string;
    value?: string;
    to?: string;
    prependIcon?: string;
    appendIcon?: string;
    badge?: string;
    variant?: any;
    class?: string;
    slim?: boolean;
}

export type ServiceProviderType = 'openSource' | 'techSupport'

export interface ServiceProviderItem {
    type: ServiceProviderType | string
    name: string,
    icon: string,
    src: string
}

export interface UseFullscreenReturn {
    isFullscreen: Ref<boolean>
    enterFullscreen: (element?: Element) => Promise<void>
    exitFullscreen: () => Promise<void>
    toggleFullscreen: (element?: Element) => Promise<void>
    isSupported: Ref<boolean>
}

export type MaybeRefOrGetter<T> = Ref<T> | (() => T) | T;

export interface SearchItem {
  title: string;
  value: string;
  node?: any;
}
