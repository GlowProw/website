"use strict";
import {sanitizeRichText} from "./content"
import {validationResult} from "express-validator";
import db from "../../mysql";
import {getGravatarAvatar} from "./gravatar";
import {userHasRoles} from "./auth";

const userAttributes: any = {
        "avatar": {type: "string", get: true, set: false, default: ''},
        "changeNameLeft": {type: "number", get: true, set: false, isPrivate: true, default: 3},
        "freezeOfNoBinding": {type: "boolean", get: true, set: false, default: false},
        "introduction": {
            type: "string",
            get: true,
            set: true,
            default: '',
            handleValue: (value: any) => value ? sanitizeRichText(value.slice(0, 1000)) : ''
        },
        "language": {type: "string", get: true, set: true, isPrivate: true, default: 'en-US'},
        "mute": {type: "string", get: true, set: true, default: ''},
        "lastSigninIP": {type: "string", get: false, set: false, default: ''},
        "registerIP": {type: "string", get: false, set: false, default: ''},
    },
    USERNAME_REGULAR = /^[a-zA-Z0-9_]+$/,
    USERNAME_MIN_LENGTH = 3,
    USERNAME_MAX_LENGTH = 40,
    PASSWORD_MIN_LENGTH = 6,
    PASSWORD_MAX_LENGTH = 60

function userShowAttributes(attr: any, showPrivate = false, force = false) {
    const result: any = {};
    for (let i of Object.keys(userAttributes)) {
        if ((userAttributes[i].get && (showPrivate || !userAttributes[i].isPrivate)) || force) {
            result[i] = userAttributes[i].handleValue ? userAttributes[i].handleValue(attr[i], 'show') : attr[i];
        }
    }
    return result;
}

function userSetAttributes(org: any, attr: any, force = false) {
    let result = org;
    for (let i of Object.keys(userAttributes))
        if (typeof (attr[i]) == userAttributes[i].type && (userAttributes[i].set || force))
            result[i] = userAttributes[i].handleValue ? userAttributes[i].handleValue(attr[i], 'set') : attr[i];
    return result;
}

function userDefaultAttribute(registerIP = '', language?: string | undefined) {
    const result: any = {};
    for (let i of Object.keys(userAttributes))
        result[i] = userAttributes[i].default;
    result.registerIP = registerIP;
    result.language = language;
    return result;
}

async function showUserInfo(req: any, res: any, next: any) {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'userInfo.bad', message: validateErr.array()});

        const isLogin = req.user;
        const user = await db.from('users').where({id: req.query && req.query.id || req.user && req.user.id, valid: 1}).first();
        if (!user)
            return res.status(404).json({error: 1, code: 'userInfo.notFound', message: 'no such user.'});

        let data = {
            id: user.id,
            userAvatar: user.email ? getGravatarAvatar(user.email) : null,
            privilege: user.privilege,
            joinTime: user.createTime,
            lastOnlineTime: user.updateTime,
            attr: userShowAttributes(user.attr,
                (req.user && req.user.id === user.id), // self, show private info
                (req.user && userHasRoles(req.user, ['admin', 'super', 'root', 'dev']))), // no limit for admin
        };

        if (isLogin) {
            data = Object.assign(data, {
                username: user.username,
                alternativeName: user.alternativeName,
                email: req.user ? user.email : null,
            })
        } else {
            data = Object.assign(data, {
                username: user.alternativeName || user.username,
            })
        }

        return res.status(200)
            .setHeader('Cache-Control', 'public, max-age=60')
            .json({
                success: 1,
                code: 'userInfo.success',
                data: data
            });
    } catch (err) {
        next(err);
    }
}

export {
    userAttributes,
    userSetAttributes,
    userShowAttributes,
    userDefaultAttribute,
    showUserInfo,

    USERNAME_REGULAR,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH
}
