import {http} from "./index.ts";

export default class Ws {
    constructor() {
        return new WebSocket(`ws://${http.host}:3001`)
    }
}
