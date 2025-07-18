import 'reflect-metadata';

import {WebSocket, WebSocketServer} from "ws";
import jwt from "jsonwebtoken";
import AppDataSource from "../ormconfig";
import {User} from "../entity/User";
import {TeamUp} from "../entity/TeamUp";
import dotenv from "dotenv";
import xss from "xss";
import config from "../../config";
import express, {Request, Response} from "express";
import router from "./user";
import {query as checkquery} from "express-validator/lib/middlewares/validation-chain-builders";
import {validationResult} from "express-validator";
import {timeUpRateLimiter} from "../middleware/rateLimiter";
import db from "../../mysql";

dotenv.config();

const router = express.Router();

const httpServerPort = parseInt(process.env.SERVER_PORT || '3000');
const wss = new WebSocketServer({port: httpServerPort + 1});
const connectedClients: Map<WebSocket, string | null> = new Map();
const jwtSecret = config.secret;

const teamConfig = {
    // pve pvp 时间游荡 剧情任务 支线
    // 悬赏 其他
    tags: [
        'pve', 'pvp', 'timeWander', 'plotTask', 'sideQuest',
        'reward', 'other'
    ],
    // Xss
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
            video: ["autoplay", "controls", "crossorigin", "loop", "muted", "playsinline", "poster", "preload", "src", "height", "width",],
        },
        css: false,
        allowCommentTag: false,
    }
}

wss.on('connection', async function connection(ws) {
    connectedClients.set(ws, null); // 默认匿名

    // 新连接的客户端不再直接通过 WebSocket 请求初始数据，而是通过 HTTP API 获取
    // 认证消息仍用于将 WebSocket 连接与 userId 关联
    ws.on('message', async function message(data) {
        try {
            const parsedMessage = JSON.parse(data.toString());

            if (parsedMessage.type === 'authenticate') {
                const token = parsedMessage.payload.token;
                if (token) {
                    jwt.verify(token, jwtSecret, (err: any, decoded: any) => {
                        if (!err && decoded && typeof decoded === 'object' && 'userId' in decoded) {
                            connectedClients.set(ws, decoded.userId as string);
                            console.log(`WebSocket 用户 ${decoded.userId} 已认证`);
                            // 认证成功后，可以推送特定于用户的信息，例如更新最近发布时间
                        } else {
                            console.warn('WebSocket 认证失败:', err);
                            ws.send(JSON.stringify({
                                type: 'auth_failed',
                                code: 'teamUp.authFailed',
                            }));
                        }
                    });
                } else {
                    // 没有提供 token，视为匿名用户
                }
            } else if (parsedMessage.type === 'publish_team_up') {
                const {player, description, expiresAt, tags} = parsedMessage.payload;
                const userId = connectedClients.get(ws);
                await addTeamUp({player, description, expiresAt: new Date(expiresAt), tags: tags || []}, userId);
            } else if (parsedMessage.type === 'cancel_team_up') {
                const {id} = parsedMessage.payload;
                const userId = connectedClients.get(ws);
                await cancelTeamUp(id, userId);
            }
        } catch (error) {
            console.error('解析或处理 WebSocket 消息失败:', error);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({type: 'error', message: '无效的消息格式或处理失败'}));
            }
        }
    });

    ws.on('close', () => {
        console.log('用户断开连接');
        connectedClients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket 错误:', error);
        connectedClients.delete(ws);
    });
});

async function addTeamUp(teamUpData: { player: string; description: string; tags: string[]; expiresAt: Date }, userId: string | null | undefined) {
    try {
        const userRepository = AppDataSource.getRepository(User);
        const teamUpRepository = AppDataSource.getRepository(TeamUp);

        let user: User | null = null;
        let lastPublishedAt: Date | null = null;

        if (userId) {
            user = await userRepository.findOneBy({id: userId});
            if (!user) {
                console.error(`用户 ID ${userId} 不存在`);
                broadcastToClients({
                    type: 'error',
                    error: 1,
                    code: 'teamUp.error',
                    message: '发布失败：用户不存在'
                }, userId);
                return;
            }
            lastPublishedAt = user.lastPublishedAt;
        } else {
            // 匿名用户，检查过去一小时内的发布数量
            const minIntervalAnonymous = 60 * 60 * 1000; // 1 小时
            const oneHourAgo = new Date(new Date().getTime() - minIntervalAnonymous);

            const anonymousPostsCount = await teamUpRepository
                .createQueryBuilder("team_up")
                .where("team_up.userId IS NULL")
                .andWhere("team_up.createdAt > :oneHourAgo", {oneHourAgo})
                .getCount();

            if (!config.__DEBUG__ && anonymousPostsCount >= 1) { // 简单假设匿名用户1小时只能发一条
                console.warn(`匿名用户发布过快，请 1 小时后再试`);
                broadcastToClients({
                    type: 'publish_rate_limit',
                    error: 1,
                    code: 'teamUp.anonymous.rateLimit',
                    remainingTime: minIntervalAnonymous
                }, userId);
                return;
            }
        }

        const now = new Date();
        const minIntervalRegistered = 2 * 60 * 1000; // 2 分钟

        if (lastPublishedAt && userId && (now.getTime() - lastPublishedAt.getTime()) < minIntervalRegistered) {
            const timeDiff = now.getTime() - lastPublishedAt.getTime();

            console.warn(`用户 ${userId} 发布过快，请 ${Math.ceil((minIntervalRegistered - timeDiff) / 1000 / 60)} 分钟后再试`);

            broadcastToClients({
                type: 'publish_rate_limit',
                error: 1,
                code: 'teamUp.account.rateLimit',
                remainingTime: minIntervalRegistered - timeDiff
            }, userId);
            return;
        }

        if (teamUpData.tags)
            teamUpData.tags = teamUpData.tags.filter(tag => teamConfig.tags.includes(tag));

        const newTeamUp = teamUpRepository.create({
            ...teamUpData,
            user: user,
            userId: userId
        });
        await teamUpRepository.save(newTeamUp);

        if (user) {
            user.lastPublishedAt = now;
            await userRepository.save(user);
        }

        console.log(`发布新的组队信息: ${newTeamUp.player} (用户ID: ${userId || '匿名'})`);

        // 发布成功后，通知所有客户端新的组队信息，并触发前端重新加载列表
        const payload = {
            id: newTeamUp.id,
            player: handleRichTextInput(newTeamUp.player),
            description: handleRichTextInput(newTeamUp.description),
            tags: newTeamUp.tags,
            expiresAt: newTeamUp.expiresAt.getTime(),
            createdAt: newTeamUp.createdAt.getTime(),
            username: user ? user.username : 'none',
            userId: newTeamUp.userId, // 用于前端判断是否是自己的发布
        };

        // 广播新组队信息给所有客户端 (以便实时更新)
        broadcastToClients({
            type: 'new_team_up',
            code: 'teamUp.newTeamUp',
            payload
        });

    } catch (error) {
        console.error('添加组队信息失败:', error);
        broadcastToClients({
            type: 'error',
            code: 'teamUp.error',
            message: '发布失败'
        }, userId);
    }
}

async function cancelTeamUp(id: string, userId: string | null | undefined) {
    try {
        const teamUpRepository = AppDataSource.getRepository(TeamUp);
        const teamUp = await teamUpRepository.findOneBy({id});

        if (!teamUp) {
            console.log(`未找到 ID 为 ${id} 的组队信息。`);
            broadcastToClients({type: 'error', message: '组队信息不存在或已被删除'}, userId);
            return;
        }

        if (teamUp.userId !== userId) {
            console.warn(`用户 ${userId} 试图取消不属于自己的组队信息 ${id}`);
            broadcastToClients({type: 'error', message: '您无权取消此组队信息'}, userId);
            return;
        }

        const result = await teamUpRepository.delete(id);

        if (result.affected && result.affected > 0) {
            console.log(`组队信息已主动取消: ID ${id} (用户ID: ${userId})`);
            broadcastToClients({type: 'team_up_expired', payload: {id}});
        } else {
            console.log(`未找到 ID 为 ${id} 的组队信息或已被删除。`);
        }
    } catch (error) {
        console.error(`取消组队信息 ID ${id} 失败:`, error);
        broadcastToClients({type: 'error', message: '取消失败'}, userId);
    }
}

function broadcastToClients(message: any, targetUserId: string | null = null) {
    connectedClients.forEach((currentUserId, client) => {
        if (client.readyState === WebSocket.OPEN) {
            if (targetUserId === null || currentUserId === targetUserId) {
                client.send(JSON.stringify(message));
            }
        }
    });
}

async function cleanExpiredTeamUps() {
    try {
        const teamUpRepository = AppDataSource.getRepository(TeamUp);
        const expiredTeamUps = await teamUpRepository
            .createQueryBuilder("team_up")
            .where("team_up.expiresAt <= NOW()")
            .getMany();

        if (expiredTeamUps.length > 0) {
            const expiredIds = expiredTeamUps.map(t => t.id);
            await teamUpRepository.delete(expiredIds);

            console.log(`删除已过期组队信息: ${expiredIds.length} 条`);
            expiredIds.forEach(id => {
                broadcastToClients({type: 'team_up_expired', payload: {id}});
            });
        }
    } catch (error) {
        console.error('清理过期组队信息失败:', error);
    }
}

function handleRichTextInput(content: string) {
    return xss(content, teamConfig.xss);
}

// 检索
router.get('/teamups', timeUpRateLimiter, [
    checkquery("page").optional().isInt({min: 1}).toInt(),
    checkquery("limit").optional().isInt({min: 1, max: 100}).toInt(),
    checkquery("sortBy").isIn(['recent', 'expires']),
    checkquery('keyword').optional().isString().isLength({max: 100}).trim(),
], async (req: Request, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'teamups.bad', message: validateErr.array()});

        const {keyword, sortBy, page = 1, limit = 20} = req.query;

        let query = db('team_up')
            .leftJoin('user', 'team_up.userId', 'user.id')
            .select(
                'team_up.*',
                'user.username',
                db.raw('UNIX_TIMESTAMP(team_up.expiresAt) as expiresAtTimestamp'),
                db.raw('UNIX_TIMESTAMP(team_up.createdAt) as createdAtTimestamp')
            )
            .where('team_up.expiresAt', '>', db.fn.now());

        if (keyword && typeof keyword === 'string') {
            const searchKeyword = `%${keyword.toLowerCase()}%`;

            query.where(function () {
                this.where(db.raw('LOWER(team_up.name)'), 'LIKE', searchKeyword)
                    .orWhere(db.raw('JSON_SEARCH(LOWER(team_up.tags), "one", ?)', [keyword.toLowerCase()]));
            });
        }

        // Sort
        if (sortBy === 'recent') {
            query.orderBy('team_up.createdAt', 'desc');
        } else {
            query.orderBy('team_up.expiresAt', 'asc');
        }

        const totalQuery = query.clone().clearSelect().count('* as total');
        const totalResult = await totalQuery.first();
        const total = totalResult ? (totalResult as any).total : 0;

        query.limit(limit).offset((page - 1) * limit);

        const teamUps = await query;

        const formattedTeamUps = teamUps.map(t => ({
            id: t.id,
            player: t.player,
            description: t.description,
            tags: t.tags,
            expiresAt: t.expiresAtTimestamp,
            createdAt: t.createdAtTimestamp,
            username: t.username || '匿名用户',
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
        console.error('检索组队信息失败:', error);
        res.status(500).json({error: 1, code: 'teamups.error', message: '检索组队信息失败'});
    }
});

router.get('/teamup/statistics', timeUpRateLimiter, async (req: Request, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'teamups.statistics.bad', message: validateErr.array()});

        let query = db('team_up')
            .leftJoin('user', 'team_up.userId', 'user.id')
            .select(
                'team_up.*',
                'user.username',
            );

        const totalQuery = query.clone().clearSelect().count('* as total');
        const totalResult = await totalQuery.first();
        const total = totalResult ? (totalResult as any).total : 0;

        res.status(200).setHeader('Cache-Control', 'public, max-age=60').json({
            success: 1,
            code: 'teamups.statistics.success',
            data: total
        });
    } catch (error) {
        res.status(500).json({error: 1, code: 'teamup.statistics.error', message: '检索组队信息失败'});
    }
});

export {
    cleanExpiredTeamUps,
    router
}
