import {http} from "./index.ts";

export default class Ws {
    WS;

    constructor() {
        const url = `${http.globalUrl.wsProtocol}://${http.host}:${http.globalUrl.wsPort || ''}${http.globalUrl.wsPathname || ''}`;
        console.log(url)
        this.WS = new WebSocket(`${url}`)
        return this;
    }

    get client() {
        return this.WS;
    }
}
