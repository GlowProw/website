import {ConfigBase} from "./src/types/config";

const config: ConfigBase = {
    __DEBUG__: true,
    logLevel: 3,
    secret: 'test',
    captchaExpiresIn: 1000 * 60 * 20,
    userTokenExpiresIn: 1000 * 60 * 60 * 24 * 7,
    errorHelperVerbose: true,
    port: 3000,
    address: '',

    // database
    mysql: {
        host: 'localhost',
        port: 3306,
        user: 'test',
        password: 'zsezse',
        database: 'team_up_db'
    },

    // redis
    redis: {
        host: 'localhost',
        port: 6379,
        password: '',
        db: 0
    },

    // i18n
    i18n: {
        defaultLocale: 'zh_CN',
        locales: ['zh_CN', 'en_US'],
        serverUrl: 'https://raw.githubusercontent.com/GlowProw/glow-prow-data-languages/refs/heads/main'
    },

    gravatar: {
        domain: 'https://www.gravatar.com',
    },
}

export default config;
