// 注册
import express, {Request, Response} from "express";
import dotenv from 'dotenv';
import AppDataSource from "../ormconfig";
import {User} from "../entity/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {TeamUp} from "../entity/TeamUp";

dotenv.config();

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';

router.post('/register', async (req: Request, res: Response) => {
    const {username, password} = req.body;
    if (!username || !password) {
        return res.status(400).json({code: 110, message: '用户名和密码不能为空'});
    }

    try {
        const userRepository = AppDataSource.getRepository(User);
        const existingUser = await userRepository.findOneBy({username});
        if (existingUser) {
            return res.status(409).json({code: 100, message: '用户名已存在'});
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = userRepository.create({username, passwordHash});
        await userRepository.save(newUser);
        res.status(200).json({code: 0, message: 'register.ok'});
    } catch (error) {
        res.status(500).json({code: 500, message: 'register.error'});
    }
});

router.post('/login', async (req: Request, res: Response) => {
    const {username, password} = req.body;
    if (!username || !password) {
        return res.status(400).json({code: 111, message: '用户名和密码不能为空'});
    }

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
        const token = jwt.sign({userId: user.id, username: user.username}, jwtSecret, {expiresIn: '1h'});

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

// 检索
router.get('/teamups', async (req: Request, res: Response) => {
    try {
        const teamUpRepository = AppDataSource.getRepository(TeamUp);
        const {keyword, sortBy} = req.query; // 获取查询参数

        const queryBuilder = teamUpRepository
            .createQueryBuilder("team_up")
            .leftJoinAndSelect("team_up.user", "user") // 关联 User 表以获取发布者信息
            .where("team_up.expiresAt > NOW()"); // 只查询未过期的

        // 关键词搜索
        if (keyword && typeof keyword === 'string') {
            const searchKeyword = `%${keyword.toLowerCase()}%`; // 转换为小写并添加通配符

            // TypeORM 查询 JSON 字段需要特殊语法，通常用 JSON_CONTAINS 或 JSON_SEARCH
            // 这里我们使用 MySQL 的 JSON_CONTAINS
            queryBuilder.andWhere(
                "(LOWER(team_up.name) LIKE :searchKeyword OR JSON_CONTAINS(LOWER(team_up.tags), JSON_QUOTE(:keywordExact)))",
                {searchKeyword, keywordExact: keyword.toLowerCase()} // keywordExact 用于 JSON_CONTAINS
            );
            // 注意：JSON_CONTAINS 匹配的是精确值，如果你想模糊匹配 JSON 数组里的每个字符串，会更复杂
            // 对于简单的标签匹配，可以转换为字符串后用 LIKE，或者循环每个标签。
            // 示例：JSON_CONTAINS(team_up.tags, '"tag_value"')
        }

        // 排序
        if (sortBy === 'recent') {
            queryBuilder.orderBy("team_up.createdAt", "DESC"); // 按发布时间降序
        } else {
            // 默认排序，例如按过期时间升序或创建时间升序
            queryBuilder.orderBy("team_up.expiresAt", "ASC");
        }

        const teamUps = await queryBuilder.getMany();

        // 格式化输出数据，包含发布者用户名
        const formattedTeamUps = teamUps.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            tags: t.tags,
            expiresAt: t.expiresAt.getTime(),
            createdAt: t.createdAt.getTime(),
            username: t.user ? t.user.username : '匿名用户', // 如果有用户，则显示用户名
            userId: t.userId // 客户端判断是否是自己的发布
        }));

        res.status(200).json({code: 0, data: formattedTeamUps});
    } catch (error) {
        console.error('检索组队信息失败:', error);
        res.status(500).json({message: '检索组队信息失败'});
    }
});

export default router;
