/**
 * Conf file
 */

export default class Conf {
    CONF = {
        "requestDevelopmentName": "production",
        "requestProductionName": "production",
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
                "protocol": "http",
                "wsProtocol": "wss",
                "host": "snb-tool.api.cabbagelol.net",
                "port": "3000",
                "wsPort": "3001",
                "pathname": "/api/",
                "wsPathname": "/ws/",
            },
            "test": {
                "protocol": "http",
                "wsProtocol": "ws",
                "host": "snb-tool.api.cabbagelol.net",
                "port": "3000",
                "wsPort": "3001",
                "pathname": "/api/",
                "wsPathname": "",
            }
        }
    };


    // 初始配置
    async initConf() {
        let confs = await import('../../../public/config/requestConf.json');
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
