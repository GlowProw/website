/**
 * Config file
 */

export default class Config {
    static NODE: {};
    CONF = {
        "requestDevelopmentName": "development",
        "requestProductionName": "production",
        "requestTestName": "test",
        "child": {
            "development": {
                "protocol": "http",
                "wsProtocol": "ws",
                "host": "localhost",
                "port": "3000",
                "wsPort": "3001",
                "pathname": "/api/",
                "wsPathname": "",
            },
            "production": {
                "protocol": "https",
                "wsProtocol": "wss",
                "host": "snb-tool-api.cabbagelol.net",
                "port": "",
                "wsPort": "",
                "pathname": "/api/",
                "wsPathname": "/ws",
            },
            "test": {
                "protocol": "https",
                "wsProtocol": "wss",
                "host": "snb-tool-api.cabbagelol.net",
                "port": "3000",
                "wsPort": "3001",
                "pathname": "/api/",
                "wsPathname": "/ws",
            }
        }
    };


    // 初始配置
    async initConf() {
        let confs = await import('@/../public/config/requestConf.json');
        this.CONF = Object.assign(
            this.CONF,
            {...confs}
        );
        return this.CONF;
    }

    get getConf() {
        return this.CONF;
    }
}
