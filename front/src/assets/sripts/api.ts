/**
 * api url
 */

export default class Api {
    constructor() {
        return {
            "account_login": "login",
            "account_register": "register",
            "captcha": "captcha",

            "user": "comments",

            "teamups": "teamups",
            "teamup_statistics": "teamup/statistics",

            "assembly_publish": "assembly/publish",
            "assembly_item": "assembly/item",
            "assembly_list": "assembly/list",
            "assembly_edit": "assembly/edit",
            "assembly_delete": "assembly/delete",

            "comment": "comment",
            "comments": "comment/comments",
            "comment_reply": "comment/reply",
            "comment_edit": "comment/edit",
            "comment_replies": "comment/replies",
            "comment_delete": "comment/delete"
        };
    }
}
