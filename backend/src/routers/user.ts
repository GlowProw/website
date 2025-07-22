import express, {Request, Response} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {body as checkbody, validationResult} from "express-validator";

import AppDataSource from "../ormconfig";
import {User} from "../entity/User";
import verifyCaptcha from "../middleware/captcha";
import config from "../../config";
import {loginRateLimiter, registerRateLimiter} from "../middleware/rateLimiter";

const router = express.Router();

/**
 * 注册
 */
router.post('/register', registerRateLimiter, verifyCaptcha, [
    checkbody("username").isString().trim().isLength({min: 1, max: 40}),
    checkbody('password').isString().trim().isLength({min: 1, max: 40}),
    checkbody('email').optional().isEmail(),
], async (req: Request, res: Response) => {
    const validateErr = validationResult(req);
    if (!validateErr.isEmpty())
        return res.status(400).json({error: 1, code: 'register.bad', message: validateErr.array()});

    const {username, password, email} = req.body;

    try {
        const userRepository = AppDataSource.getRepository(User);
        const existingUser = await userRepository.findOneBy({username});

        if (existingUser) {
            return res.status(409).json({error: 1, code: 'register.userAlreadyHas', message: '用户名已存在'});
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = userRepository.create({username, passwordHash});

        await userRepository.save(newUser);

        res.status(200).json({code: 0, message: 'register.ok'});
    } catch (error) {
        res.status(500).json({code: 500, message: 'register.error'});
    }
});

/**
 * 登陆
 */
router.post('/login', loginRateLimiter, verifyCaptcha, [
    checkbody("username").isString().trim().isLength({min: 1, max: 40}),
    checkbody('password').isString().trim().isLength({min: 1, max: 40}),
], async (req: Request, res: Response) => {
    const validateErr = validationResult(req);
    if (!validateErr.isEmpty())
        return res.status(400).json({error: 1, code: 'login.bad', message: validateErr.array()});

    const {username, password} = req.body;

    try {
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOneBy({username});
        if (!user) {
            return res.status(401).json({code: 112, message: '用户名或密码不正确'});
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({code: 112, message: '用户名或密码不正确'});
        }

        // 密码正确，生成 JWT
        const token = jwt.sign({userId: user.id, username: user.username}, config.secret, {expiresIn: '1h'});

        res.status(200).json({
            code: 0,
            message: 'login.ok',
            data: {
                token,
                userId: user.id,
                username: user.username
            }
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({code: 500, message: '登录失败，请稍后再试'});
    }
});

export default router;
