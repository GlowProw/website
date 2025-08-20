"use strict";
import jwt from 'jsonwebtoken';
import config from "../../config";
import bcrypt from "bcryptjs";

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

function userHasNotRoles(user: any, roles: any[]) {
    if(roles[0] == '*')
        return false;
    if(user && user.privilege) {
        const privilege = Array.isArray(user.privilege)? user.privilege : user.privilege.split(',');
        for(let i of privilege)
            if(roles.includes(i))
                return false;
    }
    return true;
}

/**
 * 允许 Privileges
 * as long as the user has one allowed role, then allow
 * @param roles
 */
function allowPrivileges(roles: any[] = []) {
    return function (req: any, res: any, next: any) {
        const userRoles: any[] = req.user.privilege;
        for (let i of userRoles)
            if (roles.includes(i))
                return next();
        return res.status(403).json({error: 1, code: 'user.permissionDenined'});
    }
}

/**
 * 拒绝 Privileges
 * as long as the user has one forbidden role, then forbid
 * @param roles
 */
function forbidPrivileges(roles: any[] = []) {
    return function (req: any, res: any, next: any) {
        const userRoles: any[] = req.user.privilege;
        for (let i of userRoles)
            if (roles.includes(i))
                return res.status(403).json({error: 1, code: 'user.permissionDenined'});
        return next();
    }
}

async function generatePassword(passwd: string) {
    return await bcrypt.hash(passwd, 10);
}

/** @param {string} passwd @param {string} hash
 * @param hash
 */
async function comparePassword(passwd: string, hash: any) {
    return await bcrypt.compare(passwd, hash);
}

export {
    verifyJWTToken,
    userHasRoles,
    userHasNotRoles,
    allowPrivileges,
    forbidPrivileges,
    generatePassword,
    comparePassword
}
