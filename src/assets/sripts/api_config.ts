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
                "mcpLocation": "http://localhost:3002",
            },
            "production": {
                "protocol": "https",
                "wsProtocol": "wss",
                "host": "api.glow-prow.top",
                "port": "",
                "wsPort": "",
                "pathname": "/api/",
                "wsPathname": "/ws",
                "mcpLocation": "https://mcp.glow-prow.top",
            },
            "test": {
                "protocol": "https",
                "wsProtocol": "wss",
                "host": "api.glow-prow.top",
                "port": "3000",
                "wsPort": "3001",
                "pathname": "/api/",
                "wsPathname": "/ws",
                "mcpLocation": "https://mcp.glow-prow.top",
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
