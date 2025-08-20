import express, {Request, Response} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {body as checkbody, query as checkquery, validationResult} from "express-validator";

import verifyCaptcha from "../middleware/captcha";
import config from "../../config";
import {loginRateLimiter, registerRateLimiter} from "../middleware/rateLimiter";
import logger from "../../logger";
import db from "../../mysql";
import {generatePassword} from "../lib/auth";
import {PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, showUserInfo, userDefaultAttribute, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH, USERNAME_REGULAR} from "../lib/user";
import {RequestHasAccount} from "../types/auth";

const router = express.Router()

/**
 * 注册
 */
router.post('/signup', registerRateLimiter, verifyCaptcha, [
    checkbody("username").isString().trim().isLength({min: USERNAME_MIN_LENGTH, max: USERNAME_MAX_LENGTH}).matches(USERNAME_REGULAR),
    checkbody("alternativeName").isString().trim().isLength({min: USERNAME_MIN_LENGTH, max: USERNAME_MAX_LENGTH}),
    checkbody('password').isString().trim().isLength({min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH}),
    checkbody('email').optional({checkFalsy: true}).isEmail().normalizeEmail(),
], async (req: RequestHasAccount, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'signup.bad', message: validateErr.array()});

        const {username, alternativeName, password, email} = req.body;

        // 检查用户名是否已存在
        if (await db('users').where('username', username).first())
            return res.status(409).json({error: 1, code: 'signup.userAlreadyHas'});

        // 加密密码
        const passwordHash = await generatePassword(password);

        // 插入新用户
        const [userId] = await db('users').insert({
            username,
            alternativeName: alternativeName || username,
            password: passwordHash,
            email: email || null,
            privilege: JSON.stringify(['normal']),
            attr: JSON.stringify(userDefaultAttribute(req.REAL_IP, req.headers["accept-language"] || req.query.lang)),
            createdTime: db.fn.now(),
            updateTime: db.fn.now(),
        });

        res.status(200).json({code: 'signup.ok', data: {userId}});
    } catch (error) {
        logger.error('signup error:', error);
        res.status(500).json({error: 1, code: 'signup.error'});
    }
});

/**
 * 登陆
 */
router.post('/login', loginRateLimiter, verifyCaptcha, [
    checkbody("username").isString().trim().isLength({min: USERNAME_MIN_LENGTH, max: USERNAME_MAX_LENGTH}).matches(USERNAME_REGULAR),
    checkbody('password').isString().trim().isLength({min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH}),
], async (req: Request, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'login.bad', message: validateErr.array()});

        const {username, password} = req.body;

        // 查找用户
        const user = await db('users')
            .where('username', username)
            .first();

        if (!user) {
            return res.status(401).json({error: 1, code: 'login.accountIncorrect'});
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({error: 1, code: 'login.accountIncorrect'});
        }

        // 生成 JWT
        const token = jwt.sign({userId: user.id, username: user.username, privilege: user.privilege}, config.secret, {expiresIn: '24h'});

        res.status(200).json({
            code: 'login.ok',
            data: {
                token,
                userId: user.id,
                username: user.username,
                privilege: user.privilege,
            }
        });
    } catch (error) {
        logger.error('login error:', error);
        res.status(500).json({error: 1, code: 'login.error'});
    }
});

/**
 * 获取账户信息
 * 这是公共
 */
router.get('/info', [checkquery('id').isInt({min: 0})], showUserInfo);

export default router;
