import express, {Response} from "express";
import {body as checkbody, query as checkquery, validationResult} from "express-validator";
import logger from "../../logger";
import db from "../../mysql";
import {supposeBackJWT, verifyJWT} from "../middleware/auth";
import {v6 as uuidV6} from "uuid"
import {sanitizeRichText, xss} from "../lib/content";
import {assemblySetAttributes, assemblyShowAttributes} from "../lib/assembly";

const router = express.Router();
const assemblyConfig = {
    nameMaxLength: 140,
    descriptionMaxLength: 10000
}

/**
 * 处理标签内容
 * @param data
 */
function handlingLabels(data: string[]) {
    if (data)
        return data.map(i => xss(i));
    return data
}

/**
 * 发布配装
 */
router.post('/publish', verifyJWT, [
    checkbody("name").isString().trim().isLength({min: 1, max: assemblyConfig.nameMaxLength}),
    checkbody('description').optional().isString().trim().isLength({max: assemblyConfig.descriptionMaxLength}),
    checkbody('tags').optional().isArray(),
    checkbody('data').isObject(),
    checkbody('attr').optional({nullable: true}).isObject(),
    checkbody('visibility').optional().default('publicly').isIn(['publicly', 'private']),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'publish.bad', message: validateErr.array()});

        const {name, description, tags, data, attr, visibility} = req.body;

        // 检查配装名称是否已存在
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
        let assemblyData: any = {
            name,
            description,
            uuid: uuidV6(),
            data: JSON.stringify(data),
            userId: req.user.id,
            visibility: visibility,
            createdTime: db.fn.now(),
            updatedTime: db.fn.now(),
        };

        if (tags) assemblyData.tags = JSON.stringify(handlingLabels(tags));
        if (attr) assemblyData.attr = JSON.stringify(assemblySetAttributes(assemblyData.attr || {}, attr, false));

        // 执行插入操作
        const [insertedId] = await db('assembly')
            .insert(assemblyData)
            .returning('id');

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
    checkquery('isHasPassword').optional().default(false).isBoolean(),
    checkquery('createdStart').optional().isISO8601(),
    checkquery('createdEnd').optional().isISO8601(),
    checkquery('updatedStart').optional().isISO8601(),
    checkquery('updatedEnd').optional().isISO8601(),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty()) {
            return res.status(400).json({error: 1, code: 'assembly.list.bad', message: validateErr.array()});
        }

        const {
            keyword,
            page = 1,
            pageSize = 20,
            sortField = 'updatedTime',
            sortOrder = 'desc',
            isHasPassword,
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
                'assembly.attr',
                'assembly.userId',
                'assembly.data as assembly',
                'assembly.visibility',
                db.raw('(SELECT COUNT(*) FROM likes WHERE targetType = "assembly" AND targetId = assembly.uuid) as likes')
            )
            .where('assembly.visibility', '=', 'publicly')
            .where(function () {
                this.where(db.raw('assembly.attr->>"$.password"'), !isHasPassword ? '!=' : '=', '');
            })
            .leftJoin('users', 'assembly.userId', 'users.id');

        // 关键词模糊查询（配装名称或用户名称）
        if (keyword) {
            query = query.where(function () {
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
        const assemblies: any = await query
            .offset((page - 1) * pageSize)
            .limit(pageSize);

        // 获取总数（保持相同的筛选条件）
        let totalQuery = db('assembly')
            .leftJoin('users', 'assembly.userId', 'users.id');

        if (keyword) {
            totalQuery = totalQuery.where(function () {
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

        if (assemblies.attr)
            assemblies.attr = assemblyShowAttributes(assemblies.attr)

        res.status(200).json({
            code: 'assembly.list.ok',
            data: {
                data: assemblies,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            },
        });
    } catch (error) {
        logger.error('list error:', error);
        res.status(500).json({error: 1, code: 'assembly.list.error'});
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
    checkbody('description').optional({nullable: true}).isString().trim().isLength({max: assemblyConfig.descriptionMaxLength}),
    checkbody('tags').optional({nullable: true}).isArray(),
    checkbody('visibility').optional().isIn(['publicly', 'private']),
    checkbody('attr').optional({nullable: true}).isObject(),
    checkbody('data').isObject(),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'assembly.edit.bad', message: validateErr.array()});

        const {uuid, name, description, tags, visibility, attr, data} = req.body;

        // 检查配装是否存在
        const assembly = await db('assembly')
            .where('uuid', uuid)
            .andWhere('userId', req.user.id)
            .first();

        if (!assembly) {
            return res.status(404).json({error: 1, code: 'assembly.edit.notFound'});
        }

        // 检查用户是否有权限编辑
        if (assembly.userId !== req.user.id) {
            return res.status(401).json({error: 1, code: 'assembly.edit.forbidden'});
        }

        // 构建更新数据
        const updateData: any = {
            name: sanitizeRichText(name),
            updatedTime: db.fn.now(),
            data: JSON.stringify(data),
        };

        if (description) updateData.description = sanitizeRichText(description);
        if (tags) updateData.tags = JSON.stringify(handlingLabels(tags));
        if (visibility) updateData.visibility = visibility;
        if (attr) updateData.attr = JSON.stringify(assemblySetAttributes(assembly.attr, attr, false));


        // 执行更新
        await db('assembly')
            .where('uuid', uuid)
            .andWhere('userId', req.user.id)
            .update(updateData);

        res.status(200).json({code: 'assembly.edit.ok'});
    } catch (error) {
        logger.error('update error:', error);
        res.status(500).json({error: 1, code: 'assembly.edit.error'});
    }
});

/**
 * 编辑配装设置
 * 路由: POST /attr/edit
 */
router.post('/attr/edit', verifyJWT, [
    checkbody('uuid').isString().trim().isLength({min: 1}),
    checkbody('attr').optional({nullable: true}).isObject(),
    checkbody('visibility').optional().isIn(['publicly', 'private']),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'assembly.editAttr.bad', message: validateErr.array()});

        const {uuid, attr, visibility} = req.body;

        const assembly = await db('assembly')
            .where('uuid', uuid)
            .andWhere('userId', req.user.id)
            .first();

        if (!assembly) {
            return res.status(404).json({error: 1, code: 'assembly.editAttr.notFound'});
        }

        if (attr?.password) {
            if (!/^[a-zA-Z0-9_]+$/.test(attr.password)) {
                return res.status(401).json({
                    error: 1,
                    code: 'assembly.editAttr.invalidPassword',
                    message: 'Password can only contain letters, numbers and underscores'
                });
            }

            if (attr.password.length < 4) {
                return res.status(401).json({
                    error: 1,
                    code: 'assembly.editAttr.passwordTooShort',
                    message: 'Password must be at least 4 characters'
                });
            }
        }

        const updateData: any = {
            updatedTime: db.fn.now()
        };

        if (visibility) updateData.visibility = visibility;
        if (attr) updateData.attr = JSON.stringify(assemblySetAttributes(assembly.attr, attr, false));

        await db('assembly')
            .where('uuid', uuid)
            .andWhere('userId', req.user.id)
            .update(updateData);

        res.status(200).json({code: 'assembly.editAttr.ok'});
    } catch (error) {
        logger.error('update editAttr error:', error);
        res.status(500).json({error: 1, code: 'assembly.editAttr.error'});
    }
});


/**
 * 获取配装设置
 * 路由: GET /attr
 */
router.get('/attr', verifyJWT, [
    checkquery('uuid').isString().trim().isLength({min: 1}),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'assembly.getAttr.bad', message: validateErr.array()});

        const {uuid} = req.query;

        const assembly = await db('assembly')
            .where('uuid', uuid)
            .where('userId', req.user.id)
            .select('assembly.uuid', 'assembly.attr', 'assembly.visibility')
            .first();

        // 检查配装是否存在
        if (!assembly) {
            return res.status(404).json({error: 1, code: 'assembly.getAttr.notFound'});
        }

        const data = {
            ...assembly || {},
            password: assembly.attr && assembly.attr.password ? '******' : '',
            attr: assemblyShowAttributes(assembly.attr, {includeDefaults: true})
        }

        res.status(200).json({code: 'assembly.getAttr.ok', data});
    } catch (error) {
        logger.error('update editAttr error:', error);
        res.status(500).json({error: 1, code: 'assembly.editAttr.error'});
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
    checkquery('password').optional({nullable: true}).isString().trim().matches(/^[a-zA-Z0-9_]+$/).isLength({min: 1, max: 32}),
], supposeBackJWT, async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'detail.detail.bad', message: validateErr.array()});

        const {uuid, password} = req.query;

        const assembly = await db('assembly')
            .leftJoin('users', 'assembly.userId', 'users.id')
            .where('assembly.uuid', uuid)
            .select(
                'users.username', 'users.id as userId',
                'assembly.uuid', 'assembly.userId', 'assembly.name', 'assembly.description',
                'assembly.visibility', 'assembly.attr', 'assembly.cloningUuid',
                'assembly.createdTime', 'assembly.updatedTime', 'assembly.attr', 'assembly.tags', 'assembly.data as assembly'
            )
            .first();

        if (!assembly) {
            return res.status(404).json({error: 1, code: 'assembly.detail.notFound'});
        }

        const isOwner = req.user && req.user.id === assembly.userId;

        if (!isOwner) {
            if (assembly.visibility === 'private') {
                return res.status(200).json({
                    error: 1,
                    code: 'assembly.detail.notDisclosed',
                    data: {
                        isVisibility: false
                    }
                });
            }

            if (assembly.attr.password && assembly.attr.password !== password) {
                return res.status(401).json({
                    error: 1,
                    code: 'assembly.detail.noPermission',
                    data: {
                        isPassword: true
                    }
                });
            }
        }

        const assemblyIsHasPassword = !!assembly.attr.password;
        if (assembly.attr)
            assembly.attr = assemblyShowAttributes(assembly.attr, {includeDefaults: true});

        res.status(200).json({
            code: 'assembly.detail.ok',
            data: {
                ...assembly,
                isVisibility: true,
                isOwner: isOwner,
                isPassword: assemblyIsHasPassword
            },
        });
    } catch (error) {
        logger.error('detail error:', error);
        res.status(500).json({error: 1, code: 'assembly.detail.error'});
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
            return res.status(400).json({error: 1, code: 'assembly.delete.bad', message: validateErr.array()});

        const {uuid} = req.body;

        // 检查配装是否存在
        const assembly = await db('assembly')
            .where('uuid', uuid)
            .andWhere('userId', req.user.id)
            .first();

        if (!assembly) {
            return res.status(404).json({error: 1, code: 'assembly.delete.notFound'});
        }

        // 检查用户是否有权限删除
        if (assembly.userId !== req.user.id) {
            return res.status(403).json({error: 1, code: 'assembly.delete.forbidden'});
        }

        // 执行删除
        await db('assembly')
            .where('uuid', uuid)
            .delete();

        // 点赞， 软删除
        await db('likes')
            .where('targetId', uuid)
            .andWhere('targetType', 'assembly')
            .andWhere('valid', 1)
            .update({
                valid: 0
            })

        // 评论和回复， 软删除
        await db('comments')
            .where('targetId', uuid)
            .andWhere('targetType', 'assembly')
            .andWhere('valid', 1)
            .update({
                valid: 0
            })

        await db('replies')
            .where('targetId', uuid)
            .andWhere('targetType', 'assembly')
            .andWhere('valid', 1)
            .update({
                valid: 0
            })

        res.status(200).json({code: 'assembly.delete.ok'});
    } catch (error) {
        logger.error('delete error:', error);
        res.status(500).json({error: 1, code: 'assembly.delete.error'});
    }
});

export default router;
