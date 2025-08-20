/**
 * api url
 */

export default class Api {
    constructor() {
        return {

            "captcha": "captcha",

            "account_login": "user/login",
            "account_signup": "user/signup",
            "user_comments": "user/comments",
            "user_assemblys": "user/assemblys",
            "user_likes": "user/likes",
            "user_teamups": "user/teamups",
            "user_me": "user/me",
            "user_info": "user/info",
            "user_changePassword":"user/changePassword",

            "teamups": "teamups",
            "teamup_statistics": "teamup/statistics",

            "assembly_publish": "assembly/publish",
            "assembly_item": "assembly/item",
            "assembly_list": "assembly/list",
            "assembly_edit": "assembly/edit",
            "assembly_delete": "assembly/delete",
            "assembly_attr": "assembly/attr",
            "assembly_attr_edit": "assembly/attr/edit",

            "comment": "comment",
            "comments": "comment/comments",
            "comment_reply": "comment/reply",
            "comment_edit": "comment/edit",
            "comment_replies": "comment/replies",
            "comment_delete": "comment/delete"
        };
    }
}
