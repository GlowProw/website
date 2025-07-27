import 'reflect-metadata';

import {WebSocket, WebSocketServer} from "ws";
import {validationResult} from "express-validator";
import express, {Request, Response} from "express";
import {query as checkquery} from "express-validator/lib/middlewares/validation-chain-builders";
import xss from "xss";

import AppDataSource from "../ormconfig";
import {Users} from "../entity/Users";
import {TeamUp} from "../entity/TeamUp";
import logger from "../../logger";

import config from "../../config";
import {timeUpRateLimiter} from "../middleware/rateLimiter";
import db from "../../mysql";
import {verifyJWT} from "../middleware/auth";
import {verifyJWTToken} from "../lib/auth";
import {RequestHasAccount} from "../types/auth";

// 定义路由
const router = express.Router();

const httpServerPort: number = parseInt(config.port || '3000'),          // 服务器端口配置
    wss = new WebSocketServer({port: httpServerPort + 1})                // WebSocket服务器端口（HTTP端口+1）

// 存储已连接的客户端（WebSocket实例与用户ID的映射）
const connectedClients: Map<WebSocket, string | null> = new Map();

// 组队系统配置
const teamConfig = {
    // 可用的标签类型
    tags: [
        'pve', 'pvp', 'timeWander', 'plotTask', 'sideQuest',
        'reward', 'fortressRaiding', 'other'
    ],
    // XSS过滤配置
    xss: {
        whiteList: {
            a: ["href", "title", "target"],
            b: [],
            br: [],
            div: [],
            hr: [],
            i: [],
            img: ["src", "alt", "style", "title", "width", "height"],
            li: [],
            oi: [],
            ul: [],
            p: [],
            span: [],
            strong: [],
            u: [],
            video: ["autoplay", "controls", "crossorigin", "loop", "muted", "playsinline", "poster", "preload", "src", "height", "width"],
        },
        css: false,
        allowCommentTag: false,
    }
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

    // jwt.verify(token, config.secret, (err: any, decoded: any) => {
    //     if (!err && decoded && typeof decoded === 'object' && 'userId' in decoded) {
    //         connectedClients.set(ws, decoded.userId as string);
    //         logger.info(`WebSocket 用户 ${decoded.userId} 已认证`);
    //     } else {
    //         logger.warn('WebSocket 认证失败:', err);
    //         ws.send(JSON.stringify({
    //             type: 'auth_failed',
    //             code: 'teamUp.authFailed',
    //         }));
    //     }
    // });
}

/**
 * 添加组队信息
 * @param teamUpData 组队数据
 * @param userId 用户ID（可为null表示匿名）
 */
async function addTeamUp(teamUpData: TeamUpData, userId: string | null | undefined) {
    try {
        const userRepository = AppDataSource.getRepository(Users);
        const teamUpRepository = AppDataSource.getRepository(TeamUp);

        let user: Users | null = null;
        let lastPublishedAt: Date | null = null;

        // 注册用户处理
        if (userId) {
            user = await userRepository.findOneBy({id: userId});
            if (!user) {
                logger.error(`用户 ID ${userId} 不存在`);
                broadcastToClients({
                    type: 'error',
                    error: 1,
                    code: 'teamUp.error',
                }, userId);
                return;
            }
            lastPublishedAt = user.lastPublishedAt;
        }
        // 匿名用户处理
        else {
            const minIntervalAnonymous = 60 * 60 * 1000; // 1 小时
            const oneHourAgo = new Date(Date.now() - minIntervalAnonymous);

            const anonymousPostsCount = await teamUpRepository
                .createQueryBuilder("team_up")
                .where("team_up.userId IS NULL")
                .andWhere("team_up.createdAt > :oneHourAgo", {oneHourAgo})
                .getCount();

            if (!config.__DEBUG__ && anonymousPostsCount >= 1) {
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

        if (lastPublishedAt && userId && (now.getTime() - lastPublishedAt.getTime()) < minIntervalRegistered) {
            const timeDiff = now.getTime() - lastPublishedAt.getTime();

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
        const newTeamUp = teamUpRepository.create({
            ...teamUpData,
            user: user,
            userId: userId
        });
        await teamUpRepository.save(newTeamUp);

        // 更新用户最后发布时间
        if (user) {
            user.lastPublishedAt = now;
            await userRepository.save(user);
        }

        logger.info(`发布新的组队信息: ${newTeamUp.player} (用户ID: ${userId || '匿名'})`);

        // 构建响应数据
        const payload = {
            id: newTeamUp.id,
            player: sanitizeRichText(newTeamUp.player),
            description: sanitizeRichText(newTeamUp.description),
            tags: newTeamUp.tags,
            expiresAt: newTeamUp.expiresAt.getTime(),
            createdAt: newTeamUp.createdAt.getTime(),
            username: user ? user.username : 'none',
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
        const teamUpRepository = AppDataSource.getRepository(TeamUp);
        const teamUp = await teamUpRepository.findOneBy({id});

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
        const result = await teamUpRepository.delete(id);

        if (result.affected && result.affected > 0) {
            logger.info(`组队信息已主动取消: ID ${id} (用户ID: ${userId})`);
            broadcastToClients({type: 'team_up_expired', payload: {id}});
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
        const teamUpRepository = AppDataSource.getRepository(TeamUp);
        const expiredTeamUps = await teamUpRepository
            .createQueryBuilder("team_up")
            .where("team_up.expiresAt <= NOW()")
            .getMany();

        if (expiredTeamUps.length > 0) {
            const expiredIds = expiredTeamUps.map(t => t.id);
            await teamUpRepository.delete(expiredIds);

            logger.info(`[${new Date().toISOString()}] 删除已过期组队信息: ${expiredIds.length} 条`);
            expiredIds.forEach(id => {
                broadcastToClients({type: 'team_up_expired', payload: {id}});
            });
        }
    } catch (error) {
        logger.error('清理过期组队信息失败:', error);
    }
}

/**
 * 富文本输入处理（XSS过滤）
 * @param content 输入内容
 * @returns 安全处理后的内容
 */
function sanitizeRichText(content: string): string {
    return xss(content, teamConfig.xss);
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
            .leftJoin('user', 'team_up.userId', 'user.id')
            .select(
                'team_up.*',
                'user.username',
                db.raw('UNIX_TIMESTAMP(team_up.expiresAt) as expiresAtTimestamp'),
                db.raw('UNIX_TIMESTAMP(team_up.createdAt) as createdAtTimestamp')
            );

        // 关键词搜索
        if (keyword) {
            const searchKeyword = `%${keyword.toLowerCase()}%`;
            query.where(function () {
                this.where(db.raw('LOWER(team_up.name)'), 'LIKE', searchKeyword)
                    .orWhere(db.raw('JSON_SEARCH(LOWER(team_up.tags), "one", ?)', [keyword.toLowerCase()]));
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
            tags: t.tags,
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
 * 获取用户发布组队信息
 */
router.post('/my/teamups', timeUpRateLimiter, verifyJWT, [
    checkquery("page").optional().isInt({min: 1}).toInt(),
    checkquery("limit").optional().isInt({min: 1, max: 100}).toInt(),
    checkquery("sortBy").isIn(['recent', 'expires']),
    checkquery('keyword').optional().isString().isLength({max: 100}).trim(),
], async (req: RequestHasAccount, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty()) {
            return res.status(400).json({error: 1, code: 'my.teamups.bad', message: validateErr.array()});
        }

        const {keyword, sortBy, page = 1, limit = 20} = req.query as {
            keyword?: string;
            sortBy: string;
            page?: number;
            limit?: number;
        } | any;

        let query = db('team_up')
            .leftJoin('user', 'team_up.userId', 'user.id')
            .where('user.id', req.user.id)
            .select(
                'team_up.*',
                'user.username',
                db.raw('UNIX_TIMESTAMP(team_up.expiresAt) as expiresAtTimestamp'),
                db.raw('UNIX_TIMESTAMP(team_up.createdAt) as createdAtTimestamp')
            );

        // 排序
        switch (sortBy) {
            case 'recent':
                query.orderBy('team_up.createdAt', 'desc');
                break
            default:
                query.orderBy('team_up.expiresAt', 'asc');
                break;
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
            tags: t.tags,
            expiresAt: t.expiresAtTimestamp,
            createdAt: t.createdAtTimestamp,
            username: t.username || null,
            userId: t.userId
        }));

        res.status(200).json({
            success: 1,
            code: 'my.teamups.success',
            data: formattedTeamUps,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit)
            }
        });
    } catch (error) {
        logger.error('我读检索组队信息失败:', error);
        res.status(500).json({error: 1, code: 'teamups.error'});
    }
})

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
