const config = {
    __DEBUG__: true,                                            // 生产环境必须设置为false
    logLevel: 3,                                                // 日志等级

    secret: 'you secret',

    captchaExpiresIn: 1000 * 60 * 20,
    userTokenExpiresIn: 1000 * 60 * 60 * 24 * 7,
    errorHelperVerbose: true,
    port: 3000,                                                 // 端口
    address: '127.0.0.1',                                       // 服务地址

    // 数据库配装
    mysql: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'you sql password',
        database: 'you sql database name'
    },

    // 多语言
    i18n: {
        defaultLocale: 'zh_CN',
        locales: ['zh_CN', 'en_US'],
        // 翻译数据从此处远程获取，并会将缓存本地
        // 每次启动程序都会必然执行一次
        serverUrl: 'http://raw.githubusercontent.com/GlowProw/glow-prow-data-languages/refs/heads/main'
    }
}

export default config;
