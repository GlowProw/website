import express, {Request, Response} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {body as checkbody, validationResult} from "express-validator";

import AppDataSource from "../ormconfig";
import {Users} from "../entity/Users";
import verifyCaptcha from "../middleware/captcha";
import config from "../../config";
import {loginRateLimiter, registerRateLimiter} from "../middleware/rateLimiter";
import logger from "../../logger";

const router = express.Router();

/**
 * 注册
 */
router.post('/register', registerRateLimiter, verifyCaptcha, [
    checkbody("username").isString().trim().isLength({ min: 3, max: 40 }).matches(/^[a-zA-Z0-9_]+$/),
    checkbody('password').isString().trim().isLength({ min: 8, max: 64 }),
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

export default router;
