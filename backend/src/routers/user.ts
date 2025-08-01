import express, {Request, Response} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {body as checkbody, validationResult} from "express-validator";
import {query as checkQuery} from "express-validator/lib/middlewares/validation-chain-builders";

import AppDataSource from "../ormconfig";
import {Users} from "../entity/Users";
import verifyCaptcha from "../middleware/captcha";
import config from "../../config";
import {loginRateLimiter, registerRateLimiter} from "../middleware/rateLimiter";
import logger from "../../logger";
import db from "../../mysql";
import {verifyJWT} from "../middleware/auth";
import {RequestHasAccount} from "../types/auth";

const router = express.Router();

/**
 * 注册
 */
router.post('/register', registerRateLimiter, verifyCaptcha, [
    checkbody("username").isString().trim().isLength({min: 3, max: 40}).matches(/^[a-zA-Z0-9_]+$/),
    checkbody('password').isString().trim().isLength({min: 8, max: 64}),
    checkbody('email').optional({checkFalsy: true}).isEmail().normalizeEmail(),
], async (req: Request, res: Response) => {
    try {
        const validateErr = validationResult(req);

        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'register.bad', message: validateErr.array()});

        const {username, password, email} = req.body;

        const userRepository = AppDataSource.getRepository(Users);
        const existingUser = await userRepository.findOneBy({username});

        if (existingUser) {
            return res.status(409).json({error: 1, code: 'register.userAlreadyHas'});
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = userRepository.create({username, passwordHash, ...(email && {email})});

        await userRepository.save(newUser);

        res.status(200).json({code: 'register.ok'});
    } catch (error) {
        logger.error('register error:', error);
        res.status(500).json({error: 1, code: 'register.error'});
    }
});

/**
 * 登陆
 */
router.post('/login', loginRateLimiter, verifyCaptcha, [
    checkbody("username").isString().trim().isLength({min: 1, max: 40}),
    checkbody('password').isString().trim().isLength({min: 1, max: 40}),
], async (req: Request, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'login.bad', message: validateErr.array()});

        const {username, password} = req.body;


        const userRepository = AppDataSource.getRepository(Users);
        const user = await userRepository.findOneBy({username});

        if (!user) {
            return res.status(401).json({error: 1, code: 'login.accountIncorrect'});
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({error: 1, code: 'login.accountIncorrect'});
        }

        // 生成 JWT
        const token = jwt.sign({userId: user.id, username: user.username}, config.secret, {expiresIn: '24h'});

        res.status(200).json({
            code: 'login.ok',
            data: {
                token,
                userId: user.id,
                username: user.username
            }
        });
    } catch (error) {
        logger.error('login error:', error);
        res.status(500).json({error: 1, code: 'login.error'});
    }
});

/**
 * 获取用户自己的评论
 */
router.get('/comments', verifyJWT, [
    checkQuery("page").optional().isInt({min: 1}).toInt(),
    checkQuery("pageSize").optional().isInt({min: 1, max: 50}).toInt(),
], async (req: RequestHasAccount, res: any) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({error: 1, code: 'invalidInput', details: errors.array()});
        }

        const userId = req.user.id;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = Math.min(
            parseInt(req.query.pageSize as string) || 10,
            10
        );
        const offset = (page - 1) * pageSize;

        // 获取评论总数
        const totalCountResult = await db('comments as c')
            .count('* as count')
            .where('c.userId', userId)
            .whereNull('c.deletedTime')
            .first();

        const totalCount = totalCountResult ? parseInt(totalCountResult.count as string) : 0;
        const totalPages = Math.ceil(totalCount / pageSize);

        // 获取用户的所有评论
        const comments = await db('comments as c')
            .select(
                'c.id',
                'c.targetType',
                'c.targetId',
                'c.content',
                'c.createdTime',
                'c.updatedTime',
                db.raw('COUNT(r.id) as reply_count')
            )
            .leftJoin('replies as r', function () {
                this.on('r.commentId', '=', 'c.id')
                    .andOnNull('r.deletedTime')
            })
            .where('c.userId', userId)
            .whereNull('c.deletedTime')
            .groupBy('c.id')
            .orderBy('c.createdTime', 'desc')
            .limit(pageSize)
            .offset(offset);

        res.json({
            code: 'success',
            data: {
                items: comments,
                pagination: {
                    page,
                    pageSize,
                    totalCount,
                    totalPages
                }
            }
        });
    } catch (e) {
        logger.error(e);
        res.status(500).json({error: 1, code: 'serverError'});
    }
});

export default router;
