import {Router} from 'express';
import {validationResult} from "express-validator";
import {body as checkBody, query as checkQuery} from "express-validator/lib/middlewares/validation-chain-builders";

import db from "../../mysql";
import logger from "../../logger";
import {RequestHasAccount} from "../types/auth";
import {verifyJWT} from "../middleware/auth";
import verifyCaptcha from "../middleware/captcha";
import {forbidPrivileges} from "../lib/auth";

const router = Router();

const DEFAULT_PAGE_SIZE = 10;       // 默认分页大小
const MAX_PAGE_SIZE = 50;           // 最大分页大小

/**
 * 添加评论
 */
router.post('/', verifyJWT, verifyCaptcha, forbidPrivileges(['blacklisted', 'freezed']), [
    checkBody("targetType").isString().notEmpty().withMessage('targetType is required'),
    checkBody("targetId").isString().notEmpty().withMessage('targetId is required'),
    checkBody("content").isString().notEmpty().withMessage('content is required'),
], async (req: RequestHasAccount, res: any) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({error: 1, code: 'comment.bad', details: errors.array()});
        }

        const {targetType, targetId, content} = req.body;
        const userId = req.user.id;

        // 插入评论
        const [commentId] = await db('comments').insert({
            userId,
            targetType: targetType,
            targetId: targetId,
            content: content,
            createdTime: db.fn.now()
        });

        res.json({
            code: 'comment.ok',
            data: {
                id: commentId
            }
        });
    } catch (e) {
        logger.error(e);
        res.status(500).json({error: 1, code: 'comment.error'});
    }
});

/**
 * 回复评论
 */
router.post('/reply', verifyJWT, forbidPrivileges(['blacklisted', 'freezed']), [
    checkBody("commentId").isInt().notEmpty().withMessage('commentId is required'),
    checkBody("content").isString().notEmpty().withMessage('content is required'),
], async (req: RequestHasAccount, res: any) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({error: 1, code: 'comment.bad', details: errors.array()});
        }

        const {commentId, content} = req.body;
        const userId = req.user.id;

        // 检查评论是否存在
        const comment = await db('comments')
            .where('id', commentId)
            .whereNull('deletedTime')
            .first();

        if (!comment) {
            return res.status(404).json({error: 1, code: 'comment.notFound'});
        }

        // 插入回复
        const [replyId] = await db('replies').insert({
            userId,
            commentId: commentId,
            content: content
        });

        res.json({
            code: 'comment.ok',
            data: {
                id: replyId
            }
        });
    } catch (e) {
        logger.error(e);
        res.status(500).json({error: 1, code: 'comment.error'});
    }
});

/**
 * 编辑评论
 */
router.post('/edit', verifyJWT, forbidPrivileges(['blacklisted', 'freezed']), [
    checkBody("id"),
    checkBody("content").isString().notEmpty().withMessage('content is required'),
], async (req: RequestHasAccount, res: any) => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({error: 1, code: 'comment.bad', details: errors.array()});
        }

        const {content, id} = req.body;
        const userId = req.user.id;

        // 检查评论是否存在且属于当前用户
        const comment = await db('comments')
            .where('id', id)
            .where('userId', userId)
            .whereNull('deletedTime')
            .first();

        if (!comment) {
            return res.status(404).json({error: 1, code: 'comment.notFoundOrNotOwner'});
        }

        // 更新评论
        await db('comments')
            .where('id', id)
            .update({
                content: content,
                updatedTime: db.fn.now()
            });

        res.json({code: 'comment.ok'});
    } catch (e) {
        logger.error(e);
        res.status(500).json({error: 1, code: 'comment.error'});
    }
});

/**
 * 删除评论
 */
router.post('/delete', verifyJWT, forbidPrivileges(['blacklisted', 'freezed']), [
    checkBody("id"),
], async (req: RequestHasAccount, res: any) => {
    try {
        const {id} = req.body

        const userId = req.user.id;

        // 检查评论是否存在且属于当前用户
        const comment = await db('comments')
            .where('id', id)
            .where('userId', userId)
            .whereNull('deletedTime')
            .first();

        if (!comment) {
            return res.status(404).json({error: 1, code: 'comment.notFoundOrNotOwner'});
        }

        // 软删除评论
        await db('comments')
            .where('id', id)
            .update({
                deletedTime: db.fn.now()
            });

        // 同时软删除所有回复
        await db('replies')
            .where('commentId', id)
            .update({
                deletedTime: db.fn.now()
            });

        res.json({code: 'comment.delete.ok'});
    } catch (e) {
        logger.error(e);
        res.status(500).json({error: 1, code: 'comment.error'});
    }
});

/**
 * 获取目标的所有评论
 */
router.get('/comments', [
    checkQuery("targetType").isString().notEmpty().withMessage('targetType is required'),
    checkQuery("targetId").isString().notEmpty().withMessage('targetId is required'),
    checkQuery("page").optional().isInt({min: 1}).toInt(),
    checkQuery("pageSize").optional().isInt({min: 1, max: MAX_PAGE_SIZE}).toInt(),
], async (req: any, res: any) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({error: 1, code: 'comment.bad', details: errors.array()});
        }

        const {targetType, targetId} = req.query;
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = Math.min(
            parseInt(req.query.pageSize as string) || DEFAULT_PAGE_SIZE,
            MAX_PAGE_SIZE
        );
        const offset = (page - 1) * pageSize;

        // 获取评论总数
        const totalCountResult = await db('comments as c')
            .count('* as count')
            .where('c.targetType', targetType)
            .where('c.targetId', targetId)
            .where('c.valid', '1')
            .whereNull('c.deletedTime')
            .first();

        const totalCount = totalCountResult ? parseInt(totalCountResult.count as string) : 0;
        const totalPages = Math.ceil(totalCount / pageSize);

        // 获取评论
        const comments = await db('comments as c')
            .join('users', 'users.id', 'c.userId')
            .select(
                'c.id',
                'c.userId',
                'c.content',
                'c.createdTime',
                'c.updatedTime',
                'users.username', 'users.id as byUserId',
                db.raw('COUNT(r.id) as replyCount')
            )
            .leftJoin('replies as r', function () {
                this.on('r.commentId', '=', 'c.id')
                    .andOnNull('r.deletedTime')
            })
            .where('c.targetType', targetType)
            .where('c.targetId', targetId)
            .where('c.valid', '1')
            .whereNull('c.deletedTime')
            .groupBy('c.id')
            .orderBy('c.createdTime', 'desc')
            .limit(pageSize)
            .offset(offset);

        res.json({
            code: 'comment.ok',
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
        res.status(500).json({error: 1, code: 'comment.error'});
    }
});

/**
 * 获取评论的回复
 */
router.get('/replies', [
    checkQuery("id"),
    checkQuery("page").optional().isInt({min: 1}).toInt(),
    checkQuery("pageSize").optional().isInt({min: 1, max: MAX_PAGE_SIZE}).toInt(),
], async (req: any, res: any) => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({error: 1, code: 'comment.bad', details: errors.array()});
        }

        const {id} = req.params;

        const page = parseInt(req.query.page as string) || 1;
        const pageSize = Math.min(
            parseInt(req.query.pageSize as string) || DEFAULT_PAGE_SIZE,
            MAX_PAGE_SIZE
        );
        const offset = (page - 1) * pageSize;

        // 检查评论是否存在
        const comment = await db('comments')
            .where('id', id)
            .whereNull('deletedTime')
            .first();

        if (!comment) {
            return res.status(404).json({error: 1, code: 'comment.notFound'});
        }

        // 获取回复总数
        const totalCountResult = await db('replies')
            .count('* as count')
            .where('commentId', id)
            .whereNull('deletedTime')
            .first();

        const totalCount = totalCountResult ? parseInt(totalCountResult.count as string) : 0;
        const totalPages = Math.ceil(totalCount / pageSize);

        // 获取回复
        const replies = await db('replies')
            .select('id', 'userId', 'content', 'createdTime', 'updatedTime')
            .where('commentId', id)
            .whereNull('deletedTime')
            .orderBy('createdTime', 'asc')
            .limit(pageSize)
            .offset(offset);

        res.json({
            code: 'comment.ok',
            data: {
                items: replies,
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
        res.status(500).json({error: 1, code: 'comment.error'});
    }
});

export default router;
