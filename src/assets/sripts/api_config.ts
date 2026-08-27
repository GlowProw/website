/**
 * 全局配置项
 */

export default class Api_config {
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
                "host": "api.glow-prow.top",
                "port": "",
                "wsPort": "",
                "pathname": "/api/",
                "wsPathname": "/ws",
            },
            "test": {
                "protocol": "https",
                "wsProtocol": "wss",
                "host": "api.glow-prow.top",
                "port": "3000",
                "wsPort": "3001",
                "pathname": "/api/",
                "wsPathname": "/ws",
            }
        }
    };

    /**
     * 获取配置对象
     */
    get getConf() {
        return this.CONF;
    }
}
