import 'reflect-metadata';

import {WebSocket, WebSocketServer} from "ws";
import {validationResult} from "express-validator";
import express, {Request, Response} from "express";
import {query as checkquery} from "express-validator/lib/middlewares/validation-chain-builders";

import logger from "../../logger";
import config from "../../config";
import {timeUpRateLimiter} from "../middleware/rateLimiter";
import db from "../../mysql";
import {verifyJWT} from "../middleware/auth";
import {verifyJWTToken} from "../lib/auth";
import {RequestHasAccount} from "../types/auth";
import {sanitizeRichText} from "../lib/content";

// 定义路由
const router = express.Router();

const httpServerPort: number = (config.port || 3000) as number,          // 服务器端口配置
    wss = new WebSocketServer({port: httpServerPort + 1})                // WebSocket服务器端口（HTTP端口+1）

// 存储已连接的客户端（WebSocket实例与用户ID的映射）
const connectedClients: Map<WebSocket, string | null> = new Map();

// 组队系统配置
const teamConfig = {
    // 可用的标签类型
    tags: [
        'pve', 'pvp', 'timeWander', 'plotTask', 'sideQuest',
        'reward', 'fortressRaiding', 'transaction', 'other'
    ],
}

/**
 * WebSocket连接事件处理
 */
wss.on('connection', async function connection(ws) {
    // 新连接默认设为匿名用户
    connectedClients.set(ws, null);

    // 消息处理
    ws.on('message', async function message(data) {
        try {
            const parsedMessage = JSON.parse(data.toString()) as WebSocketMessage;

            // 认证消息处理
            if (parsedMessage.type === 'authenticate') {
                await handleAuthentication(ws, parsedMessage);
            }
            // 发布组队消息处理
            else if (parsedMessage.type === 'publish_team_up') {
                const {player, description, expiresMinutesAt, tags} = parsedMessage.payload;
                const userId = connectedClients.get(ws);
                await addTeamUp({
                    player,
                    description,
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + expiresMinutesAt * 60 * 1000),
                    tags: tags || []
                }, userId);
            }
            // 取消组队消息处理
            else if (parsedMessage.type === 'cancel_team_up') {
                const {id} = parsedMessage.payload;
                const userId = connectedClients.get(ws);
                await cancelTeamUp(id, userId);
            }
        } catch (error) {
            logger.error('解析或处理 WebSocket 消息失败:', error);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({type: 'error', code: 'teamup.error', message: 'Invalid message format or processing failure'}));
            }
        }
    });

    // 连接关闭处理
    ws.on('close', () => {
        logger.error('用户断开连接');
        connectedClients.delete(ws);
    });

    // 错误处理
    ws.on('error', (error) => {
        logger.error('WebSocket 错误:', error);
        connectedClients.delete(ws);
    });
});

/**
 * 处理WebSocket认证
 * @param ws WebSocket实例
 * @param message 认证消息
 */
async function handleAuthentication(ws: WebSocket, message: WebSocketMessage) {
    const token = message.payload?.token;

    // 没有提供token，保持匿名状态
    if (!token) {
        return;
    }

    let decodedToken: any;
    try {
        decodedToken = await verifyJWTToken(token)
        connectedClients.set(ws, decodedToken.userId as string);
        logger.info(`WebSocket 用户 ${decodedToken.userId} 已认证`);
    } catch (err) {
        logger.warn('WebSocket 认证失败:', err);
        ws.send(JSON.stringify({
            type: 'auth_failed',
            code: 'teamUp.authFailed',
        }));
    }
}

/**
 * 添加组队信息
 * @param teamUpData 组队数据
 * @param userId 用户ID（可为null表示匿名）
 */
async function addTeamUp(teamUpData: TeamUpData, userId: string | null | undefined) {
    try {
        let user: any = null;
        let signoutTime: Date | null = null;

        // 注册用户处理
        if (userId) {
            user = await db('users').where({id: userId}).first();
            if (!user) {
                logger.error(`用户 ID ${userId} 不存在`);
                broadcastToClients({
                    type: 'error',
                    error: 1,
                    code: 'teamUp.error',
                }, userId);
                return;
            }
            signoutTime = user.signoutTime;
        }
        // 匿名用户处理
        else {
            const minIntervalAnonymous = config.__DEBUG__ ? 1000 : 60 * 60 * 1000; // 测试 1分钟，正式 1 小时
            const oneHourAgo = new Date(Date.now() - minIntervalAnonymous);

            const anonymousPostsCount = await db('team_up')
                .whereNull('userId')
                .where('createdAt', '>', oneHourAgo)
                .count('* as count')
                .first();

            if (!config.__DEBUG__ && anonymousPostsCount && Number(anonymousPostsCount.count) >= 1) {
                logger.warn(`匿名用户发布过快，请 1 小时后再试`);
                broadcastToClients({
                    type: 'publish_rate_limit',
                    error: 1,
                    code: 'teamUp.anonymous.rateLimit',
                    remainingTime: minIntervalAnonymous
                }, userId);
                return;
            }
        }

        // 检查发布频率限制
        const now = new Date();
        const minIntervalRegistered = 2 * 60 * 1000; // 2 分钟

        if (signoutTime && userId && (now.getTime() - signoutTime.getTime()) < minIntervalRegistered) {
            const timeDiff = now.getTime() - signoutTime.getTime();

            logger.warn(`用户 ${userId} 发布过快，请 ${Math.ceil((minIntervalRegistered - timeDiff) / 1000 / 60)} 分钟后再试`);

            broadcastToClients({
                type: 'publish_rate_limit',
                error: 1,
                code: 'teamUp.account.rateLimit',
                remainingTime: minIntervalRegistered - timeDiff
            }, userId);
            return;
        }

        // 过滤无效标签
        if (teamUpData.tags) {
            teamUpData.tags = teamUpData.tags.filter(tag => teamConfig.tags.includes(tag));
        }

        // 创建并保存组队信息
        const [newTeamUpId] = await db('team_up').insert({
            player: teamUpData.player,
            description: teamUpData.description,
            tags: JSON.stringify(teamUpData.tags),
            expiresAt: teamUpData.expiresAt,
            createdAt: teamUpData.createdAt,
            userId: userId
        });

        // 更新用户最后发布时间
        if (user) {
            await db('users')
                .where({id: userId})
                .update({signoutTime: now});
        }

        logger.info(`发布新的组队信息: ${teamUpData.player} (用户ID: ${userId || '匿名'})`);

        // 获取完整的组队信息
        const newTeamUp = await db('team_up')
            .leftJoin('users', 'team_up.userId', 'users.id')
            .select(
                'team_up.*',
                'users.username',
                db.raw('UNIX_TIMESTAMP(team_up.expiresAt) as expiresAtTimestamp'),
                db.raw('UNIX_TIMESTAMP(team_up.createdAt) as createdAtTimestamp')
            )
            .where('team_up.id', newTeamUpId)
            .first();

        // 构建响应数据
        const payload = {
            id: newTeamUp.id,
            player: sanitizeRichText(newTeamUp.player),
            description: sanitizeRichText(newTeamUp.description),
            tags: newTeamUp.tags ? newTeamUp.tags : [],
            expiresAt: newTeamUp.expiresAtTimestamp,
            createdAt: newTeamUp.createdAtTimestamp,
            username: newTeamUp.username || 'none',
            userId: newTeamUp.userId,
        };

        // 广播新组队信息
        broadcastToClients({
            type: 'new_team_up',
            code: 'teamUp.newTeamUp',
            payload
        });

    } catch (error) {
        logger.error('发布失败:', error);
        broadcastToClients({
            type: 'error',
            error: 1,
            code: 'teamUp.error',
        }, userId);
    }
}

/**
 * 取消组队信息
 * @param id 组队信息ID
 * @param userId 用户ID
 */
async function cancelTeamUp(id: string, userId: string | null | undefined) {
    try {
        const teamUp = await db('team_up').where({id}).first();

        if (!teamUp) {
            logger.info(`未找到 ID 为 ${id} 的组队信息。`);
            broadcastToClients({type: 'error', message: '组队信息不存在或已被删除'}, userId);
            return;
        }

        // 权限检查
        if (teamUp.userId !== userId) {
            logger.warn(`用户 ${userId} 试图取消不属于自己的组队信息 ${id}`);
            broadcastToClients({type: 'error', message: '您无权取消此组队信息'}, userId);
            return;
        }

        // 删除组队信息
        const result = await db('team_up').where({id}).delete();

        if (result > 0) {
            logger.info(`组队信息已主动取消: ID ${id} (用户ID: ${userId})`);
            broadcastToClients({type: 'cancel_team_up', payload: {id}});
        } else {
            logger.info(`未找到 ID 为 ${id} 的组队信息或已被删除。`);
        }
    } catch (error) {
        logger.error(`取消组队信息 ID ${id} 失败:`, error);
        broadcastToClients({type: 'error', message: '取消失败'}, userId);
    }
}

/**
 * 向客户端广播消息
 * @param message 要发送的消息
 * @param targetUserId 目标用户ID（null表示广播给所有用户）
 */
function broadcastToClients(message: any, targetUserId: string | null = null) {
    connectedClients.forEach((currentUserId, client) => {
        if (client.readyState === WebSocket.OPEN) {
            if (targetUserId === null || currentUserId === targetUserId) {
                client.send(JSON.stringify(message));
            }
        }
    });
}

/**
 * 清理过期的组队信息
 */
async function cleanExpiredTeamUps() {
    try {
        logger.info('执行清理工作');

        // 获取过期组队信息
        const expiredTeamUps = await db('team_up')
            .where('expiresAt', '<=', db.fn.now())
            .select('id');

        if (expiredTeamUps.length > 0) {
            const expiredIds = expiredTeamUps.map(t => t.id);

            // 删除过期组队信息
            await db('team_up')
                .whereIn('id', expiredIds)
                .delete();

            logger.info(`[${new Date().toISOString()}] 删除已过期组队信息: ${expiredIds.length} 条`);

            // 广播过期通知
            expiredIds.forEach(id => {
                broadcastToClients({type: 'team_up_expired', payload: {id}});
            });
        }
    } catch (error) {
        logger.error('清理过期组队信息失败:', error);
    }
}

/**
 * 组队信息检索
 */
router.get('/teamups', timeUpRateLimiter, [
    checkquery("page").optional().isInt({min: 1}).toInt(),
    checkquery("limit").optional().isInt({min: 1, max: 100}).toInt(),
    checkquery("sortBy").isIn(['recent', 'expires']),
    checkquery('keyword').optional().isString().isLength({max: 100}).trim(),
], async (req: Request, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty()) {
            return res.status(400).json({error: 1, code: 'teamups.bad', message: validateErr.array()});
        }

        const {keyword, sortBy, page = 1, limit = 20} = req.query as {
            keyword?: string;
            sortBy: string;
            page?: number;
            limit?: number;
        } | any;

        // 构建基础查询
        let query = db('team_up')
            .leftJoin('users', 'team_up.userId', 'users.id')
            .select(
                'team_up.*',
                'users.username',
                db.raw('UNIX_TIMESTAMP(team_up.expiresAt) as expiresAtTimestamp'),
                db.raw('UNIX_TIMESTAMP(team_up.createdAt) as createdAtTimestamp')
            )
            .where('team_up.expiresAt', '>', db.fn.now());

        // 关键词搜索
        if (keyword) {
            const searchKeyword = `%${keyword.toLowerCase()}%`;
            query.where(function () {
                this.where(db.raw('LOWER(team_up.player)'), 'LIKE', searchKeyword)
                    .orWhere(db.raw('LOWER(team_up.description)'), 'LIKE', searchKeyword)
                    .orWhere(db.raw('JSON_SEARCH(LOWER(team_up.tags), "one", ?)', [searchKeyword]));
            });
        }

        // 排序
        if (sortBy === 'recent') {
            query.orderBy('team_up.createdAt', 'desc');
        } else {
            query.orderBy('team_up.expiresAt', 'asc');
        }

        // 分页处理
        const totalQuery = query.clone().clearSelect().count('* as total');
        const totalResult = await totalQuery.first();
        const total = totalResult ? (totalResult as any).total : 0;

        query.limit(limit).offset((page - 1) * limit);

        const teamUps = await query;

        // 格式化响应数据
        const formattedTeamUps = teamUps.map(t => ({
            id: t.id,
            player: t.player,
            description: t.description,
            // tags: t.tags ? JSON.parse(t.tags) : [],
            expiresAt: t.expiresAtTimestamp,
            createdAt: t.createdAtTimestamp,
            username: t.username || null,
            userId: t.userId
        }));

        res.status(200).json({
            success: 1,
            code: 'teamups.success',
            data: formattedTeamUps,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        logger.error('检索组队信息失败:', error);
        res.status(500).json({error: 1, code: 'teamups.error'});
    }
});

/**
 * 组队信息统计
 */
router.get('/teamup/statistics', timeUpRateLimiter, async (req: Request, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty()) {
            return res.status(400).json({error: 1, code: 'teamups.statistics.bad', message: validateErr.array()});
        }

        const totalResult = await db('team_up').count('* as total').first();
        const total = totalResult ? (totalResult as any).total : 0;

        // 设置缓存头（60秒）
        res.status(200).setHeader('Cache-Control', 'public, max-age=60').json({
            success: 1,
            code: 'teamups.statistics.success',
            data: total
        });
    } catch (error) {
        logger.error('检索组队信息失败:', error);
        res.status(500).json({error: 1, code: 'teamup.statistics.error'});
    }
});

export {
    cleanExpiredTeamUps,
    router
}
