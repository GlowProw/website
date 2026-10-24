/**
 * 快捷键触发方式：按下立即触发或按住蓄力触发
 */
export type HotkeyMode = "press" | "hold";

/**
 * 快捷键可生效的地点
 */
export type HotkeyLocation =
    | "workshop"
    | "codexList"
    | "codexDetail"
    | "codexCard"
    | "codexModification"
    | "quest"
    | "overlayCard"
    | "codexHistory"
    | "globalSearch"
    | "messages"
    | "map"
    | "calculator"
    | "smugglers"
    | "teamup"
    | "account"
    | "statistics"
    | "calendar"
    | "contextMenu"
    | "global";

/**
 * 快捷键动作所属分组
 */
export type HotkeyCategory =
    | "workshop"
    | "codex"
    | "global"
    | "map"
    | "calculator"
    | "smugglers"
    | "teamup"
    | "account"
    | "statistics"
    | "calendar";

/**
 * 快捷键动作定义
 */
export interface HotkeyItem {
    /**
     * 动作唯一标识
     */
    id: string;
    /**
     * 动作名称多语言键
     */
    nameKey: string;
    /**
     * 动作描述多语言键
     */
    descriptionKey: string;
    /**
     * 动作所属类别
     */
    category: HotkeyCategory;
    /**
     * 类别名称多语言键
     */
    categoryKey: string;
    /**
     * 快捷键可生效的地点清单
     */
    locations: HotkeyLocation[];
    /**
     * 默认按键
     */
    defaultKey: string;
    /**
     * 当前生效按键
     */
    currentKey: string;
    /**
     * 当前触发方式
     */
    mode: HotkeyMode;
    /**
     * 默认触发方式
     */
    defaultMode: HotkeyMode;
}

/**
 * 本地保存的快捷键配置
 */
export interface PersistedHotkey {
    /**
     * 按键
     */
    key: string;
    /**
     * 触发方式
     */
    mode: HotkeyMode;
}
