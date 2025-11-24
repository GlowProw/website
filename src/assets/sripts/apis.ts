/**
 * api url
 */

export default class Apis {
    constructor() {
        return {
            "captcha": "captcha",

            "account_login": "user/login",
            "account_signup": "user/signup",
            "user_comments": "user/comments",
            "user_me_assemblys": "user/me/assemblys",
            "user_space_assemblys": "user/space/assemblys",
            "user_likes": "user/likes",
            "user_me_teamups": "user/me/teamups",
            "user_space_teamups": "user/space/teamups",
            "user_me": "user/me",
            "user_info": "user/info",
            "user_changePassword": "user/changePassword",
            "user_changeAlternativeName": "user/changeAlternativeName",

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
            "comment_delete": "comment/delete",

            "map_collection": "map/collection",
            "map_collections": "map/collections",
            "map_point": "map/point",
            "map_point_nearby": "map/point/nearby"
        };
    }
}
