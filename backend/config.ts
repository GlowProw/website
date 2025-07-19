const config = {
    __DEBUG__: true,

    secret: 'test',
    turnstileSecret: '',

    captchaExpiresIn: 1000 * 60 * 20,
    userTokenExpiresIn: 1000 * 60 * 60 * 24 * 7,
    errorHelperVerbose: true,
    port: '3000',
    address: '',

    // database
    mysql: {
        host: 'localhost',
        port: 3306,
        user: 'test',
        password: 'zsezse',
        database: 'team_up_db'
    },
}

export default config;
