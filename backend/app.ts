import 'reflect-metadata';

import express, {NextFunction, Request, Response} from 'express';
import dotenv from 'dotenv';

import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import cors from 'cors';
import user_index from './src/routers/user'
import AppDataSource from "./src/ormconfig";
import {cleanExpiredTeamUps} from "./src/routers/team";
import config from "./config";
import {generateCaptcha} from "./src/lib/captcha";
import {captchaRateLimiter} from "./src/middleware/rateLimiter";

try {
    dotenv.config();

    const app = express();
    const httpServerPort = parseInt(config.port);
    const jwtSecret = config.secret;

    app.use(cors());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json()); // 解析 JSON 请求体
    app.use(express.static('public')); // 提供静态文件

    // cors options
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', req.header('Origin') || '*'); // better than wildcard *
        res.header('Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept, x-access-token' + (config.__DEBUG__ ? ', x-whosdaddy, x-whosdaddy-p' : ''));  // DEBUG
        res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Cache-Control', "no-cache");
        next();
    });

    // JWT 认证中间件
    interface AuthenticatedRequest extends Request {
        userId?: string;
    }

    const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        if (authHeader) {
            const token = authHeader.split(' ')[1];
            jwt.verify(token, jwtSecret, (err, user) => {
                if (err) {
                    // 如果 Token 无效或过期，也允许访问，但 userId 不设置
                    console.warn('JWT 验证失败:', err.message);
                    return next();
                }
                req.userId = (user as { userId: string }).userId;
                next();
            });
        } else {
            next();
        }
    };

    AppDataSource.initialize();

    setInterval(cleanExpiredTeamUps, 60 * 1000);
    // console.log('已启动定时任务，每分钟清理过期组队信息');

    app.use(authenticateJWT); // 将认证中间件应用于所有请求
    app.get('/api/captcha', captchaRateLimiter, (req, res, next) => {
        res.status(200).json({success: 1, code: 'captcha.gen', data: generateCaptcha()});
    });
    app.use('/api', user_index);

    app.use((req, res, next) => {
        res.status(404).json({error: 1, code: 'request.404'});
    });

    app.listen(httpServerPort, () => {
        console.log(`HTTP 服务器已启动在 http://localhost:${httpServerPort}`);
    });
} catch (error) {
    console.error('连接 MySQL 失败或服务器启动失败:', error);
    process.exit(1);
}
