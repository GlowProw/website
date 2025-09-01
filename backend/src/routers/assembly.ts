import express, {Response} from "express";

import logger from "../../logger";
import db from "../../mysql";
import redis from "../../redis";
import {v6 as uuidV6} from "uuid"

import {body as checkBody, query as checkQuery, validationResult} from "express-validator";
import {supposeBackJWT, verifyJWT} from "../middleware/auth";
import {sanitizeRichText, xss} from "../lib/content";
import {forbidPrivileges} from "../lib/auth";
import {getGravatarAvatar} from "../lib/gravatar";

import attrHandle from "../lib/attr";
import {RequestHasAccount} from "../types/auth";
import config from "../../config";

const router = express.Router();
const assemblyConfig = {
    nameMaxLength: 140,
    descriptionMaxLength: 10000
}

// 缓存键前缀
const CACHE_PREFIX = 'assembly:';
const CACHE_TTL = config.__DEBUG__ ? 10 : 24 * 60 * 60; // 1天

/**
 * 获取缓存键
 */
function getCacheKey(uuid: string, type: 'detail' | 'list' | 'attr' = 'detail'): string {
    return `${CACHE_PREFIX}${type}:${uuid}`;
}

/**
 * 清除配装相关缓存
 */
async function clearAssemblyCache(uuid: string): Promise<void> {
    try {
        const keys = [
            getCacheKey(uuid, 'detail'),
            getCacheKey(uuid, 'attr')
        ];

        // 同时清除相关的列表缓存
        const listPattern = `${CACHE_PREFIX}list:*`;
        const listKeys = await redis.keys(listPattern);

        const keysToDelete = [...keys, ...listKeys];
        if (keysToDelete.length > 0) {
            await redis.del(keysToDelete);
        }
    } catch (error) {
        logger.error('Clear assembly cache error:', error);
    }
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
 * 发布
 * 必须配装，可选轮盘
 */
router.post('/publish', verifyJWT, forbidPrivileges(['blacklisted', 'freezed']), [
    checkBody("name").isString().trim().isLength({min: 1, max: assemblyConfig.nameMaxLength}),
    checkBody('description').optional().isString().trim().isLength({max: assemblyConfig.descriptionMaxLength}),
    checkBody('assembly.tags').optional().isArray(),
    checkBody('assembly.data').isObject(),
    checkBody('assembly.attr').optional({nullable: true}).isObject(),
    checkBody('assembly.visibility').optional().default('publicly').isIn(['publicly', 'private']),
    checkBody('wheel.data').optional({nullable: true}).isArray(),
    checkBody('wheel.attr').optional({nullable: true}).isObject(),
    checkBody('warehouse.data').optional({nullable: true}).isArray(),
    checkBody('warehouse.attr').optional({nullable: true}).isObject(),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'publish.bad', message: validateErr.array()});

        const {name, description, assembly, wheel, warehouse} = req.body,
            {attr: assemblyAttr = {}, data: assemblyData, tags, visibility} = assembly,
            {attr: wheelAttr = {}, data: wheelData} = wheel,
            {attr: warehouseAttr = {}, data: warehouseData} = warehouse;

        // 检查配装名称是否已存在
        const existingAssembly = await db('assembly')
            .where('name', name)
            .andWhere('userId', req.user.id)
            .first();

        if (existingAssembly) {
            return res.status(400).json({
                error: 1,
                code: 'publish.nameExists',
            });
        }

        // 准备插入数据库的数据
        let assemblyInsertData: any = {
                name,
                description,
                uuid: uuidV6(),
                data: assemblyData && JSON.stringify(assemblyData || {}),
                userId: req.user.id,
                visibility: visibility,
                createdTime: db.fn.now(),
                updatedTime: db.fn.now(),
            },
            wheelInsertData: any = {
                userId: req.user.id,
                uuid: uuidV6(),
                attr: wheelAttr,
                data: wheelData && JSON.stringify(wheelData || {}),
                creationTime: db.fn.now(),
                updatedTime: db.fn.now(),
            },
            warehouseInsertData: any = {
                userId: req.user.id,
                uuid: uuidV6(),
                attr: warehouseAttr,
                data: warehouseData && JSON.stringify(warehouseData || {}),
                creationTime: db.fn.now(),
                updatedTime: db.fn.now(),
            },
            result: any = {}

        if (wheelAttr) wheelInsertData.attr = JSON.stringify(attrHandle.assemblySetAttributes(wheelInsertData.attr || {}, wheelAttr, false));
        if (wheelData) wheelInsertData.data = wheelData;
        if (warehouseAttr) warehouseInsertData.attr = JSON.stringify(attrHandle.assemblySetAttributes(warehouseInsertData.attr || {}, warehouseAttr, false));
        if (warehouseData) warehouseInsertData.data = warehouseData;
        if (assemblyAttr) assemblyInsertData.attr = JSON.stringify(attrHandle.assemblySetAttributes(assemblyInsertData.attr || {}, assemblyAttr, false));
        if (tags) assemblyInsertData.tags = JSON.stringify(handlingLabels(tags));

        // 新增轮盘
        if (wheelData) {
            const [insertedWheelId] = await db('wheel')
                .insert(wheelInsertData)
                .returning('id');
            result['wheel.id'] = insertedWheelId
        }

        // 新增船仓
        if (warehouseData) {
            const [insertedWarehouseId] = await db('warehouse')
                .insert(wheelInsertData)
                .returning('id');
            result['warehouse.id'] = insertedWarehouseId
        }

        if (result['wheel.id']) assemblyInsertData.wheelId = result['wheel.id'] || null
        if (result['warehouse.id']) assemblyInsertData.warehouseId = result['warehouse.id'] || null

        // 新增配装
        const [insertedAssemblyId] = await db('assembly')
            .insert(assemblyInsertData)
            .returning('id');
        result['assembly.id'] = insertedAssemblyId

        res.status(200).json({
            code: 'publish.success',
            data: result
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
    checkQuery('keyword').optional().isString().trim(),
    checkQuery('sortField').optional().isIn(['createdTime', 'updatedTime', 'likes']),
    checkQuery('sortOrder').optional().isIn(['asc', 'desc']),
    checkQuery('isHasPassword').optional().default(false).isBoolean(),
    checkQuery('createdStart').optional().isISO8601(),
    checkQuery('createdEnd').optional().isISO8601(),
    checkQuery('updatedStart').optional().isISO8601(),
    checkQuery('updatedEnd').optional().isISO8601(),
    checkQuery('page').optional().isInt({min: 1}).toInt(),
    checkQuery('pageSize').optional().isInt({min: 1, max: 100}).toInt(),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty()) {
            return res.status(400).json({error: 1, code: 'assembly.list.bad', message: validateErr.array()});
        }

        const {
            keyword,
            page = 1,
            pageSize = 10,
            sortField = 'updatedTime',
            sortOrder = 'desc',
            isHasPassword,
            createdStart,
            createdEnd,
            updatedStart,
            updatedEnd
        } = req.query;

        // 生成缓存键
        const cacheKey = getCacheKey(`list:${JSON.stringify(req.query)}`, 'list');

        // 尝试从缓存获取
        try {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                return res.status(200).json(JSON.parse(cachedData));
            }
        } catch (cacheError) {
            logger.warn('Redis cache read error:', cacheError);
        }

        // 基础查询
        let query = db('assembly')
            .select(
                'assembly.uuid',
                'assembly.name',
                'assembly.attr',
                'assembly.data as assembly',
                db.raw('(SELECT COUNT(*) FROM likes WHERE targetType = "assembly" AND targetId = assembly.uuid) as likes'),
                db.raw(`CASE WHEN assembly.attr->>"$.isAnonymous" = 'true' THEN NULL ELSE assembly.userId END as userId`),
                db.raw(`CASE WHEN assembly.attr->>"$.isAnonymous" = 'true' THEN NULL ELSE users.username END as username`)
            )
            .where('assembly.visibility', '=', 'publicly')
            .where(function () {
                this.where(db.raw('assembly.attr->>"$.password"'), !isHasPassword ? '!=' : '=', '');
            })
            .leftJoin('users', 'assembly.userId', 'users.id')
            .select('users.id as userId', 'users.username', 'users.alternativeName', 'users.email');

        // 关键词模糊查询
        if (keyword) {
            query = query.where(function () {
                this.where('assembly.name', 'like', `%${keyword}%`)
                    .orWhere('users.username', 'like', `%${keyword}%`);
            });
        }

        // 时间范围筛选
        if (createdStart) query = query.where('assembly.createdTime', '>=', createdStart);
        if (createdEnd) query = query.where('assembly.createdTime', '<=', createdEnd);
        if (updatedStart) query = query.where('assembly.updatedTime', '>=', updatedStart);
        if (updatedEnd) query = query.where('assembly.updatedTime', '<=', updatedEnd);

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

        // 获取总数
        let totalQuery = db('assembly')
            .leftJoin('users', 'assembly.userId', 'users.id')
            .where('assembly.visibility', 'publicly');

        if (keyword) {
            totalQuery = totalQuery.where(function () {
                this.where('assembly.name', 'like', `%${keyword}%`)
                    .orWhere('users.username', 'like', `%${keyword}%`)
            });
        }
        if (createdStart) totalQuery = totalQuery.where('createdTime', '>=', createdStart);
        if (createdEnd) totalQuery = totalQuery.where('createdTime', '<=', createdEnd);
        if (updatedStart) totalQuery = totalQuery.where('updatedTime', '>=', updatedStart);
        if (updatedEnd) totalQuery = totalQuery.where('updatedTime', '<=', updatedEnd);

        const totalResult = await totalQuery.count('* as count').first();
        const total = totalResult ? Number(totalResult.count) : 0;

        // 处理数据
        assemblies.map((data: any) => {
            data.userAvatar = data.email ? getGravatarAvatar(data.email) : null

            if (data.attr)
                data.attr = attrHandle.assemblyShowAttributes(data.attr)

            data.username = data.alternativeName || data.username

            if (data.attr.isAnonymous) {
                data.userAvatar = null
                data.userId = null
                data.username = null
            }

            delete data.email
            delete data.alternativeName
        })

        const responseData = {
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
        };

        // 缓存结果
        try {
            await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(responseData));
        } catch (cacheError) {
            logger.warn('Redis cache write error:', cacheError);
        }

        res.status(200).json(responseData);
    } catch (error) {
        logger.error('list error:', error);
        res.status(500).json({error: 1, code: 'assembly.list.error'});
    }
});

/**
 * 编辑配装
 */
router.post('/edit', verifyJWT, forbidPrivileges(['blacklisted', 'freezed']), [
    checkBody('uuid').isString().trim().isLength({min: 1}),
    checkBody("name").isString().trim().isLength({min: 1, max: assemblyConfig.nameMaxLength}),
    checkBody('description').optional({nullable: true}).isString().trim().isLength({max: assemblyConfig.descriptionMaxLength}),
    checkBody('assembly.tags').optional().isArray(),
    checkBody('assembly.data').isObject(),
    checkBody('assembly.attr').optional({nullable: true}).isObject(),
    checkBody('assembly.visibility').optional().default('publicly').isIn(['publicly', 'private']),
    checkBody('wheel.data').optional({nullable: true}).isArray(),
    checkBody('wheel.attr').optional({nullable: true}).isObject(),
    checkBody('warehouse.data').optional({nullable: true}).isArray(),
    checkBody('warehouse.attr').optional({nullable: true}).isObject(),
], async (req: RequestHasAccount, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'assembly.edit.bad', message: validateErr.array()});

        const {name, description, assembly, wheel = {}, warehouse = {}, uuid} = req.body,
            {attr: assemblyAttr, data: assemblyData, tags, visibility} = assembly,
            {attr: wheelAttr = {}, data: wheelData} = wheel,
            {attr: warehouseAttr = {}, data: warehouseData} = warehouse;

        // 检查配装是否存在
        const existingAssembly = await db('assembly')
            .where('uuid', uuid)
            .andWhere('userId', req.user.id)
            .first();

        if (!existingAssembly) {
            return res.status(404).json({error: 1, code: 'assembly.edit.notFound'});
        }

        if (existingAssembly.userId !== req.user.id) {
            return res.status(401).json({error: 1, code: 'assembly.edit.forbidden'});
        }

        // 构建更新数据
        const assemblyInsertData: any = {
                name: sanitizeRichText(name),
                updatedTime: db.fn.now(),
                data: JSON.stringify(assemblyData),
            },
            wheelInsertData: any = {
                creationTime: db.fn.now(),
                updatedTime: db.fn.now(),
            },
            warehouseInsertData: any = {
                creationTime: db.fn.now(),
                updatedTime: db.fn.now(),
            },
            result: any = {};

        if (wheelAttr) wheelInsertData.attr = JSON.stringify(attrHandle.assemblySetAttributes(wheelInsertData.attr || {}, wheelAttr, false));
        if (wheelData) wheelInsertData.data = JSON.stringify(wheelData);
        if (warehouseAttr) warehouseInsertData.attr = JSON.stringify(attrHandle.assemblySetAttributes(warehouseInsertData.attr || {}, warehouseAttr, false));
        if (warehouseData) warehouseInsertData.data = JSON.stringify(warehouseData);
        if (description) assemblyInsertData.description = sanitizeRichText(description);
        if (visibility) assemblyInsertData.visibility = visibility;
        if (assemblyAttr) assemblyInsertData.attr = JSON.stringify(attrHandle.assemblySetAttributes(assemblyInsertData.attr || {}, assemblyAttr, false));
        if (tags) assemblyInsertData.tags = JSON.stringify(handlingLabels(tags));

        // 更新或新增轮盘
        if (wheelData) {
            const checkWheelQuery = db('wheel').where('uuid', existingAssembly.wheelId)

            // 不存在
            if (!await checkWheelQuery.first()) {
                wheelInsertData.userId = req.user.id
                wheelInsertData.uuid = uuidV6()

                const [insertedWheelId] = await db('wheel')
                    .insert(wheelInsertData)
                    .returning('id');

                assemblyInsertData['wheelId'] = insertedWheelId
            } else {
                await checkWheelQuery.update(wheelInsertData)
            }
        }

        // 更新或新增船仓
        if (warehouseData) {
            const checkWarehouseQuery = db('warehouse').where('uuid', existingAssembly.warehouseId)

            // 不存在
            if (!await checkWarehouseQuery.first()) {
                warehouseInsertData.userId = req.user.id
                warehouseInsertData.uuid = uuidV6()

                const [insertedWarehouseId] = await db('warehouse')
                    .insert(warehouseInsertData)
                    .returning('id');

                assemblyInsertData['warehouseId'] = insertedWarehouseId
            } else {
                await checkWarehouseQuery.update(warehouseInsertData)
            }
        }

        // 执行更新
        await db('assembly')
            .where('uuid', uuid)
            .andWhere('userId', req.user.id)
            .update(assemblyInsertData);

        // 清除相关缓存
        await clearAssemblyCache(uuid);

        res.status(200).json({code: 'assembly.edit.ok'});
    } catch (error) {
        logger.error('update error:', error);
        res.status(500).json({error: 1, code: 'assembly.edit.error'});
    }
});

/**
 * 编辑属性设置
 * 包含配装/轮盘/船仓
 */
router.post('/attr/edit', verifyJWT, forbidPrivileges(['blacklisted', 'freezed']), [
    checkBody('uuid').isString().trim().isLength({min: 1}),
    checkBody('assembly.attr').optional({nullable: true}).isObject(),
    checkBody('assembly.visibility').optional().isIn(['publicly', 'private']),
    checkBody('wheel.attr').optional({nullable: true}).isObject(),
    checkBody('warehouse.attr').optional({nullable: true}).isObject(),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'assembly.editAttr.bad', message: validateErr.array()});

        const {uuid, assembly, wheel, warehouse} = req.body,
            {attr: assemblyAttr = {}, visibility: assemblyVisibility} = assembly,
            {attr: wheelAttr = {}} = wheel,
            {attr: warehouseAttr = {}} = warehouse;

        const query = await db('assembly')
            .leftJoin('wheel', 'assembly.wheelId', 'wheel.id')
            .leftJoin('warehouse', 'assembly.warehouseId', 'warehouse.id')
            .where('assembly.uuid', uuid)
            .andWhere('assembly.userId', req.user.id)
            .andWhere(function () {
                // (wheel.userId = req.user.id) OR (assembly.wheelId IS NULL)
                this.where('wheel.userId', req.user.id).orWhereNull('assembly.wheelId');
            })
            .andWhere(function () {
                // (warehouse.userId = req.user.id) OR (assembly.warehouseId IS NULL)
                this.where('warehouse.userId', req.user.id).orWhereNull('assembly.warehouseId');
            })
            .select(
                'assembly.id as assemblyId',
                'assembly.attr as assemblyAttr',
                'assembly.visibility as assemblyVisibility',
                'wheel.uuid as wheelUUid',
                'wheel.data as wheelAttr',
                'warehouse.uuid as warehouseUUid',
                'warehouse.data as warehouseAttr'
            )
            .first()

        if (!query) {
            return res.status(404).json({error: 1, code: 'assembly.editAttr.notFound'});
        }

        if (query?.password) {
            if (!/^[a-zA-Z0-9_]+$/.test(query.password)) {
                return res.status(401).json({
                    error: 1,
                    code: 'assembly.editAttr.invalidPassword',
                    message: 'Password can only contain letters, numbers and underscores'
                });
            }

            if (query.password.length < 4) {
                return res.status(401).json({
                    error: 1,
                    code: 'assembly.editAttr.passwordTooShort',
                    message: 'Password must be at least 4 characters'
                });
            }
        }

        let assemblyUpdateAttr: any = {
                updatedTime: db.fn.now()
            },
            wheelUpdateAttr: any = {
                updatedTime: db.fn.now()
            },
            warehouseUpdateAttr: any = {
                updatedTime: db.fn.now()
            };

        if (assemblyVisibility) assemblyUpdateAttr.visibility = assemblyVisibility;
        if (assemblyAttr) assemblyUpdateAttr.attr = JSON.stringify(attrHandle.assemblySetAttributes(query.assemblyAttr, assemblyAttr || {}, false));
        if (wheelAttr) wheelUpdateAttr.attr = JSON.stringify(attrHandle.wheelSetAttributes(query.wheelAttr, wheelAttr || {}, false));
        if (warehouseAttr) warehouseUpdateAttr.attr = JSON.stringify(attrHandle.warehouseSetAttributes(query.warehouseAttr, warehouseAttr || {}, false));

        await db('assembly')
            .where('uuid', uuid)
            .andWhere('userId', req.user.id)
            .update(assemblyUpdateAttr);

        if (wheelAttr && query.wheelId) {
            await db('assembly')
                .where('id', query.wheelId)
                .andWhere('userId', req.user.id)
                .update(wheelAttr);
        }

        if (warehouseAttr && query.warehouseId) {
            await db('assembly')
                .where('id', query.warehouseId)
                .andWhere('userId', req.user.id)
                .update(warehouseUpdateAttr);
        }

        // 清除相关缓存
        await clearAssemblyCache(uuid);

        res.status(200).json({code: 'assembly.editAttr.ok'});
    } catch (error) {
        logger.error('update editAttr error:', error);
        res.status(500).json({error: 1, code: 'assembly.editAttr.error'});
    }
});

/**
 * 获取属性设置
 */
router.get('/attr', verifyJWT, [
    checkQuery('uuid').isString().trim().isLength({min: 1}),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'assembly.getAttr.bad', message: validateErr.array()});

        const {uuid} = req.query;

        // 从缓存获取
        const cacheKey = getCacheKey(uuid, 'attr');
        try {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                return res.status(200).json(JSON.parse(cachedData));
            }
        } catch (cacheError) {
            logger.warn('Redis cache read error:', cacheError);
        }

        const query = await db('assembly')
            .leftJoin('wheel', 'assembly.wheelId', 'wheel.id')
            .leftJoin('warehouse', 'assembly.warehouseId', 'warehouse.id')
            .where('assembly.uuid', uuid)
            .andWhere('assembly.userId', req.user.id)
            .andWhere(function () {
                // (wheel.userId = req.user.id) OR (assembly.wheelId IS NULL)
                this.where('wheel.userId', req.user.id).orWhereNull('assembly.wheelId');
            })
            .andWhere(function () {
                // (warehouse.userId = req.user.id) OR (assembly.warehouseId IS NULL)
                this.where('warehouse.userId', req.user.id).orWhereNull('assembly.warehouseId');
            })
            .select(
                'assembly.id as assemblyId',
                'assembly.attr as assemblyAttr',
                'assembly.visibility as assemblyVisibility',
                'wheel.uuid as wheelUUid',
                'wheel.data as wheelAttr',
                'warehouse.uuid as warehouseUUid',
                'warehouse.data as warehouseAttr'
            )
            .first()

        if (!query.assemblyId) {
            return res.status(404).json({error: 1, code: 'assembly.getAttr.notFound'});
        }

        let data: any = {
            uuid,
            assembly: {
                visibility: query.assemblyVisibility,
                password: query.assemblyAttr && query.assemblyAttr.password ? '******' : '',
                attr: attrHandle.assemblyShowAttributes(query.assemblyAttr || {}, {includeDefaults: true})
            },
        }

        if (query.wheelUUid)
            data.wheel = {
                uuid: query.wheelUUid,
                attr: attrHandle.wheelShowAttributes(query.wheelAttr || {}, {includeDefaults: true})
            }

        if (query.warehouseUUid)
            data.warehouse = {
                uuid: query.warehouseUUid,
                attr: attrHandle.warehouseShowAttributes(query.warehouseAttr || {}, {includeDefaults: true})
            }

        const responseData = {code: 'assembly.getAttr.ok', data};

        // 缓存结果
        try {
            await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(responseData));
        } catch (cacheError) {
            logger.warn('Redis cache write error:', cacheError);
        }

        res.status(200).json(responseData);
    } catch (error) {
        logger.error('update editAttr error:', error);
        res.status(500).json({error: 1, code: 'assembly.editAttr.error'});
    }
});

/**
 * 获取配装详情
 */
router.get('/item', [
    checkQuery('uuid').isString().trim().isLength({min: 1}),
    checkQuery('password').optional({nullable: true}).isString().trim().matches(/^[a-zA-Z0-9_]+$/).isLength({min: 1, max: 32}),
    checkBody('force').optional().isBoolean({strict: true})
], supposeBackJWT, async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'detail.detail.bad', message: validateErr.array()});

        const {uuid, password, force: isForce = false} = req.query;
        const userId = req.user?.id || 'anonymous'; // 获取用户ID 或 匿名标识

        // 基于用户身份创建不同的缓存键
        const cacheKey = `${getCacheKey(uuid)}:user:${userId}`;

        let assemblyCacheDataResult = null

        // 从缓存获取
        if (!isForce) {
            try {
                const cachedData = await redis.get(cacheKey);
                if (cachedData) {
                    const assemblyCacheData = JSON.parse(cachedData)
                    const isOwnerCache = req.user && req.user.id === assemblyCacheData.userId;
                    const assemblyIsHasPasswordCache = !!assemblyCacheData.assembly.attr.password;

                    assemblyCacheDataResult = {
                        ...assemblyCacheData,
                        isVisibility: true,
                        isOwner: isOwnerCache,
                        isPassword: assemblyIsHasPasswordCache,
                        isForce
                    }

                    return res.status(200).json({
                        code: 'assembly.detail.ok',
                        data:assemblyCacheDataResult
                    });
                }
            } catch (cacheError) {
                logger.warn('Redis cache read error:', cacheError);
            }
        }

        const result = await db('assembly')
            .leftJoin('users', 'assembly.userId', 'users.id')
            .leftJoin('wheel', 'assembly.wheelId', 'wheel.id')
            .leftJoin('warehouse', 'assembly.warehouseId', 'warehouse.id')
            .where('assembly.uuid', uuid)
            .andWhere(function () {
                if (req.user && req.user.id)
                    this.where('assembly.userId', req.user.id)
            })
            .andWhere(function () {
                if (req.user && req.user.id)
                    this.where('wheel.userId', req.user.id).orWhereNull('assembly.wheelId');
            })
            .andWhere(function () {
                if (req.user && req.user.id)
                    this.where('warehouse.userId', req.user.id).orWhereNull('assembly.warehouseId');
            })
            .select(
                'users.username',
                'users.alternativeName',
                'users.id as userId',
                'users.email as userEmail',
                'assembly.id as assemblyId',
                'assembly.uuid',
                'assembly.userId',
                'assembly.name',
                'assembly.description',
                'assembly.visibility',
                'assembly.cloningUuid',
                'assembly.createdTime',
                'assembly.updatedTime',
                'assembly.tags',
                'assembly.data as assemblyData',
                'assembly.attr as assemblyAttr',
                'wheel.data as wheelData',
                'wheel.attr as wheelAttr',
                'warehouse.data as warehouseData',
                'warehouse.attr as warehouseAttr'
            )
            .first();

        if (!result.assemblyId) {
            return res.status(404).json({error: 1, code: 'assembly.detail.notFound'});
        }

        const isOwner = req.user && req.user.id === result.userId || false,
            data = {
                ...result,
                assembly: {
                    data: result.assemblyData || {},
                    attr: result.assemblyAttr || {}
                },
                wheel: {
                    data: result.wheelData || {},
                    attr: result.wheelAttr || {}
                },
                warehouse: {
                    data: result.warehouseData || {},
                    attr: result.warehouseAttr || {}
                }
            };

        if (!isOwner) {
            if (result.visibility === 'private') {
                const responseData = {
                    error: 1,
                    code: 'assembly.detail.notDisclosed',
                    data: {
                        isVisibility: false,
                        isForce
                    }
                };

                // 缓存私有状态的响应（使用用户特定的缓存键）
                try {
                    await redis.setex(cacheKey, 300, JSON.stringify(responseData)); // 5分钟缓存
                } catch (cacheError) {
                    logger.warn('Redis cache write error:', cacheError);
                }

                return res.status(200).json(responseData);
            }

            if (data.assembly.attr.password && data.assembly.attr.password !== password) {
                const responseData = {
                    error: 1,
                    code: 'assembly.detail.noPermission',
                    data: {
                        isPassword: true,
                        isForce
                    }
                };

                // 缓存密码保护状态的响应
                try {
                    await redis.setex(cacheKey, 300, JSON.stringify(responseData)); // 5分钟缓存
                } catch (cacheError) {
                    logger.warn('Redis cache write error:', cacheError);
                }

                return res.status(401).json(responseData);
            }
        }

        data.assembly.userAvatar = data.userEmail ? getGravatarAvatar(data.userEmail) : null;
        data.assembly.username = data.assembly.alternativeName || data.assembly.username;

        if (data.assembly.attr.isAnonymous) {
            data.assembly.userAvatar = null;
            data.assembly.userId = null;
            data.assembly.username = null;
        }

        const assemblyIsHasPassword = !!data.assembly.attr.password;
        if (data.assembly.attr)
            data.assembly.attr = attrHandle.assemblyShowAttributes(data.assembly.attr, {includeDefaults: true});

        delete data.alternativeName;
        delete data.userEmail;
        delete data.assemblyData
        delete data.assemblyAttr
        delete data.wheelData
        delete data.wheelAttr
        delete data.warehouseData
        delete data.warehouseAttr

        const responseData = {
            ...data,
            isVisibility: true,
            isPassword: assemblyIsHasPassword,
            isOwner,
            isForce
        };

        // 缓存结果
        try {
            await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(responseData));
        } catch (cacheError) {
            logger.warn('Redis cache write error:', cacheError);
        }

        res.status(200).json({
            code: 'assembly.detail.ok',
            data: responseData
        });
    } catch (error) {
        logger.error('detail error:', error);
        res.status(500).json({error: 1, code: 'assembly.detail.error'});
    }
});

/**
 * 删除配装
 */
router.post('/delete', verifyJWT, forbidPrivileges(['blacklisted', 'freezed']), [
    checkBody('uuid').isString().trim().isLength({min: 1}),
], async (req: any, res: Response) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'assembly.delete.bad', message: validateErr.array()});

        const {uuid} = req.body;

        const assembly = await db('assembly')
            .where('uuid', uuid)
            .andWhere('userId', req.user.id)
            .first();

        if (!assembly || assembly.valid == 0) {
            return res.status(404).json({error: 1, code: 'assembly.delete.notFound'});
        }

        if (assembly.userId !== req.user.id) {
            return res.status(403).json({error: 1, code: 'assembly.delete.forbidden'});
        }

        // 执行软删除
        // 由数据事件来移除valid=0，updatedTime 大于3个月
        await db('assembly')
            .where('uuid', uuid)
            .andWhere('valid', 1)
            .update({valid: 0});

        // 清理相关数据
        await db('wheel')
            .where('userId', req.user.id)
            .where('uuid', assembly.wheelId)
            .andWhere('valid', 1)
            .update({valid: 0});

        await db('warehouse')
            .where('userId', req.user.id)
            .where('uuid', assembly.warehouseId)
            .andWhere('valid', 1)
            .update({valid: 0});

        await db('likes')
            .where('targetId', uuid)
            .andWhere('targetType', 'assembly')
            .andWhere('valid', 1)
            .update({valid: 0});

        await db('comments')
            .where('targetId', uuid)
            .andWhere('targetType', 'assembly')
            .andWhere('valid', 1)
            .update({valid: 0});

        await db('replies')
            .where('targetId', uuid)
            .andWhere('targetType', 'assembly')
            .andWhere('valid', 1)
            .update({valid: 0});

        // 清除相关缓存
        await clearAssemblyCache(uuid);

        res.status(200).json({code: 'assembly.delete.ok'});
    } catch (error) {
        logger.error('delete error:', error);
        res.status(500).json({error: 1, code: 'assembly.delete.error'});
    }
});

export default router;
