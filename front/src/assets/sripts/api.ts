/**
 * api url
 */

export default class Api {
    constructor() {
        return {
            "account_login": "login",
            "account_register": "register",
            "captcha": "captcha",

            "teamups": "teamups",
            "teamup_statistics": "teamup/statistics",

            "assembly_publish": "assembly/publish",
            "assembly_item": "assembly/item",
            "assembly_list": "assembly/list",
            "assembly_edit": "assembly/edit",
            "assembly_delete": "assembly/delete",
        };
    }
}
