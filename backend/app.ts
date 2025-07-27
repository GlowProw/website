import 'reflect-metadata';

import express from 'express';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import cors from 'cors';
import cron from "node-cron";

import AppDataSource from "./src/ormconfig";
import config from "./config";
import {generateCaptcha} from "./src/lib/captcha";
import {captchaRateLimiter, limiter} from "./src/middleware/rateLimiter";
import i18n from "./i18n";
import logger from "./logger";

// import routers
import {cleanExpiredTeamUps, router as team_index} from "./src/routers/team";
import user_index from './src/routers/user'
import calendar_index from './src/routers/calendar'
import assembly_index from './src/routers/assembly'
import links_index from './src/routers/likes'

try {
    dotenv.config();

    const app = express();

    app.set('trust proxy', false).use(limiter);

    app.use(cors());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());             // 解析 JSON 请求体

    app.use(async (req, res, next) => {
        res.header('Access-Control-Allow-Origin', req.header('Origin') || '*');                                                 // better than wildcard *
        res.header('Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept, x-access-token' + (config.__DEBUG__ ? ', x-whosdaddy, x-whosdaddy-p' : ''));   // DEBUG
        res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Cache-Control', "no-cache");

        // set ip
        const host = req.headers.host;
        const protocol = req.headers['x-forwarded-proto'] || req.protocol;

        req['$AppBaseUrl'] = `${protocol}://${host}`;
        next();
    });


    const authenticateJWT = (req: any, res: any, next: any) => {
        const authHeader = req.headers.authorization;

        if (authHeader) {
            const token = authHeader.split(' ')[1];
            jwt.verify(token, config.secret, (err, user) => {
                if (err) {
                    // 如果 Token 无效或过期，也允许访问，但 userId 不设置
                    console.warn('JWT Verification failed:', err.message);
                    return next();
                }
                req.userId = (user as { userId: string }).userId;
                next();
            });
        } else {
            next();
        }
    };

    AppDataSource.initialize().then();

    const cleanWork = cron.schedule('* * * * *', cleanExpiredTeamUps);

    app.use(authenticateJWT); // 将认证中间件应用于所有请求

    // routers
    app.get('/api/captcha', captchaRateLimiter, (req, res, next) => {
        res.status(200).json({success: 1, code: 'captcha.gen', data: generateCaptcha()});
    });
    app.use('/api', user_index, team_index);
    app.use('/api/calendar', calendar_index);
    app.use('/api/assembly', assembly_index);
    app.use('/api/likes', links_index)

    app.use((req, res, next) => {
        res.status(404).json({error: 1, code: 'request.404'});
    });

    app.listen(config.port, async () => {
        await i18n.ready;

        logger.info(`已启动定时任务，${cleanWork.getStatus()}`);
        logger.info(`服务器已启动在 http://localhost:${config.port}`);
    });
} catch (error) {
    logger.error('连接 MySQL 失败或服务器启动失败:', error);
    process.exit(1);
}
