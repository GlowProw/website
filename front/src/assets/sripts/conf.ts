/**
 * Conf file
 */

export default class Conf {
    CONF = {
        "requestDevelopmentName": "test",
        "requestProductionName": "production",
        "child": {
            "development": {
                "protocol": "http",
                "host": "localhost",
                "port": "3000",
                "pathname": "/api/"
            },
            "production": {
                "protocol": "http",
                "host": "snb-tool.api.cabbagelol.net",
                "port": "3000",
                "pathname": "/api/"
            },
            "test":{
                "protocol": "http",
                "host": "snb-tool.api.cabbagelol.net",
                "port": "3000",
                "pathname": "/api/"
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
