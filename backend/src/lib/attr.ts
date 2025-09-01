"use strict";
import config from "../../config";

const assemblyAttributes: any = {
        "password": {
            type: "string",
            get: false,
            set: true,
            isPrivate: true,
            default: "",
        },
        "backgroundPresentation": {
            type: "string",
            get: true,
            set: true,
            isPrivate: false,
            default: "",
        },
        "externalLinks": {
            type: "object",
            get: true,
            set: true,
            isPrivate: false,
            default: {
                "bilibili": "",
                "youtube": ""
            },
        },
        "isShowItemName": {type: "boolean", get: true, set: true, isPrivate: false, default: false},
        "isAnonymous": {type: "boolean", get: true, set: true, isPrivate: false, default: false},
        "isComment": {type: "boolean", get: true, set: true, isPrivate: false, default: true},
        "isLike": {type: "boolean", get: true, set: true, isPrivate: false, default: true},
        "assemblyUseVersion": {type: "string", get: true, set: true, isPrivate: false, default: '0.0.1'},
        "language": {type: "array", get: true, set: true, isPrivate: false, default: [config.i18n.defaultLocale]},
    },
    wheelAttributes: any = {
        "language": {type: "array", get: true, set: true, isPrivate: false, default: [config.i18n.defaultLocale]},
        "wheelUseVersion": {type: "string", get: true, set: true, isPrivate: false, default: '0.0.1'},
    },
    warehouseAttributes: any = {
        "language": {type: "array", get: true, set: true, isPrivate: false, default: [config.i18n.defaultLocale]},
        "warehouseUseVersion": {type: "string", get: true, set: true, isPrivate: false, default: '0.0.1'},
    }

interface showOptions {
    showPrivate?: boolean;
    force?: boolean;
    includeDefaults?: boolean;
    transformHandlers?: Record<string, (value: any) => any>;
}

function showAttributes(
    attr: Record<string, any>,
    options: showOptions = {},
    d: any
): Record<string, any> {
    const {
        showPrivate = false,
        force = false,
        includeDefaults = false,
        transformHandlers = {}
    } = options;

    const result: Record<string, any> = {};

    for (const key of Object.keys(d)) {
        const config = d[key];

        // 检查是否应该包含此属性
        const shouldInclude = force || (config.get && (showPrivate || !config.isPrivate));

        if (shouldInclude) {
            // 获取值，如果不存在则使用默认值（如果includeDefaults为true）
            let value = attr[key] !== undefined ? attr[key] : (includeDefaults ? config.default : undefined);

            if (value !== undefined) {
                // 应用转换
                if (transformHandlers[key]) {
                    value = transformHandlers[key](value);
                } else if (config.handleValue) {
                    value = config.handleValue(value, 'show');
                }

                result[key] = value;
            }
        }
    }

    return result;
}

function setAttributes(orgRaw: any, attrRaw: any, force: boolean = false, d: any) {
    let result: any = orgRaw || {},
        attr: any = attrRaw || {};
    for (let i of Object.keys(d))
        if (typeof (attr[i]) == d[i].type && (d[i].set || force))
            result[i] = d[i].handleValue ? d[i].handleValue(attr[i], 'set') : attr[i];
    return result;
}

export default {
    assemblyAttributes,
    wheelAttributes,
    assemblySetAttributes: function (org: any, attr: any, force: boolean) {
        return setAttributes(org, attr, force, assemblyAttributes)
    },
    assemblyShowAttributes: function (attr: any, options: showOptions = {}) {
        return showAttributes(attr, options, assemblyAttributes)
    },
    wheelSetAttributes: function (org: any, attr: any, force: any) {
        return setAttributes(org, attr, force, wheelAttributes)
    },
    wheelShowAttributes: function (org: any, options: showOptions = {}) {
        return showAttributes(org, options, wheelAttributes)
    },
    warehouseSetAttributes: function (org: any, attr: any, force: any) {
        return setAttributes(org, attr, force, warehouseAttributes)
    },
    warehouseShowAttributes: function (org: any, options: showOptions = {}) {
        return showAttributes(org, options, warehouseAttributes)
    },
}
