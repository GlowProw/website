"use strict";
import jwt from 'jsonwebtoken';
import config from "../../config";

function verifyJWTToken(token: any) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, config.secret, (err: any, decodedToken: any) => {
            if (err || !decodedToken)
                return reject(err);
            return resolve(decodedToken);
        });
    });
}

function userHasRoles(user: any, roles: any[]) {
    if (roles[0] == '*')
        return true;
    if (user && user.privilege) {
        const privilege = Array.isArray(user.privilege) ? user.privilege : user.privilege.split(',');
        for (let i of privilege)
            if (roles.includes(i))
                return true;
    }
    return false;
}

export {
    verifyJWTToken,
    userHasRoles
}
