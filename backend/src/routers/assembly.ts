import express, {Response} from "express";
import {body as checkbody, query as checkquery, validationResult} from "express-validator";
import verifyCaptcha from "../middleware/captcha";
import logger from "../../logger";
import db from "../../mysql";
import {verifyJWT} from "../middleware/auth";

const router = express.Router();

/**
 * 发布
 */
/**
 * 发布配装
 */
router.post('/publish', verifyJWT, [
    checkbody("name").isString().trim().isLength({min: 1, max: 140}),
    checkbody('description').optional().isString().trim().isLength({min: 1, max: 500}),
    checkbody('data').isJSON(),
    checkbody('localUid').optional(),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'publish.bad', message: validateErr.array()});

        const {name, description, data, localUid} = req.body;

        // 验证JSON数据是否有效
        let parsedData;
        try {
            parsedData = JSON.parse(data);
            // 这里可以添加对配装数据的具体验证逻辑
            // 例如检查必须的字段是否存在，格式是否正确等
        } catch (e) {
            return res.status(400).json({
                code: 400,
                message: 'publish.invalid_data',
                details: '配装数据必须是有效的JSON格式'
            });
        }

        // 检查配装名称是否已存在（可根据需求决定是否需要唯一性检查）
        console.log(req)
        const existingAssembly = await db('assembly')
            .where('name', name)
            .andWhere('userId', req.user.id) // 只检查当前用户的配装名称
            .first();

        if (existingAssembly) {
            return res.status(400).json({
                code: 400,
                message: 'publish.name_exists',
                details: '您已有一个同名的配装'
            });
        }

        // 准备插入数据库的数据
        const assemblyData = {
            name,
            description,
            data: JSON.stringify(parsedData), // 确保数据是字符串格式存储
            userId: req.user.id, // 假设req.user包含当前用户信息
            createdTime: db.fn.now(),
            updatedTime: db.fn.now(),
            localUid: localUid || null // 保存客户端本地ID（如果有）
        };

        // 执行插入操作
        const [insertedId] = await db('assembly')
            .insert(assemblyData)
            .returning('id'); // 根据数据库支持情况可能需要调整

        // 获取完整的配装信息返回给客户端
        const newAssembly = await db('assembly')
            .where('id', insertedId)
            .first();

        res.status(200).json({
            code: 0,
            message: 'publish.success',
            data: {
                id: newAssembly.id,
                name: newAssembly.name,
                description: newAssembly.description,
                createdTime: newAssembly.createdTime,
                updatedTime: newAssembly.updatedTime
            }
        });
    } catch (error) {
        logger.error('publish error:', error);
        res.status(500).json({
            code: 500,
            message: 'publish.error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * 获取用户配装列表
 */
router.get('/list', [
    checkquery('userId').optional().isString().trim(),
    checkquery('page').optional().isInt({min: 1}).toInt(),
    checkquery('pageSize').optional().isInt({min: 1, max: 100}).toInt(),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'list.bad', message: validateErr.array()});

        const {userId} = req.query;
        const page = req.query.page || 1;
        const pageSize = req.query.pageSize || 20;

        let query = db('assembly').select(
            'id',
            'name',
            'description',
            'createdTime',
            'updatedTime',
            'userId',
            'data'
        );

        if (userId) {
            query = query.where('userId', userId);
        }

        // 分页查询
        const assemblies = await query
            .orderBy('updatedTime', 'desc')
            .offset((page - 1) * pageSize)
            .limit(pageSize);

        // 获取总数
        const totalQuery = userId
            ? db('assembly').where('user_id', userId).count('id as count')
            : db('assembly').count('id as count');

        const totalResult = await totalQuery.first();
        const total = totalResult ? totalResult.count : 0;

        res.status(200).json({
            code: 0,
            data: {
                data: assemblies,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        });
    } catch (error) {
        logger.error('list error:', error);
        res.status(500).json({code: 500, message: 'list.error'});
    }
});

/**
 * 编辑配装
 */
router.post('/edit', verifyCaptcha, [
    checkbody('id').isString().trim().isLength({min: 1}),
    checkbody("name").optional().isString().trim().isLength({min: 1, max: 40}),
    checkbody('description').optional().isString().trim().isLength({min: 1, max: 40}),
    checkbody('data').optional().isJSON(),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'update.bad', message: validateErr.array()});

        const {id} = req.params;
        const {name, description, data} = req.body;

        // 检查配装是否存在
        const assembly = await db('assembly')
            .where('id', id)
            .first();

        if (!assembly) {
            return res.status(404).json({code: 404, message: 'assembly.not_found'});
        }

        // 检查用户是否有权限编辑 (假设req.user中包含当前用户信息)
        if (assembly.userID !== req.user.id) {
            return res.status(403).json({code: 403, message: 'update.forbidden'});
        }

        // 构建更新数据
        const updateData: any = {
            updatedTime: db.fn.now()
        };

        if (name) updateData.name = name;
        if (description) updateData.description = description;
        if (data) updateData.data = data;

        // 执行更新
        await db('assembly')
            .where('id', id)
            .update(updateData);

        res.status(200).json({code: 0, message: 'update.ok'});
    } catch (error) {
        logger.error('update error:', error);
        res.status(500).json({code: 500, message: 'update.error'});
    }
});

/**
 * 获取配装详情
 */
router.get('/item', [
    checkquery('id').isString().trim().isLength({min: 1}),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'detail.bad', message: validateErr.array()});

        const {id} = req.query;

        const assembly = await db('assembly')
            .join('users', 'assembly.userId', 'users.id')
            .where('assembly.id', id)
            .select(
                'users.username',
                'assembly.id', 'assembly.userId', 'assembly.name', 'assembly.description',
                'assembly.createdTime', 'assembly.updatedTime', 'assembly.data as assembly'
            )
            .first();

        if (!assembly) {
            return res.status(404).json({code: 404, message: 'assembly.notFound'});
        }

        res.status(200).json({
            code: 0,
            data: assembly
        });
    } catch (error) {
        logger.error('detail error:', error);
        res.status(500).json({code: 500, message: 'detail.error'});
    }
});

/**
 * 删除配装
 */
router.post('/delete', [
    checkbody('id').isString().trim().isLength({min: 1}),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'delete.bad', message: validateErr.array()});

        const {id} = req.params;

        // 检查配装是否存在
        const assembly = await db('assembly')
            .where('id', id)
            .first();

        if (!assembly) {
            return res.status(404).json({code: 404, message: 'assembly.notFound'});
        }

        // 检查用户是否有权限删除
        if (assembly.userID !== req.user.id) {
            return res.status(403).json({code: 403, message: 'delete.forbidden'});
        }

        // 执行删除
        await db('assembly')
            .where('id', id)
            .delete();

        res.status(200).json({code: 0, message: 'delete.ok'});
    } catch (error) {
        logger.error('delete error:', error);
        res.status(500).json({code: 500, message: 'delete.error'});
    }
});

export default router;
