export default class RulesUser {
    static username = [
        v => !!v || '必须填写用户名ID',
        v => {
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
            return !illegalNames.includes(trimmed) || '非法名称，请尝试使用其他';
        },
        v => (v && v.length >= 3 && v.length <= 40) || '长度3-40',
        v => new RegExp(/^[a-zA-Z0-9_]+$/).test(v) || '用户名ID格式不正确',
    ]
    static alternativeName = [
        v => !v || (v && v.length >= 3 && v.length <= 40) || '长度3-40',
        v => !v || new RegExp(/^[a-zA-Z0-9_]+$/).test(v) || '账户名称格式不正确',
    ]
    static email = [
        v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || '邮箱格式不正确'
    ]
    static password = [
        v => !!v || '必须填写密码',
        v => (v && v.length >= 6 && v.length <= 60) || '长度6-60',
    ]
    static captcha = [
        v => !!v || '必须填写验证码',
        v => (v && v.length == 4) || '长度4',
    ]
}
