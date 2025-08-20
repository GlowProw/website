import express from 'express';
import {ICalCalendar} from 'ical-generator';
import {query as checkquery} from "express-validator/lib/middlewares/validation-chain-builders";
import {validationResult} from "express-validator";
import {calendarRateLimiter} from "../middleware/rateLimiter";
import i18n from "../../i18n";
import config from "../../config";
import logger from "../../logger";
import {fileURLToPath} from "node:url";
import path from "path";
import redis from '../../redis';
import fs from "fs/promises";
import {allowPrivileges} from "../lib/auth";
import {verifyJWT} from "../middleware/auth";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data/calendar');

// Redis键前缀
const REDIS_PREFIX = 'calendar:',
    CACHE_TTL = 10 * 24 * 60 * 60 // 缓存时间：10天（秒）

/**
 * 从Redis获取缓存数据，如果不存在则从文件加载并缓存
 * @param season 赛季ID
 * @returns 返回该赛季的事件数据对象
 */
async function loadGameEventsData(season: string): Promise<any> {
    const redisKey = `${REDIS_PREFIX}.season:${season}`;

    try {
        // 尝试从Redis获取缓存
        const cachedData = await redis.get(redisKey);
        if (cachedData) {
            if (config.__DEBUG__)
                logger.info(`by Redis Load season Data: ${season}`);
            return JSON.parse(cachedData);
        }

        // 缓存不存在，从文件加载
        const seasonPath = path.join(DATA_DIR, season, 'index.json');
        const fileData = await fs.readFile(seasonPath, 'utf-8');
        const parsedData = JSON.parse(fileData);

        // 将数据缓存到Redis
        await redis.setex(redisKey, CACHE_TTL, JSON.stringify(parsedData));
        if (config.__DEBUG__)
            logger.info(`by local File Load season Data: ${season}`);

        return parsedData;
    } catch (err) {
        logger.error(`load season error: ${season}`, err);
        return {events: {}};
    }
}

/**
 * 清除指定赛季的Redis缓存
 * @param season 赛季ID
 */
async function clearSeasonCache(season: string): Promise<void> {
    const redisKey = `${REDIS_PREFIX}.season:${season}`;
    try {
        await redis.del(redisKey);
        logger.info(`clear ok: ${season}`);
    } catch (err) {
        logger.error(`clear error: ${season}`, err);
    }
}

/**
 * 获取ICS日历内容的Redis缓存键
 */
function getCalendarCacheKey(type: 'events' | 'event', params: any): string {
    const {season, language, eventId, occurrenceIndex} = params;
    let key = `${REDIS_PREFIX}.ics:${type}:${season}:${language}`;

    if (type === 'event') {
        key += `:${eventId}`;
        if (occurrenceIndex !== undefined) {
            key += `:${occurrenceIndex}`;
        }
    }

    return key;
}

/**
 * 获取赛季原始数据
 * 路由: GET /data
 * 参数:
 *   - season: 赛季ID (必填)
 */
router.get('/data', [
    checkquery("season").isString().isLength({min: 1, max: 255}),
], async (req: any, res: any) => {
    try {
        // 验证请求参数
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'data.bad', message: validateErr.array()});

        const {season} = req.query;

        // 加载当前赛季的事件数据（现在会使用Redis缓存）
        const gameEventsData = await loadGameEventsData(season);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', `public, max-age=${config.__DEBUG__ ? 0 : 10 * 24 * 60 * 60}`);
        res.json({
            code: 0,
            data: gameEventsData
        });
    } catch (e) {
        logger.error(e);
        res.status(500).json({code: 'data.error'});
    }
});

/**
 * 获取赛季所有事件的ICS日历（带Redis缓存）
 */
router.get('/events.ics', calendarRateLimiter, [
    checkquery("season").isLength({min: 1, max: 255}),
    checkquery("language").isIn(config.i18n.locales),
], async (req: any, res: any) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'events.bad', message: validateErr.array()});

        const {season, language} = req.query;
        const cacheKey = getCalendarCacheKey('events', {season, language});

        // 尝试从Redis获取缓存的ICS内容
        const cachedICS = await redis.get(cacheKey);
        if (cachedICS) {
            // 从Redis缓存获取ICS日历
            res.setHeader('Content-Type', 'text/calendar');
            res.setHeader('Content-Disposition', 'attachment; filename="game-events.ics"');
            return res.send(cachedICS);
        }

        // 缓存不存在，生成新的ICS内容
        const gameEventsData = await loadGameEventsData(season);
        const cal = new ICalCalendar({
            name: await i18n.translate(`${season}.name`, language) || 'season name',
            url: req.protocol + '://' + req.get('host') + req.originalUrl,
            prodId: {company: 'Ubisoft', product: 'GameEventsCalendar'},
            ttl: 60 * 60
        });

        const eventsToAdd: any[] = [];
        const currentYear = new Date().getFullYear();

        for (const e of Object.values(gameEventsData.events)) {
            let event: any = e;
            for (const occurrence of event.occurrences) {
                const startDate = new Date(currentYear, occurrence.month - 1, occurrence.day, 12, 0, 0);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + event.duration);

                eventsToAdd.push({
                    uid: `${event.id}-${occurrence.month}-${occurrence.day}-${currentYear}`,
                    start: startDate,
                    end: endDate,
                    summary: await i18n.translate(`${season}.data.${event.id}.name`, language),
                    description: await i18n.translate(`${season}.data.${event.id}.description`, language) || '',
                    allDay: true,
                    location: 'In-Game',
                    url: `${req.$AppBaseUrl}/calendar`,
                });
            }
        }

        cal.events(eventsToAdd);
        const icsContent = cal.toString();

        // 缓存ICS内容到Redis（缓存1小时）
        await redis.setex(cacheKey, 3600, icsContent);

        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', 'attachment; filename="game-events.ics"');
        res.send(icsContent);
    } catch (e) {
        logger.error(e);
        res.status(500).json({code: 'events.error'});
    }
});

/**
 * 获取单个事件的ICS日历（带Redis缓存）
 */
router.get('/event.ics', calendarRateLimiter, [
    checkquery("season").isLength({min: 1, max: 255}),
    checkquery("language").isIn(config.i18n.locales),
    checkquery("eventId").isLength({min: 1, max: 255}),
    checkquery("occurrenceIndex").optional().isInt({min: 0}).toInt(),
], async (req: any, res: any) => {
    try {
        const validateErr = validationResult(req);
        if (!validateErr.isEmpty())
            return res.status(400).json({error: 1, code: 'events.bad', message: validateErr.array()});

        const {season, language, eventId, occurrenceIndex} = req.query;
        const cacheKey = getCalendarCacheKey('event', {season, language, eventId, occurrenceIndex});

        // 尝试从Redis获取缓存的ICS内容
        const cachedICS = await redis.get(cacheKey);
        if (cachedICS) {
            // 缓存获取单个事件
            res.setHeader('Content-Type', 'text/calendar');
            res.setHeader('Content-Disposition', `attachment; filename="${eventId}${occurrenceIndex !== undefined ? `-${occurrenceIndex}` : ''}.ics"`);
            return res.send(cachedICS);
        }

        // 缓存不存在，生成新的ICS内容
        const gameEventsData = await loadGameEventsData(season);
        const event = gameEventsData.events[eventId];

        if (!event) {
            return res.status(404).json({error: 1, code: 'event.notFound'});
        }

        const cal = new ICalCalendar({
            name: await i18n.translate(`${season}.data.${eventId}.name`, language) || 'event name',
            url: req.protocol + '://' + req.get('host') + req.originalUrl,
            prodId: {company: 'Ubisoft', product: 'GameEventsCalendar'},
            ttl: 60 * 60
        });

        const eventsToAdd: any[] = [];
        const currentYear = new Date().getFullYear();

        if (occurrenceIndex !== undefined) {
            if (occurrenceIndex >= event.occurrences.length || occurrenceIndex < 0) {
                // 无效的事件发生索引
                return res.status(400).json({error: 1, code: 'event.invalidOccurrence'});
            }

            const occurrence = event.occurrences[occurrenceIndex];
            const startDate = new Date(currentYear, occurrence.month - 1, occurrence.day, 12, 0, 0);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + event.duration);

            eventsToAdd.push({
                uid: `${eventId}-${occurrenceIndex}-${currentYear}`,
                start: startDate,
                end: endDate,
                summary: await i18n.translate(`${season}.data.${eventId}.name`, language),
                description: await i18n.translate(`${season}.data.${eventId}.description`, language) || '',
                allDay: true,
                location: 'In-Game',
                url: `${req.$AppBaseUrl}/calendar`,
            });
        } else {
            for (const occurrence of event.occurrences) {
                const index = event.occurrences.indexOf(occurrence);
                const startDate = new Date(currentYear, occurrence.month - 1, occurrence.day, 12, 0, 0);
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + event.duration);

                eventsToAdd.push({
                    uid: `${eventId}-${index}-${currentYear}`,
                    start: startDate,
                    end: endDate,
                    summary: await i18n.translate(`${season}.data.${eventId}.name`, language),
                    description: await i18n.translate(`${season}.data.${eventId}.description`, language) || '',
                    allDay: true,
                    location: 'In-Game',
                    url: `${req.$AppBaseUrl}/calendar`,
                });
            }
        }

        cal.events(eventsToAdd);
        const icsContent = cal.toString();

        // 缓存ICS内容到Redis（缓存1小时）
        await redis.setex(cacheKey, 3600, icsContent);

        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', `attachment; filename="${eventId}${occurrenceIndex !== undefined ? `-${occurrenceIndex}` : ''}.ics"`);
        res.send(icsContent);
    } catch (e) {
        logger.error(e);
        res.status(500).json({code: 'events.error'});
    }
});

/**
 * 清除缓存端点（用于开发或数据更新时）
 */
router.post('/clear-cache', verifyJWT, allowPrivileges(["super"]), [
    checkquery("season").isString().isLength({min: 1, max: 255}),
], async (req: any, res: any) => {
    try {
        const {season} = req.query;
        await clearSeasonCache(season);
        res.json({code: 0, message: 'cache.ok'});
    } catch (e) {
        logger.error(e);
        res.status(500).json({code: 'cache.error'});
    }
});

export default router;
