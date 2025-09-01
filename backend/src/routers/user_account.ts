import {verifyJWT} from "../middleware/auth";
import {body as checkBody, query as checkQuery} from "express-validator/lib/middlewares/validation-chain-builders";
import {RequestHasAccount} from "../types/auth";
import {validationResult} from "express-validator";
import db from "../../mysql";
import logger from "../../logger";
import express from "express";
import {accountRateLimiter} from "../middleware/rateLimiter";
import {comparePassword, forbidPrivileges, generatePassword} from "../lib/auth";
import {PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, showUserInfo, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH, USERNAME_REGULAR, userSetAttributes} from "../lib/user";

const router = express.Router();

/**
 * 获取用户自己的评论
 */
router.get('/comments', accountRateLimiter, verifyJWT, [
    checkQuery("page").optional().isInt({min: 1}).toInt(),
    checkQuery("pageSize").optional().isInt({min: 1, max: 50}).toInt(),
], async (req: RequestHasAccount, res: any) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({error: 1, code: 'user.comment.bad', details: errors.array()});
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
            code: 'user.comment.ok',
            data: {
                data: comments,
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
        res.status(500).setHeader('Cache-Control', 'public, max-age=60').json({error: 1, code: 'user.comment.error'});
    }
});

/**
 * 获取我的点赞记录
 */
router.get('/likes', accountRateLimiter, verifyJWT, [
    checkQuery("page").optional().isInt({min: 1}).toInt(),
    checkQuery("pageSize").optional().isInt({min: 1, max: 50}).toInt(),
], async (req: RequestHasAccount, res: any) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({error: 1, code: 'user.likes.bad', details: errors.array()});
        }

        const userId = req.user.id;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = Math.min(
            parseInt(req.query.pageSize as string) || 10,
            10
        );
        const offset = (page - 1) * pageSize;

        // 获取评论总数
        const totalCountResult = await db('likes as l')
            .count('* as count')
            .where('l.userId', userId)
            .first();

        const totalCount = totalCountResult ? parseInt(totalCountResult.count as string) : 0;
        const totalPages = Math.ceil(totalCount / pageSize);

        // 获取用户的所有评论
        const comments = await db('likes as l')
            .select(
                'l.id',
                'l.targetType',
                'l.targetId',
                'l.content',
                'l.createdTime',
                'l.updatedTime',
            )
            .where('l.userId', userId)
            .orderBy('l.createdTime', 'desc')
            .limit(pageSize)
            .offset(offset);

        res.json({
            code: 'user.likes.ok',
            data: {
                data: comments,
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
        res.status(500).setHeader('Cache-Control', 'public, max-age=60').json({error: 1, code: 'user.likes.error'});
    }
});

/**
 * 获取我的组队记录
 */
router.get('/me/teamups', accountRateLimiter, verifyJWT, [
    checkQuery("page").optional().isInt({min: 1}).toInt(),
    checkQuery("pageSize").optional().isInt({min: 1, max: 50}).toInt(),
], showTeamUp);

router.get('/space/teamups', accountRateLimiter, [
    checkQuery("id").isString().trim(),
    checkQuery("page").optional().isInt({min: 1}).toInt(),
    checkQuery("pageSize").optional().isInt({min: 1, max: 50}).toInt(),
], showTeamUp);

export async function showTeamUp(req: RequestHasAccount, res: any) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({error: 1, code: 'user.teamups.bad', details: errors.array()});
        }

        const userId = req.user && req.user.id || req.query.id || null;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = Math.min(
            parseInt(req.query.pageSize as string) || 10,
            10
        );
        const offset = (page - 1) * pageSize;

        // 获取评论总数
        const totalCountResult = await db('team_up as l')
            .count('* as count')
            .where('l.userId', userId)
            .first();

        const totalCount = totalCountResult ? parseInt(totalCountResult.count as string) : 0;
        const totalPages = Math.ceil(totalCount / pageSize);

        // 获取用户的所有评论
        const comments = await db('team_up as l')
            .select(
                'l.id',
                'l.player',
                'l.description',
                'l.tags',
                'l.createdAt as createdTime',
            )
            .where('l.userId', userId)
            .orderBy('l.createdAt', 'desc')
            .limit(pageSize)
            .offset(offset);

        res.setHeader('Cache-Control', 'public, max-age=60').json({
            code: 'user.teamups.ok',
            data: {
                data: comments,
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
        res.status(500).json({error: 1, code: 'user.teamups.error'});
    }
}

/**
 * 获取用户自己的评论
 */
router.get('/me/assemblys', accountRateLimiter, verifyJWT, [
    checkQuery("page").optional().isInt({min: 1}).toInt(),
    checkQuery("pageSize").optional().isInt({min: 1, max: 50}).toInt(),
], showAssembly);

router.get('/space/assemblys', accountRateLimiter, [
    checkQuery("id").isString().trim(),
    checkQuery("page").optional().isInt({min: 1}).toInt(),
    checkQuery("pageSize").optional().isInt({min: 1, max: 50}).toInt(),
], showAssembly);

export async function showAssembly(req: RequestHasAccount, res: any) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({error: 1, code: 'user.assembls.bad', details: errors.array()});
        }

        const userId = req.user && req.user.id || req.query.id || null;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = Math.min(
            parseInt(req.query.pageSize as string) || 10,
            10
        );
        const offset = (page - 1) * pageSize;
        const isLogin = req.user

        // 获取评论总数
        const totalCountResult = await db('assembly as a')
            .count('* as count')
            .where('a.userId', userId)
            .first();

        const totalCount = totalCountResult ? parseInt(totalCountResult.count as string) : 0;
        const totalPages = Math.ceil(totalCount / pageSize);

        // 获取用户的所有配装
        const query = db('assembly as a')
            .select('a.userId', 'a.uuid', 'a.name')
            .where('a.userId', userId);

        if (isLogin) {
            // todo
        }

        const assemblys = await query
            .orderBy('a.createdTime', 'desc')
            .limit(pageSize)
            .offset(offset)

        res.json({
            code: 'user.assembls.ok',
            data: {
                data: assemblys,
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
        res.status(500).setHeader('Cache-Control', 'public, max-age=60').json({error: 1, code: 'user.assembls.error'});
    }
}

/**
 * 修改别名
 */
router.post('/changeAlternativeName', verifyJWT, [
        checkBody("username").isString().trim().isLength({min: USERNAME_MIN_LENGTH, max: USERNAME_MAX_LENGTH}).matches(USERNAME_REGULAR),
    ],
    async (req: any, res: any, next: any) => {
        try {
            const validateErr = validationResult(req);
            if (!validateErr.isEmpty())
                return res.status(400).json({error: 1, code: 'changeAlternativeName.bad', message: validateErr.array()});

            const {username} = req.body;

            const user = req.user

            await db('users').update({alternativeName: username}).where({id: user.id});

            return res.status(200).json({
                success: 1,
                code: 'changeAlternativeName.success',
            });
        } catch (err) {
            next(err);
        }
    });

/**
 * 修改密码
 */
router.post('/changePassword', verifyJWT, [
        checkBody('newPassword').isString().trim().isLength({min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH}),
        checkBody('oldPassword').isString().trim().isLength({min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH})
    ],
    async (req: any, res: any, next: any) => {
        try {
            const validateErr = validationResult(req);
            if (!validateErr.isEmpty())
                return res.status(400).json({error: 1, code: 'changePassword.bad', message: validateErr.array()});

            const {oldPassword, newPassword} = req.body;

            const user = req.user
            if (!await comparePassword(oldPassword, user.password))
                return res.status(400).json({
                    error: 1,
                    code: 'changePassword.notMatch',
                    message: 'original password incorrect.'
                });
            await db('users').update({
                password: await generatePassword(newPassword),
                signoutTime: db.fn.now()
            }).where({id: user.id});

            return res.status(200).json({
                success: 1,
                code: 'changePassword.success',
            });
        } catch (err) {
            next(err);
        }
    });

/**
 * 获取用户自己信息
 */
router.get('/me', verifyJWT, accountRateLimiter, showUserInfo);

/**
 * 修改用户自己属性
 */
router.post('/me', verifyJWT, accountRateLimiter, forbidPrivileges(['blacklisted', 'freezed']), [
        checkBody('attr').optional({nullable: true}).isObject(),
    ],
    async (req: RequestHasAccount, res: any, next: any) => {
        try {
            const validateErr = validationResult(req);
            if (!validateErr.isEmpty())
                return res.status(400).json({error: 1, code: 'me.bad', message: validateErr.array()});

            let update: any = {};

            if (req.body.subscribes)
                update.subscribes = JSON.stringify(req.body.subscribes.map((i: any) => i - 0)); // to number
            if (req.body.attr)
                update.attr = JSON.stringify(userSetAttributes(req.user.attr, req.body.attr));

            await db('users').update(update).where({id: req.user.id});

            res.status(200).json({success: 1, code: 'me.success', data: update});
        } catch (err) {
            next(err);
        }
    });

export default router;
