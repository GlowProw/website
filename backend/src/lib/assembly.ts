const assemblyAttributes: any = {
    "password": {
        type: "string",
        get: false,
        set: true,
        isprivate: true,
        default: "",
    },
    "backgroundPresentation": {
        type: "string",
        get: true,
        set: true,
        isprivate: false,
        default: "",
    },
    "externalLinks": {
        type: "object",
        get: true,
        set: true,
        isprivate: false,
        default: {
            "bilibili": "",
            "youtube": ""
        },
    },
    "isShowItemName": {type: "boolean", get: true, set: true, isprivate: false, default: false},
    "isAnonymous": {type: "boolean", get: true, set: true, isprivate: false, default: false},
    "isComment": {type: "boolean", get: true, set: true, isprivate: false, default: true},
    "isLike": {type: "boolean", get: true, set: true, isprivate: false, default: true},
    "assemblyUseVersion": {type: "string", get: true, set: true, isprivate: false, default: ''},
    "language": {type: "array", get: true, set: true, isprivate: false, default: ['zh-CN']},
}

function assemblyShowAttributes(
    attr: Record<string, any>,
    options: {
        showprivate?: boolean;
        force?: boolean;
        includeDefaults?: boolean;
        transformHandlers?: Record<string, (value: any) => any>;
    } = {}
): Record<string, any> {
    const {
        showprivate = false,
        force = false,
        includeDefaults = false,
        transformHandlers = {}
    } = options;

    const result: Record<string, any> = {};

    for (const key of Object.keys(assemblyAttributes)) {
        const config = assemblyAttributes[key];

        // 检查是否应该包含此属性
        const shouldInclude = force || (config.get && (showprivate || !config.isprivate));

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

function assemblySetAttributes(org: any, attr: any, force: boolean = false) {
    let result: any = org;
    for (let i of Object.keys(assemblyAttributes))
        if (typeof (attr[i]) == assemblyAttributes[i].type && (assemblyAttributes[i].set || force))
            result[i] = assemblyAttributes[i].handleValue ? assemblyAttributes[i].handleValue(attr[i], 'set') : attr[i];
    return result;
}

export {
    assemblyAttributes,
    assemblySetAttributes,
    assemblyShowAttributes,
}
