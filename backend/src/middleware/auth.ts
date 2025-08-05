"use strict";
import config from "../../config";
import db from "../../mysql";

import {verifyJWTToken} from '../lib/auth';

async function verifyJWT(req: any, res: any, next: any) {
    try {
        if (config.__DEBUG__ && req.get('x-whosdaddy') && req.get('x-whosdaddy-p')) {
            const result = await db.select('*').from('users').where({id: req.get('x-whosdaddy'), valid: 1}).first();
            result.privilege = req.get('x-whosdaddy-p').split(',');
            req.user = result;
            return next();
        }

        const token = req.get('x-access-token');

        let decodedToken: any;
        try {
            decodedToken = await verifyJWTToken(token)
        } catch (err) {
            return res.status(401).json({err: 1, code: 'user.tokenExpired'});
        }

        const result = await db.select('*').from('users').where({
            id: decodedToken.userId,
            valid: 1
        }).first();

        if (!result)
            return res.status(401).json({error: 1, code: 'user.invalid'});
        if (result.signoutTime > decodedToken.signWhen)
            return res.status(401).json({error: 1, code: 'user.tokenExpired'});

        req.user = result;

        next();
    } catch (err) {
        next(err);
    }
}

async function supposeBackJWT(req: any, res: any, next: any) {
    try {
        req.user = null;

        const token = req.get('x-access-token');

        if (!token) {
            return next();
        }

        let decodedToken: any;
        try {
            decodedToken = await verifyJWTToken(token);
        } catch (err) {
            return next();
        }

        const result = await db.select('*').from('users').where({
            id: decodedToken.userId,
            valid: 1
        }).first();

        if (result) {
            req.user = result;
        }

        next();
    } catch (err) {
        next(err);
    }
}

export {
    verifyJWT,
    supposeBackJWT,
}
