import {useI18n} from "vue-i18n";

/**
 * 验证工具
 */
export function useRules() {
    const {t} = useI18n()

    const username = [
        (v: any) => !!v || t('basic.rules.username.notEmpty'),
        (v: string) => {
            const trimmed = v ? v.trim().toLowerCase() : '';
            const illegalNames = [
                // JavaScript 关键字和保留字
                "null", "undefined", "true", "false", "this", "super", "new", "function", "var", "let", "const",
                "if", "else", "for", "while", "do", "switch", "case", "default", "break", "continue", "return",
                "try", "catch", "finally", "throw", "typeof", "instanceof", "void", "delete", "in", "with",
                "class", "extends", "import", "export", "await", "async", "yield", "debugger", "eval", "arguments",

                // 全局对象和函数
                "window", "document", "console", "alert", "confirm", "prompt", "setTimeout", "setInterval",
                "clearTimeout", "clearInterval", "localStorage", "sessionStorage", "cookie", "navigator",
                "screen", "history", "location", "performance", "XMLHttpRequest", "fetch", "Promise",
                "Array", "Object", "String", "Number", "Boolean", "Date", "Math", "RegExp", "JSON",
                "Error", "TypeError", "ReferenceError", "SyntaxError", "Map", "Set", "WeakMap", "WeakSet",

                // HTML 相关
                "div", "span", "body", "head", "html", "script", "style", "link", "meta", "img", "a", "form",
                "input", "button", "table", "tr", "td", "th", "ul", "ol", "li", "select", "option",

                // 常见框架和库的全局变量
                "$", "jQuery", "Vue", "React", "Angular", "axios", "lodash", "_", "moment", "dayjs",

                // 特殊值和空值
                "", " ", "\t", "\n", "\r",

                // 系统相关
                "admin", "root", "system", "user", "guest", "test", "demo",

                // 其他常见保留名称
                "index", "main", "app", "application", "config", "settings", "options", "data", "value",
                "name", "id", "key", "password", "email", "phone", "userid", "username", "token",
                "api", "endpoint", "url", "uri", "path", "route", "method", "get", "post", "put", "delete",
                "server", "client", "database", "db", "query", "result", "error", "success", "status",
                "version", "build", "release", "debug", "production", "development", "test", "staging",

                // 保留名称
                "admin", "root", "official", "glow-prow", "glow_prow", "glow prow", "glow prow admin"
            ];
            return !illegalNames.includes(trimmed) || t('basic.rules.username.blacklistRestriction', {content: trimmed})
        },
        (v: string | any[]) => (v && v.length >= 3 && v.length <= 40) || t('basic.rules.username.limitationLength', {min: 3, max: 40}),
        (v: string) => new RegExp(/^[a-zA-Z0-9_]+$/).test(v) || t('basic.rules.username.incorrectFormat'),
    ]
    const alternativeName = [
        (v: string | any[]) => !v || (v && v.length >= 3 && v.length <= 40) || t('basic.rules.alternativeName.limitationLength', {min: 3, max: 40}),
        (v: string) => !v || new RegExp(/^[a-zA-Z0-9_]+$/).test(v) || t('basic.rules.alternativeName.incorrectFormat'),
    ]
    const email = [
        (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || t('basic.rules.email.incorrectFormat')
    ]
    const password = [
        (v: any) => !!v || t('basic.rules.password.notEmpty'),
        (v: string | any[]) => (v && v.length >= 6 && v.length <= 60) || t('basic.rules.password.limitationLength', {min: 6, max: 60}),
    ]
    const captcha = [
        (v: any) => !!v || t('basic.rules.captcha.notEmpty'),
        (v: string | any[]) => (v && v.length == 4) || t('basic.rules.captcha.limitationLength', {max: 4}),
    ]

    return {
        username,
        alternativeName,
        email,
        password,
        captcha
    }
}
