import express, {Response} from "express";
import {body as checkbody, query as checkquery, validationResult} from "express-validator";
import logger from "../../logger";
import db from "../../mysql";
import {verifyJWT} from "../middleware/auth";
import {v6 as uuidv6} from "uuid"
import {sanitizeRichText} from "../lib/content";

const router = express.Router();
const assemblyConfig = {
    nameMaxLength: 140,
    descriptionMaxLength: 500
}

/**
 * 发布配装
 */
router.post('/publish', verifyJWT, [
    checkbody("name").isString().trim().isLength({min: 1, max: assemblyConfig.nameMaxLength}),
    checkbody('description').optional().isString().trim().isLength({max: assemblyConfig.descriptionMaxLength}),
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
        } catch (e) {
            return res.status(400).json({
                error: 1,
                message: 'publish.invalidData',
                details: '配装数据必须是有效的JSON格式'
            });
        }

        // 检查配装名称是否已存在（可根据需求决定是否需要唯一性检查）
        const existingAssembly = await db('assembly')
            .where('name', name)
            .andWhere('userId', req.user.id) // 只检查当前用户的配装名称
            .first();

        if (existingAssembly) {
            return res.status(400).json({
                error: 1,
                code: 'publish.nameExists',
            });
        }

        // 准备插入数据库的数据
        const assemblyData = {
            name,
            description,
            uuid: uuidv6(),
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
            code: 'publish.success',
            data: {
                id: newAssembly.uuid,
                name: newAssembly.name,
            }
        });
    } catch (error) {
        logger.error('publish error:', error);
        res.status(500).json({
            error: 1,
            code: 'publish.error'
        });
    }
});

/**
 * 获取用户配装列表
 */
router.get('/list', [
    checkquery('keyword').optional().isString().trim(),
    checkquery('page').optional().isInt({min: 1}).toInt(),
    checkquery('pageSize').optional().isInt({min: 1, max: 100}).toInt(),
    checkquery('sortField').optional().isIn(['createdTime', 'updatedTime', 'likes']),
    checkquery('sortOrder').optional().isIn(['asc', 'desc']),
    checkquery('createdStart').optional().isISO8601(),
    checkquery('createdEnd').optional().isISO8601(),
    checkquery('updatedStart').optional().isISO8601(),
    checkquery('updatedEnd').optional().isISO8601(),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty()) {
            return res.status(400).json({error: 1, code: 'list.bad', message: validateErr.array()});
        }

        const {
            keyword,
            page = 1,
            pageSize = 20,
            sortField = 'updatedTime',
            sortOrder = 'desc',
            createdStart,
            createdEnd,
            updatedStart,
            updatedEnd
        } = req.query;

        // 基础查询
        let query = db('assembly')
            .select(
                'assembly.id',
                'assembly.uuid',
                'assembly.name',
                'assembly.description',
                'assembly.createdTime',
                'assembly.updatedTime',
                'assembly.userId',
                'assembly.data',
                db.raw('(SELECT COUNT(*) FROM likes WHERE targetType = "assembly" AND targetId = assembly.uuid) as likes')
            )
            .leftJoin('users', 'assembly.userId', 'users.id');

        // 关键词模糊查询（配装名称或用户名称）
        if (keyword) {
            query = query.where(function() {
                this.where('assembly.name', 'like', `%${keyword}%`)
                    .orWhere('users.username', 'like', `%${keyword}%`);
            });
        }

        // 创建时间范围筛选
        if (createdStart) {
            query = query.where('assembly.createdTime', '>=', createdStart);
        }
        if (createdEnd) {
            query = query.where('assembly.createdTime', '<=', createdEnd);
        }

        // 更新时间范围筛选
        if (updatedStart) {
            query = query.where('assembly.updatedTime', '>=', updatedStart);
        }
        if (updatedEnd) {
            query = query.where('assembly.updatedTime', '<=', updatedEnd);
        }

        // 排序逻辑
        switch (sortField) {
            case 'createdTime':
                query = query.orderBy('assembly.createdTime', sortOrder);
                break;
            case 'updatedTime':
                query = query.orderBy('assembly.updatedTime', sortOrder);
                break;
            case 'likes':
                query = query.orderByRaw(`
                    (SELECT COUNT(*) FROM likes WHERE targetType = "assembly" AND targetId = assembly.uuid) ${sortOrder}
                `);
                break;
        }

        // 分页查询
        const assemblies = await query
            .offset((page - 1) * pageSize)
            .limit(pageSize);

        // 获取总数（保持相同的筛选条件）
        let totalQuery = db('assembly')
            .leftJoin('users', 'assembly.userId', 'users.id');

        if (keyword) {
            totalQuery = totalQuery.where(function() {
                this.where('assembly.name', 'like', `%${keyword}%`)
                    .orWhere('users.username', 'like', `%${keyword}%`)
            });
        }
        if (createdStart) {
            totalQuery = totalQuery.where('createdTime', '>=', createdStart);
        }
        if (createdEnd) {
            totalQuery = totalQuery.where('createdTime', '<=', createdEnd);
        }
        if (updatedStart) {
            totalQuery = totalQuery.where('updatedTime', '>=', updatedStart);
        }
        if (updatedEnd) {
            totalQuery = totalQuery.where('updatedTime', '<=', updatedEnd);
        }

        const totalResult = await totalQuery.count('assembly.id as count').first();
        const total = totalResult ? Number(totalResult.count) : 0;

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
        res.status(500).json({error: 1, code: 'list.error'});
    }
});

/**
 * 编辑配装
 * 路由: POST /edit
 * 参数:
 *   - id: 配装id
 *   - name
 *   - description
 *   - data
 */
router.post('/edit', verifyJWT, [
    checkbody('uuid').isString().trim().isLength({min: 1}),
    checkbody("name").isString().trim().isLength({min: 1, max: assemblyConfig.nameMaxLength}),
    checkbody('description').optional().isString().trim().isLength({min: 1, max: assemblyConfig.descriptionMaxLength}),
    checkbody('tags').isArray(),
    checkbody('data').isJSON(),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'edit.bad', message: validateErr.array()});

        const {uuid, name, description, tags, data} = req.body;

        // 检查配装是否存在
        const assembly = await db('assembly')
            .where('uuid', uuid)
            .andWhere('userId', req.user.id)
            .first();

        if (!assembly) {
            return res.status(404).json({error: 1, code: 'edit.notFound'});
        }

        // 检查用户是否有权限编辑 (假设req.user中包含当前用户信息)
        if (assembly.userId !== req.user.id) {
            return res.status(403).json({error: 1, code: 'edit.forbidden'});
        }

        // 构建更新数据
        const updateData: any = {
            updatedTime: db.fn.now()
        };

        if (name) updateData.name = sanitizeRichText(name);
        if (description) updateData.description = sanitizeRichText(description);
        if (data) updateData.data = data;
        if (tags) updateData.tags = JSON.stringify(tags);

        // 执行更新
        await db('assembly')
            .where('uuid', uuid)
            .andWhere('userId', req.user.id)
            .update(updateData);

        res.status(200).json({code: 'edit.ok'});
    } catch (error) {
        logger.error('update error:', error);
        res.status(500).json({error: 1, code: 'edit.error'});
    }
});

/**
 * 获取配装详情
 * 路由: GET /item
 * 参数:
 *   - id: 配装id
 */
router.get('/item', [
    checkquery('uuid').isString().trim().isLength({min: 1}),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'detail.bad', message: validateErr.array()});

        const {uuid} = req.query;

        const assembly = await db('assembly')
            .join('users', 'assembly.userId', 'users.id')
            .where('assembly.uuid', uuid)
            .select(
                'users.username', 'users.id as userId',
                'assembly.uuid', 'assembly.userId', 'assembly.name', 'assembly.description',
                'assembly.createdTime', 'assembly.updatedTime', 'assembly.tags', 'assembly.data as assembly'
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
        res.status(500).json({error: 1, code: 'detail.error'});
    }
});

/**
 * 删除配装
 */
router.post('/delete', verifyJWT, [
    checkbody('uuid').isString().trim().isLength({min: 1}),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'delete.bad', message: validateErr.array()});

        const {uuid} = req.body;

        // 检查配装是否存在
        const assembly = await db('assembly')
            .where('uuid', uuid)
            .andWhere('userId', req.user.id)
            .first();

        if (!assembly) {
            return res.status(404).json({error: 1, code: 'assembly.notFound'});
        }

        // 检查用户是否有权限删除
        if (assembly.userId !== req.user.id) {
            return res.status(403).json({error: 1, code: 'delete.forbidden'});
        }

        // 执行删除
        await db('assembly')
            .where('uuid', uuid)
            .delete();

        res.status(200).json({code: 'delete.ok'});
    } catch (error) {
        logger.error('delete error:', error);
        res.status(500).json({error: 1, code: 'delete.error'});
    }
});

export default router;
