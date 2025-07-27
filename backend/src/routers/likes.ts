import express from "express";
import db from "../../mysql";
import {likesRateLimiter} from "../middleware/rateLimiter";
import {verifyJWT} from "../middleware/auth";
import {RequestHasAccount} from "../types/auth";
import logger from "../../logger";

const router = express.Router();

/**
 * 检查用户是否点赞过某个目标
 */
router.get('/check', likesRateLimiter, verifyJWT, async (req: RequestHasAccount, res) => {
    try {
        const {targetType, targetId} = req.query;

        const like = await db('likes')
            .where({userId: req.user.id, targetType, targetId})
            .first();

        res.json({isLiked: !!like});
    } catch (e) {
        logger.error(e)
        res.status(500).json({error: 1, code: 'like.error'})
    }
});

/**
 * 点赞或取消点赞
 */
router.post('/toggle', likesRateLimiter, verifyJWT,
    [

    ],
    async (req: RequestHasAccount, res: any) => {
        try {
            const {targetType, targetId} = req.body;

            // 检查是否已经点赞
            const existingLike = await db('likes')
                .where({userId: req.user.id, targetType, targetId})
                .first();

            if (existingLike) {
                // 取消点赞
                await db('likes').where({id: existingLike.id}).del();
                return res.json({isLiked: false, action: 'unliked'});
            }

            // 新增点赞
            await db('likes').insert({userId: req.user.id, targetType, targetId});
            res.status(200).json({isLiked: true, code: 'like.ok', action: 'liked'});
        } catch (e) {
            logger.error('赞 错误:', e)
            res.status(500).json({error: 1, code: 'like.error'})
        }
    },
);

router.get('/count', likesRateLimiter, async (req, res) => {
    try {
        const {targetType, targetId} = req.query;

        const count = await db('likes')
            .where({targetType, targetId})
            .count('id as likeCount')
            .first();

        if (!count)
            return res.status(401).json({error: 1, code: 'like.notSelfLike'})

        res.status(200).json({likeCount: count.likeCount || 0});
    } catch (e) {
        logger.error('赞错误:', e)
        res.status(500).json({error: 1, code: 'like.error'})
    }
});

export default router
