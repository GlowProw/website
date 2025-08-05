const assemblyAttributes: any = {
    "password": {
        type: "string",
        get: false,
        set: true,
        default: "",
    },
    "backgroundPresentation": {
        type: "string",
        get: true,
        set: true,
        default: "",
    },
    "externalLinks": {
        type: "object",
        get: true,
        set: true,
        default: {
            "bilibili": "",
            "youtube": ""
        },
    },
    "assemblyUseVersion": {type: "string", get: true, set: true, default: ''},
    "language": {type: "array", get: true, set: true, isprivate: true, default: ['zh-CN']},
}

function assemblyShowAttributes(attr: any, showprivate: boolean = false, force: boolean = false) {
    const result: any = {};
    for (let i of Object.keys(assemblyAttributes))
        if ((assemblyAttributes[i].get && showprivate | (!assemblyAttributes[i].isprivate)) || force)
            result[i] = assemblyAttributes[i].handleValue ? assemblyAttributes[i].handleValue(attr[i], 'show') : attr[i];
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
